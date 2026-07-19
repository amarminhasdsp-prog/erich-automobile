-- Rollback fuer 20260719143000_add_mobile_de_sync_fields
-- Manuell auszufuehren falls diese Migration zurueckgerollt werden muss.
-- SQLite kennt kein "DROP COLUMN" vor Version 3.35 direkt per Prisma-Support;
-- da die Ziel-SQLite-Version in diesem Projekt DROP COLUMN unterstuetzt
-- (SQLite >= 3.35, node:20-Image hat eine aktuelle Version), reicht folgendes:
DROP INDEX IF EXISTS "Vehicle_externalId_key";
ALTER TABLE "Vehicle" DROP COLUMN "externalId";
ALTER TABLE "Vehicle" DROP COLUMN "externalSource";
ALTER TABLE "Vehicle" DROP COLUMN "lastSyncedAt";
