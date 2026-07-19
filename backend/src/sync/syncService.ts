// Orchestriert einen mobile.de-Sync-Lauf:
//   1. Konfiguration/Voraussetzungen pruefen (deaktiviert? nicht konfiguriert?)
//   2. Feed abrufen (mobileDeClient)
//   3. XML parsen (mobileDeXmlParser)
//   4. Sanity-Check (Abbruch ohne DB-Aenderung bei leerem/eingebrochenem Feed)
//   5. Pro Fahrzeug: mappen (vehicleMapper) + per externalId matchen (Create/Update)
//   6. Fotos fuer neue/geaenderte Fahrzeuge herunterladen (photoDownloader)
//   7. Fahrzeuge, die im Feed fehlen, per Soft-Delete auf status=VERKAUFT setzen
//   8. Ergebnis zurueckgeben + protokollieren
//
// Architektur-Grundlage: Recherche-Report Abschnitt 4 (insb. 4.3 Soft-Delete,
// 4.5 Fehlerbehandlung/Sanity-Check) und ADR-001 (Abschnitt 7).

import { prisma } from '../prisma';
import { loadMobileDeConfig, fetchMobileDeFeed, MobileDeFetchError } from './mobileDeClient';
import { parseMobileDeFeed, MobileDeXmlParseError } from './mobileDeXmlParser';
import { mapFeedVehicleToPrisma, VehicleMappingError } from './vehicleMapper';
import { downloadPhotos } from './photoDownloader';

export type SyncRunStatus = 'DISABLED' | 'NOT_CONFIGURED' | 'ABORTED' | 'SUCCESS' | 'ERROR';

export interface SyncRunResult {
  status: SyncRunStatus;
  startedAt: string;
  finishedAt: string;
  created: number;
  updated: number;
  archived: number;
  photoErrors: number;
  vehicleErrors: string[];
  message?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isSyncEnabled(): boolean {
  return (process.env.MOBILE_DE_SYNC_ENABLED ?? 'false').trim().toLowerCase() === 'true';
}

function getSanityCheckMaxDropPercent(): number {
  const raw = Number(process.env.MOBILE_DE_SANITY_CHECK_MAX_DROP_PERCENT);
  return Number.isFinite(raw) && raw > 0 && raw <= 100 ? raw : 50;
}

// Fuehrt einen vollstaendigen Sync-Lauf aus. Wird sowohl vom Scheduler
// (automatisch) als auch vom Admin-Endpunkt (manuell) aufgerufen - beide
// Aufrufer teilen sich dieselbe Logik, wie von ADR-001 gefordert.
export async function runMobileDeSync(): Promise<SyncRunResult> {
  const startedAt = nowIso();

  if (!isSyncEnabled()) {
    console.log('[syncService] mobile.de Sync deaktiviert (MOBILE_DE_SYNC_ENABLED=false)');
    return {
      status: 'DISABLED',
      startedAt,
      finishedAt: nowIso(),
      created: 0,
      updated: 0,
      archived: 0,
      photoErrors: 0,
      vehicleErrors: [],
      message: 'mobile.de Sync ist deaktiviert (MOBILE_DE_SYNC_ENABLED=false).',
    };
  }

  const config = loadMobileDeConfig();
  if (!config) {
    console.log(
      '[syncService] mobile.de Sync nicht konfiguriert (Platzhalter-Zugangsdaten). ' +
        'Echte Zugangsdaten muessen zuerst bei mobile.de erfragt werden, siehe docs/mobile-de-sync.md.'
    );
    return {
      status: 'NOT_CONFIGURED',
      startedAt,
      finishedAt: nowIso(),
      created: 0,
      updated: 0,
      archived: 0,
      photoErrors: 0,
      vehicleErrors: [],
      message:
        'mobile.de Sync ist aktiviert, aber nicht vollstaendig konfiguriert (Platzhalter-Zugangsdaten). ' +
        'Bitte MOBILE_DE_FEED_URL, MOBILE_DE_DEALER_ID und MOBILE_DE_API_KEY in der .env setzen.',
    };
  }

  try {
    const xml = await fetchMobileDeFeed(config);
    const feed = parseMobileDeFeed(xml);

    // Sanity-Check: Abbruch ohne DB-Aenderung, wenn der Feed leer ist oder die
    // Fahrzeuganzahl im Vergleich zum letzten bekannten Bestand stark
    // eingebrochen ist (Report Abschnitt 4.5, Schwellwert konfigurierbar).
    const previousCount = await prisma.vehicle.count({
      where: { externalSource: 'MOBILE_DE', status: { not: 'VERKAUFT' } },
    });
    const newCount = feed.vehicles.length;

    if (newCount === 0) {
      const message = 'Sanity-Check fehlgeschlagen: Feed enthaelt 0 Fahrzeuge. Lauf abgebrochen ohne DB-Aenderung.';
      console.error(`[syncService] ${message}`);
      return {
        status: 'ABORTED',
        startedAt,
        finishedAt: nowIso(),
        created: 0,
        updated: 0,
        archived: 0,
        photoErrors: 0,
        vehicleErrors: [],
        message,
      };
    }

    if (previousCount > 0) {
      const dropPercent = ((previousCount - newCount) / previousCount) * 100;
      const maxDropPercent = getSanityCheckMaxDropPercent();
      if (dropPercent > maxDropPercent) {
        const message =
          `Sanity-Check fehlgeschlagen: Fahrzeuganzahl im Feed (${newCount}) liegt ` +
          `${dropPercent.toFixed(1)}% unter dem letzten bekannten Bestand (${previousCount}), ` +
          `Schwellwert ${maxDropPercent}%. Lauf abgebrochen ohne DB-Aenderung.`;
        console.error(`[syncService] ${message}`);
        return {
          status: 'ABORTED',
          startedAt,
          finishedAt: nowIso(),
          created: 0,
          updated: 0,
          archived: 0,
          photoErrors: 0,
          vehicleErrors: [],
          message,
        };
      }
    }

    // Dealer ermitteln: aktuell Single-Tenant (ein Haendler), siehe Report
    // Abschnitt 10 (Annahmen). Der erste/einzige Dealer wird verwendet.
    const dealer = await prisma.dealer.findFirst();
    if (!dealer) {
      const message = 'Kein Dealer-Datensatz in der DB vorhanden. Lauf abgebrochen ohne DB-Aenderung.';
      console.error(`[syncService] ${message}`);
      return {
        status: 'ERROR',
        startedAt,
        finishedAt: nowIso(),
        created: 0,
        updated: 0,
        archived: 0,
        photoErrors: 0,
        vehicleErrors: [],
        message,
      };
    }

    let created = 0;
    let updated = 0;
    let photoErrors = 0;
    const vehicleErrors: string[] = [];
    const seenExternalIds: string[] = [];

    for (const feedVehicle of feed.vehicles) {
      try {
        seenExternalIds.push(feedVehicle.externalId);
        const mapped = mapFeedVehicleToPrisma(feedVehicle);

        const existing = await prisma.vehicle.findUnique({
          where: { externalId: mapped.externalId },
        });

        let vehicleId: string;
        let isNewOrChanged: boolean;

        if (existing) {
          await prisma.vehicle.update({
            where: { id: existing.id },
            data: { ...mapped, lastSyncedAt: new Date() },
          });
          vehicleId = existing.id;
          isNewOrChanged = true; // konservativ: bei jedem Sync als "geaendert" behandeln, Report Abschnitt 4.4 Deduplizierungs-Empfehlung ist als Folgeverbesserung vermerkt (siehe README)
          updated += 1;
        } else {
          const createdVehicle = await prisma.vehicle.create({
            data: { ...mapped, dealerId: dealer.id, lastSyncedAt: new Date() },
          });
          vehicleId = createdVehicle.id;
          isNewOrChanged = true;
          created += 1;
        }

        if (isNewOrChanged && feedVehicle.images.length > 0) {
          const photoResult = await downloadPhotos(feedVehicle.images);
          photoErrors += photoResult.failed.length;

          if (photoResult.downloaded.length > 0) {
            const existingPhotoCount = await prisma.photo.count({ where: { vehicleId } });
            await prisma.$transaction(
              photoResult.downloaded.map((photo, idx) =>
                prisma.photo.create({
                  data: {
                    vehicleId,
                    filename: photo.filename,
                    originalName: photo.originalName,
                    isMain: existingPhotoCount === 0 && (photo.isMain || idx === 0),
                    sortOrder: existingPhotoCount + idx,
                  },
                })
              )
            );
          }
        }
      } catch (err) {
        const message =
          err instanceof VehicleMappingError
            ? err.message
            : `Unerwarteter Fehler bei Fahrzeug ${feedVehicle.externalId}: ${
                err instanceof Error ? err.message : String(err)
              }`;
        console.error(`[syncService] ${message}`);
        vehicleErrors.push(message);
      }
    }

    // Soft-Delete: Fahrzeuge, die zu diesem Dealer/dieser Quelle gehoeren,
    // aber im aktuellen Feed nicht mehr vorkommen, werden auf VERKAUFT
    // gesetzt statt hart geloescht (Report Abschnitt 4.3).
    const archiveResult = await prisma.vehicle.updateMany({
      where: {
        externalSource: 'MOBILE_DE',
        status: { not: 'VERKAUFT' },
        externalId: { notIn: seenExternalIds.length > 0 ? seenExternalIds : ['__none__'] },
      },
      data: { status: 'VERKAUFT', lastSyncedAt: new Date() },
    });

    const result: SyncRunResult = {
      status: 'SUCCESS',
      startedAt,
      finishedAt: nowIso(),
      created,
      updated,
      archived: archiveResult.count,
      photoErrors,
      vehicleErrors,
    };

    console.log(
      `[syncService] Sync-Lauf abgeschlossen: ${created} neu, ${updated} aktualisiert, ` +
        `${archiveResult.count} archiviert, ${photoErrors} Foto-Fehler, ${vehicleErrors.length} Fahrzeug-Fehler`
    );

    return result;
  } catch (err) {
    const message =
      err instanceof MobileDeFetchError || err instanceof MobileDeXmlParseError
        ? err.message
        : `Unerwarteter Fehler im Sync-Lauf: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[syncService] Sync-Lauf fehlgeschlagen, keine DB-Aenderung: ${message}`);
    return {
      status: 'ERROR',
      startedAt,
      finishedAt: nowIso(),
      created: 0,
      updated: 0,
      archived: 0,
      photoErrors: 0,
      vehicleErrors: [],
      message,
    };
  }
}
