// Haelt das Ergebnis des letzten mobile.de-Sync-Laufs im Prozessspeicher.
// Bewusst keine eigene DB-Tabelle: Der Status wird nur fuer den Admin-
// Status-Endpunkt benoetigt (GET /api/admin/sync/mobile-de/status), ist
// nicht business-kritisch und geht bei einem Server-Neustart verloren - das
// ist akzeptabel, da nach einem Neustart ohnehin bald der naechste Lauf
// (Cron oder manuell) ein neues Ergebnis liefert.

import { SyncRunResult } from './syncService';

let lastResult: SyncRunResult | null = null;

export function setLastSyncResult(result: SyncRunResult): void {
  lastResult = result;
}

export function getLastSyncResult(): SyncRunResult | null {
  return lastResult;
}
