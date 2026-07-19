-- AlterTable
-- Fuegt dem Vehicle-Modell drei Felder fuer die externe Sync-Anbindung
-- (z.B. mobile.de XML-Feed, siehe src/sync/) hinzu:
--   externalId     - Referenz-ID aus dem externen Feed, eindeutig, fuer
--                    Abgleich bei jedem Sync-Lauf (Neuanlage vs. Update)
--   externalSource - Herkunft der externen Referenz, z.B. "MOBILE_DE"
--   lastSyncedAt   - Zeitpunkt des letzten erfolgreichen Sync-Abgleichs
-- Alle drei Felder sind nullable, da manuell im Admin-UI angelegte
-- Fahrzeuge keine externe Referenz haben. Kein Backfill notwendig.
ALTER TABLE "Vehicle" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "externalSource" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "lastSyncedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_externalId_key" ON "Vehicle"("externalId");
