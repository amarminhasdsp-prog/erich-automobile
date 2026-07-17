# Deploy-Anleitung: Erich Automobile (Render)

Dieses Paket enthaelt Backend (`backend/`) und Frontend (`frontend/`) fuer
das Autohaus-Portal "Erich Automobile", vorbereitet fuer den Deploy auf
[Render](https://render.com) via Blueprint (`render.yaml`).

## Voraussetzungen

- Ein Render-Account
- Dieses Paket in einem Git-Repository (GitHub/GitLab), das mit Render
  verbunden ist. Render Blueprints lesen `render.yaml` direkt aus dem Repo,
  ein lokales tar.gz kann nicht direkt deployed werden.

## Schritt 1: Repo vorbereiten

```bash
tar -xzf autohaus-premium-deploy.tar.gz
cd autohaus-premium
git init
git add .
git commit -m "Initial commit fuer Render-Deploy"
git remote add origin <dein-repo-url>
git push -u origin main
```

**Wichtig:** `.env`-Dateien sind per `.gitignore` ausgeschlossen. Secrets
(DATABASE_URL, JWT_SECRET) werden ausschliesslich ueber Render-Environment-
Variablen gesetzt, niemals ins Repo committen.

## Schritt 2: Blueprint in Render anlegen

1. Render-Dashboard -> "New" -> "Blueprint"
2. Das verbundene Git-Repo auswaehlen
3. Render erkennt `render.yaml` automatisch und zeigt die drei Ressourcen an:
   - `erich-automobile-api` (Node Web Service, Backend)
   - `erich-automobile-frontend` (Static Site, Frontend)
   - `erich-automobile-db` (PostgreSQL, Free Plan)
4. "Apply" klicken - Render erstellt DB, Backend und Frontend automatisch

## Was beim Start automatisch passiert

Backend-`startCommand`:
```
npx prisma migrate deploy && npx prisma db seed && node dist/server.js
```

- `prisma migrate deploy` wendet alle Migrationen an (inkl. `postgres-init`)
- `prisma db seed` legt Dealer, 8 Fahrzeuge, Admin-User an und kopiert die
  im Repo versionierten Fotos aus `backend/prisma/seed-photos/` nach
  `backend/uploads/photos/` (siehe Hinweis unten zu persistenten Uploads)
- Danach startet der Server

Das Seed-Script ist idempotent: bereits vorhandene Fotos/Admin-User werden
nicht dupliziert. Ein Re-Deploy loescht und erstellt jedoch alle
`Vehicle`/`Dealer`-Datensaetze neu (siehe `backend/prisma/seed.ts`).

## Persistente Uploads (wichtig)

Render-Web-Services haben **kein persistentes Dateisystem** zwischen Deploys
im Free/Starter-Plan (jeder Deploy startet einen frischen Container). Ohne
Gegenmassnahme wuerden nutzerseitig hochgeladene Fotos/Dokumente nach jedem
Deploy verloren gehen.

Fuer die Seed-Fotos ist das bereits geloest: sie liegen unter
`backend/prisma/seed-photos/` im Repo und werden beim Seed-Lauf automatisch
nach `uploads/photos/` kopiert - sie sind also nach jedem Deploy wieder da.

Fuer **neue, ueber das Admin-Panel hochgeladene** Fotos/Dokumente gilt das
nicht automatisch. Optionen fuer einen produktiven Einsatz:

- Render Disk (persistenter Volume-Mount, kostenpflichtig ab Starter-Plan)
  auf `/app/uploads` mounten, oder
- Uploads auf einen Object-Storage-Dienst (z.B. S3-kompatibel) umstellen

Fuer diese erste Deploy-Iteration ist das bewusst nicht umgesetzt (ausserhalb
des Auftragsumfangs), sollte aber vor produktivem Live-Betrieb mit echten
Kundenfotos nachgezogen werden.

## Environment-Variablen

`render.yaml` setzt bereits sinnvolle Defaults (`NODE_ENV`, `PORT`,
`UPLOAD_DIR`, `CORS_ORIGIN`, `MAX_FILE_SIZE`) sowie ein automatisch von
Render generiertes `JWT_SECRET`. `DATABASE_URL` wird automatisch aus der
angelegten `erich-automobile-db`-Datenbank injiziert.

Falls die tatsaechliche Render-URL des Frontends von
`erich-automobile-frontend.onrender.com` abweicht (z.B. bei Custom-Domain),
muss `CORS_ORIGIN` im Backend-Service und `VITE_API_URL` im Frontend-Service
im Render-Dashboard entsprechend angepasst werden.

## Lokale Verifikation vor dem Deploy

Migration und Seed wurden lokal gegen einen PostgreSQL-16-Testcontainer
verifiziert (Migration `20260717160151_postgres_init`, Seed erzeugt Dealer,
8 Fahrzeuge, Admin-User, 24 Fotos). Die Backend-API wurde nicht gegen
PostgreSQL end-to-end im Container-Deploy getestet (nur Migration + Seed),
da dies ausserhalb des lokalen dev-dsk-Container-Setups liegt (der laufende
`autohaendler-backend`-Container nutzt weiterhin SQLite fuer die lokale
Entwicklung, siehe `backend/.env`).

## Login-Daten Admin-Panel (nach erstem Seed)

- E-Mail: `admin@erich-automobile.de`
- Passwort: `AutohausPremium2026!`

**Nach dem ersten produktiven Deploy umgehend aendern** (ueber das
Admin-Panel, ein Passwort-Aenderungs-Endpoint existiert bereits unter
`/api/admin/users`).
