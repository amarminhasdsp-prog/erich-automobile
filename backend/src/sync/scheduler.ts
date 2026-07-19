// In-Process Cron-Scheduler fuer den mobile.de-Sync (siehe ADR-001,
// Recherche-Report Abschnitt 7). Nutzt node-cron, da im Backend zuvor kein
// Job-Scheduler vorhanden war (package.json vor diesem Feature geprueft).
//
// Der Job wird NUR gestartet, wenn MOBILE_DE_SYNC_ENABLED=true gesetzt ist.
// Andernfalls wird einmalig eine Log-Meldung ausgegeben und der Scheduler
// bleibt inaktiv - das ist der sichere Default, solange keine echten
// mobile.de-Zugangsdaten vorliegen.

import cron, { ScheduledTask } from 'node-cron';
import { runMobileDeSync } from './syncService';
import { setLastSyncResult } from './syncStatusStore';

const DEFAULT_CRON_EXPRESSION = '0 */2 * * *'; // alle 2 Stunden, siehe Report Abschnitt 11.3

let scheduledTask: ScheduledTask | null = null;

function isSyncEnabled(): boolean {
  return (process.env.MOBILE_DE_SYNC_ENABLED ?? 'false').trim().toLowerCase() === 'true';
}

function getCronExpression(): string {
  const raw = process.env.MOBILE_DE_SYNC_INTERVAL_CRON?.trim();
  if (raw && cron.validate(raw)) {
    return raw;
  }
  if (raw) {
    console.error(
      `[scheduler] MOBILE_DE_SYNC_INTERVAL_CRON="${raw}" ist kein gueltiger Cron-Ausdruck, ` +
        `verwende Default "${DEFAULT_CRON_EXPRESSION}"`
    );
  }
  return DEFAULT_CRON_EXPRESSION;
}

// Wird einmalig beim Server-Start aufgerufen (siehe server.ts).
export function startMobileDeScheduler(): void {
  if (!isSyncEnabled()) {
    console.log('mobile.de Sync deaktiviert (keine Zugangsdaten konfiguriert)');
    return;
  }

  const cronExpression = getCronExpression();
  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('[scheduler] Automatischer mobile.de Sync-Lauf gestartet');
    const result = await runMobileDeSync();
    setLastSyncResult(result);
  });

  console.log(`[scheduler] mobile.de Sync aktiviert, Intervall: "${cronExpression}"`);
}

// Fuer Tests/Shutdown: stoppt den Scheduler, falls er laeuft.
export function stopMobileDeScheduler(): void {
  scheduledTask?.stop();
  scheduledTask = null;
}
