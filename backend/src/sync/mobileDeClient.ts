// HTTP-Client fuer den Abruf des mobile.de-Fahrzeug-Feeds.
//
// WICHTIG: mobile.de bietet aktuell keine oeffentlich buchbare Self-Service-
// API. URL, Dealer-ID und API-Key sind Platzhalter, bis der Nutzer echte
// Zugangsdaten bei mobile.de erfragt hat (siehe docs/mobile-de-sync.md).
// Dieser Client darf bei fehlender/unvollstaendiger Konfiguration oder bei
// Netzwerkfehlern NIEMALS den Prozess crashen lassen - er gibt stattdessen
// einen klar typisierten Fehler zurueck, den syncService.ts abfangen kann.

export class MobileDeConfigError extends Error {}
export class MobileDeFetchError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export interface MobileDeClientConfig {
  feedUrl: string;
  dealerId: string;
  apiKey: string;
  timeoutMs: number;
}

// Liest die Konfiguration aus den Umgebungsvariablen. Gibt `null` zurueck
// (statt zu werfen), wenn eine der Pflicht-Variablen fehlt oder noch den
// Platzhalterwert "REPLACE_ME" enthaelt - das ist der erwartete Zustand,
// solange keine echten Zugangsdaten von mobile.de vorliegen.
export function loadMobileDeConfig(): MobileDeClientConfig | null {
  const feedUrl = process.env.MOBILE_DE_FEED_URL?.trim();
  const dealerId = process.env.MOBILE_DE_DEALER_ID?.trim();
  const apiKey = process.env.MOBILE_DE_API_KEY?.trim();
  const timeoutMsRaw = process.env.MOBILE_DE_FEED_TIMEOUT_MS?.trim();

  const isPlaceholder = (value: string | undefined) =>
    !value || value.includes('REPLACE_ME');

  if (isPlaceholder(feedUrl) || isPlaceholder(dealerId) || isPlaceholder(apiKey)) {
    return null;
  }

  const timeoutMs = Number(timeoutMsRaw);
  return {
    feedUrl: feedUrl as string,
    dealerId: dealerId as string,
    apiKey: apiKey as string,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000,
  };
}

// Ruft den XML-Feed per HTTPS GET ab. Authentifizierung erfolgt ueber einen
// Auth-Header (X-Api-Key) UND als Query-Parameter (apiKey), da nicht
// verifiziert ist, welches Verfahren ein spaeterer echter mobile.de-/Partner-
// Zugang tatsaechlich erwartet (siehe Recherche-Report Abschnitt 2). Sobald
// das echte Verfahren bekannt ist, kann hier eines der beiden entfernt
// werden.
export async function fetchMobileDeFeed(config: MobileDeClientConfig): Promise<string> {
  const url = new URL(config.feedUrl);
  url.searchParams.set('dealerId', config.dealerId);
  url.searchParams.set('apiKey', config.apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Api-Key': config.apiKey,
        Accept: 'application/xml, text/xml',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new MobileDeFetchError(
        `mobile.de Feed-Abruf fehlgeschlagen: HTTP ${response.status} ${response.statusText}`
      );
    }

    const body = await response.text();
    if (!body || body.trim().length === 0) {
      throw new MobileDeFetchError('mobile.de Feed-Antwort war leer');
    }
    return body;
  } catch (err) {
    if (err instanceof MobileDeFetchError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new MobileDeFetchError(
        `mobile.de Feed-Abruf hat das Timeout von ${config.timeoutMs}ms ueberschritten`,
        err
      );
    }
    throw new MobileDeFetchError('mobile.de Feed-Abruf fehlgeschlagen (Netzwerkfehler)', err);
  } finally {
    clearTimeout(timeout);
  }
}
