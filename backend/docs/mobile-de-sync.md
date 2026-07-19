# mobile.de XML-Sync

Automatischer Abgleich des Fahrzeugbestands mit einem externen mobile.de-Feed.
Betrifft: `src/sync/`, `src/controllers/syncController.ts`,
`src/routes/adminSyncRoutes.ts`.

## a) Wichtigster Punkt zuerst: mobile.de hat keine oeffentliche Self-Service-API

Eine Recherche (siehe `~/orchestrator/reports/2026-07-19_mobilede-xml-anbindung-recherche.md`)
hat ergeben: **mobile.de bietet keine oeffentlich dokumentierte, frei
buchbare API, ueber die ein einzelner Haendler per Formular einen API-Key
beantragt.** Der automatisierte Datenaustausch laeuft in der Praxis
ueblicherweise ueber zertifizierte Software-/DMS-Partner.

Bevor der Sync mit echten Daten genutzt werden kann, muss der Haendler
("Erich Automobile Stuttgart") folgende Punkte bei mobile.de klaeren
(Ansprechpartner: Haendler-/Partner-Support des bestehenden mobile.de-Kontos):

1. Gibt es fuer den Haendleraccount eine direkte XML-/API-Schnittstelle zum
   automatisierten Abruf des eigenen Fahrzeugbestands, oder ist dafuer ein
   zertifiziertes Drittanbieter-DMS-System erforderlich?
2. Falls direkter Zugang moeglich ist: Zugangsdaten, Endpunkt-URL,
   Schema-Dokumentation, Rate-Limits und Authentifizierungsverfahren anfordern.
3. Falls nur ueber ein DMS moeglich: Pruefen, ob bereits ein DMS-System im
   Einsatz ist, das ohnehin an mobile.de angebunden ist - dessen Export waere
   dann die pragmatischere Datenquelle.
4. Alternativ pruefen, ob im mobile.de-Haendlerportal ein CSV/XML-Export der
   eigenen Inserate existiert (fuer einen semi-automatisierten Import).

**Ohne Antworten auf diese Fragen bleibt der Sync auf Platzhalter-Konfiguration
beschraenkt** - der Code ist vollstaendig implementiert und funktioniert
sicher im deaktivierten Zustand, verarbeitet aber erst dann echte Daten,
wenn oben stehende Punkte geklaert sind.

## b) Echte Zugangsdaten eintragen, sobald sie vorliegen

In der `.env` (nicht `.env.example`) folgende Variablen setzen:

| Variable | Bedeutung |
|---|---|
| `MOBILE_DE_FEED_URL` | Vollstaendige URL des XML-Feed-Endpunkts (von mobile.de/Partner erhalten) |
| `MOBILE_DE_DEALER_ID` | Haendler-/Seller-ID, wird als Query-Parameter an die Feed-URL angehaengt |
| `MOBILE_DE_API_KEY` | Zugangsschluessel, wird als `X-Api-Key`-Header UND als Query-Parameter gesendet (Verfahren ist beim echten Anbieter noch zu verifizieren, siehe Recherche-Report Abschnitt 2) |
| `MOBILE_DE_SYNC_INTERVAL_CRON` | Cron-Ausdruck fuer automatische Laeufe, Default alle 2h: `0 */2 * * *` |
| `MOBILE_DE_SYNC_ENABLED` | Muss explizit auf `true` gesetzt werden, damit der Scheduler startet |
| `MOBILE_DE_FEED_TIMEOUT_MS` | Timeout fuer den Feed-Abruf in Millisekunden, Default `15000` |
| `MOBILE_DE_SANITY_CHECK_MAX_DROP_PERCENT` | Schwellwert (%) fuer den Sanity-Check: bricht den Lauf ab, wenn die Fahrzeuganzahl im Vergleich zum letzten Bestand um mehr als diesen Wert einbricht (Default `50`) |

Schritte:

1. `MOBILE_DE_FEED_URL`, `MOBILE_DE_DEALER_ID`, `MOBILE_DE_API_KEY` mit den
   echten, von mobile.de erhaltenen Werten befuellen (keine `REPLACE_ME`-Werte
   mehr).
2. `MOBILE_DE_SYNC_ENABLED=true` setzen.
3. Backend neu starten/deployen, damit die neuen Werte geladen werden.
4. Im Log sollte danach `[scheduler] mobile.de Sync aktiviert, Intervall: "..."`
   erscheinen statt `mobile.de Sync deaktiviert (keine Zugangsdaten konfiguriert)`.
5. Empfehlung: Vor dem ersten automatischen Lauf einen manuellen Testlauf
   ausfuehren (siehe Abschnitt c), um das Mapping gegen echte Daten zu
   pruefen, bevor die volle Fahrzeugliste synchronisiert wird.

Solange eine der drei Pflichtvariablen fehlt oder noch `REPLACE_ME` enthaelt,
bleibt der Sync im Zustand `NOT_CONFIGURED` - es werden keine Netzwerkaufrufe
gegen eine ungueltige URL ausgefuehrt.

## c) Sync manuell testen

Beide Endpunkte liegen hinter der bestehenden Admin-Authentifizierung
(httpOnly-Cookie, siehe `middleware/adminAuth.ts`). Zuerst einloggen, dann
das Cookie fuer die folgenden Requests mitnutzen:

```bash
# 1. Admin-Login (setzt httpOnly-Cookie in cookies.txt)
curl -s -c cookies.txt -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"DEIN_PASSWORT"}'

# 2. Sync manuell anstossen
curl -s -b cookies.txt -X POST http://localhost:4000/api/admin/sync/mobile-de/run

# 3. Letzten Sync-Status abfragen
curl -s -b cookies.txt http://localhost:4000/api/admin/sync/mobile-de/status
```

Solange `MOBILE_DE_SYNC_ENABLED=false` (Default) ist, antwortet Punkt 2 mit
`{"status":"DISABLED", ...}` und veraendert keine Daten - das ist der
erwartete, sichere Zustand ohne echte Zugangsdaten.

## d) Beispiel-Fixture als Formatreferenz

Unter [`src/sync/__fixtures__/sample-feed.xml`](../src/sync/__fixtures__/sample-feed.xml)
liegt eine Beispiel-XML-Datei mit drei Testfahrzeugen im generischen,
angenommenen mobile.de-Feed-Format (siehe Recherche-Report Abschnitt 6).
**Dieses Format ist eine Arbeitsannahme, kein verifiziertes mobile.de-Format** -
sobald das echte Format bekannt ist, muessen `mobileDeXmlParser.ts` und
`vehicleMapper.ts` entsprechend angepasst werden; die restliche Architektur
(Client, Sync-Orchestrierung, Scheduler, Endpunkte) bleibt davon unberuehrt.

Verifikationsskript (kein Testframework im Projekt vorhanden, daher ein
einfaches Skript statt eines neuen Test-Setups):

```bash
npm run sync:verify
```

Das Skript parst die Fixture, mapped alle drei Fahrzeuge und prueft u.a.
Preis-Cent-Konvertierung, Enum-Mapping (category/condition/fuelType/status),
Feature-Listen-Serialisierung, Datums-Normalisierung sowie die
Sanity-Check-Schwellwert-Logik.
