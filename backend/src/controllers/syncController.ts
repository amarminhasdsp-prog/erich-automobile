import { Request, Response, NextFunction } from 'express';
import { runMobileDeSync } from '../sync/syncService';
import { getLastSyncResult, setLastSyncResult } from '../sync/syncStatusStore';
import { loadMobileDeConfig } from '../sync/mobileDeClient';

function isSyncEnabled(): boolean {
  return (process.env.MOBILE_DE_SYNC_ENABLED ?? 'false').trim().toLowerCase() === 'true';
}

// POST /api/admin/sync/mobile-de/run - Sync manuell anstossen.
// Nutzt dieselbe Orchestrierungslogik wie der Scheduler (siehe ADR-001,
// Voraussetzung: manueller Trigger unabhaengig vom Cron moeglich).
// Antwortet auch im deaktivierten/nicht konfigurierten Zustand mit 200 und
// einem entsprechenden status-Feld statt mit einem Fehler, da "Sync ist
// deaktiviert" ein normaler, erwarteter Zustand ist (kein Serverfehler).
export async function runMobileDeSyncNow(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await runMobileDeSync();
    setLastSyncResult(result);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/sync/mobile-de/status - letzter Lauf (Zeitstempel,
// Ergebnis-Zahlen, ggf. letzter Fehler). Im Prozessspeicher gehalten
// (siehe syncStatusStore.ts), keine eigene DB-Tabelle.
//
// Meldet den Konfigurationszustand (deaktiviert/nicht konfiguriert) auch
// dann, wenn noch kein Lauf stattgefunden hat - so kann der Nutzer sofort
// erkennen, warum kein Sync laeuft, ohne erst manuell einen Lauf anstossen
// zu muessen.
export async function getMobileDeSyncStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const lastResult = getLastSyncResult();
    if (lastResult) {
      return res.json(lastResult);
    }

    if (!isSyncEnabled()) {
      return res.json({
        status: 'DISABLED',
        message: 'mobile.de Sync ist deaktiviert (MOBILE_DE_SYNC_ENABLED=false). Es wurde noch kein Lauf ausgefuehrt.',
      });
    }

    if (!loadMobileDeConfig()) {
      return res.json({
        status: 'NOT_CONFIGURED',
        message:
          'mobile.de Sync ist aktiviert, aber nicht vollstaendig konfiguriert (Platzhalter-Zugangsdaten). ' +
          'Es wurde noch kein Lauf ausgefuehrt.',
      });
    }

    res.json({
      status: 'NEVER_RUN',
      message: 'Es wurde noch kein mobile.de Sync-Lauf ausgefuehrt.',
    });
  } catch (err) {
    next(err);
  }
}
