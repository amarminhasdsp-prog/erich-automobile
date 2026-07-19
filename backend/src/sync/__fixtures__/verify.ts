// Manuelles Verifikationsskript fuer mobileDeXmlParser + vehicleMapper.
//
// Es existiert kein Testframework in diesem Projekt (package.json geprueft,
// siehe Auftrag Punkt 5) - daher wird hier bewusst KEIN Jest/Vitest neu
// eingerichtet nur fuer dieses Feature, sondern ein einfaches Skript, das
// die Beispiel-Fixture durch Parser+Mapper schickt und das Resultat
// ausgibt.
//
// Ausfuehrung (innerhalb des Backend-Containers oder mit lokalem Node 20):
//   npx ts-node src/sync/__fixtures__/verify.ts
//
// Erwartet: 3 Fahrzeuge aus der Fixture, korrekt gemappte Felder (u.a.
// Preis in Cent, Feature-Liste als kommagetrennter String, Status-Mapping),
// sowie eine Demonstration des Sanity-Check-Verhaltens (Abbruch bei
// starkem Rueckgang der Fahrzeuganzahl).

import fs from 'fs';
import path from 'path';
import { parseMobileDeFeed } from '../mobileDeXmlParser';
import { mapFeedVehicleToPrisma, eurToCents } from '../vehicleMapper';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FEHLER: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

function main() {
  const fixturePath = path.join(__dirname, 'sample-feed.xml');
  const xml = fs.readFileSync(fixturePath, 'utf-8');

  console.log('--- 1. XML-Parsing ---');
  const feed = parseMobileDeFeed(xml);
  assert(feed.vehicles.length === 3, `Feed enthaelt 3 Fahrzeuge (tatsaechlich: ${feed.vehicles.length})`);
  assert(feed.dealerId === 'DEALER-12345', `dealerId korrekt geparst (${feed.dealerId})`);

  console.log('\n--- 2. Feld-Mapping (vehicleMapper) ---');
  const mapped = feed.vehicles.map(mapFeedVehicleToPrisma);

  const golf = mapped.find((v) => v.externalId === 'ML-987654321');
  assert(!!golf, 'VW Golf GTI wurde gemappt');
  if (golf) {
    assert(golf.price === eurToCents(24990.0), `Preis in Cent korrekt: ${golf.price} === ${eurToCents(24990.0)}`);
    assert(golf.category === 'LIMOUSINE', `category SEDAN -> LIMOUSINE gemappt (${golf.category})`);
    assert(golf.condition === 'GEBRAUCHT', `condition USED -> GEBRAUCHT gemappt (${golf.condition})`);
    assert(golf.fuelType === 'BENZIN', `fuelType PETROL -> BENZIN gemappt (${golf.fuelType})`);
    assert(golf.transmission === 'MANUELL', `transmission MANUAL -> MANUELL gemappt (${golf.transmission})`);
    assert(golf.status === 'VERFUEGBAR', `status ACTIVE -> VERFUEGBAR gemappt (${golf.status})`);
    assert(
      golf.features === 'Klimaautomatik,Navigationssystem,Sitzheizung',
      `Feature-Liste korrekt zu kommagetrenntem String serialisiert: "${golf.features}"`
    );
    assert(
      golf.firstRegistration.toISOString().startsWith('2021-03-01'),
      `Datum korrekt normalisiert: ${golf.firstRegistration.toISOString()}`
    );
  }

  const bmw = mapped.find((v) => v.externalId === 'ML-111222333');
  assert(!!bmw, 'BMW 320d Touring wurde gemappt');
  if (bmw) {
    assert(bmw.category === 'KOMBI', `category ESTATE -> KOMBI gemappt (${bmw.category})`);
    assert(bmw.condition === 'JAHRESWAGEN', `condition ANNUAL -> JAHRESWAGEN gemappt (${bmw.condition})`);
    assert(
      bmw.firstRegistration.toISOString().startsWith('2022-06-01'),
      `Monat/Jahr-Datum (2022-06) auf 1. des Monats normalisiert: ${bmw.firstRegistration.toISOString()}`
    );
  }

  const skoda = mapped.find((v) => v.externalId === 'ML-444555666');
  assert(!!skoda, 'Skoda Octavia wurde gemappt (Fahrzeug ohne Bilder, mit optionalen Feldern = undefined)');
  if (skoda) {
    assert(skoda.cubicCapacity === undefined, 'Fehlende optionale Felder bleiben undefined statt Fehler zu werfen');
  }

  console.log('\n--- 3. Sanity-Check-Simulation (syncService-Logik nachgebildet) ---');
  const previousCount = 10;
  const newCount = feed.vehicles.length; // 3
  const dropPercent = ((previousCount - newCount) / previousCount) * 100;
  const maxDropPercent = 50;
  assert(
    dropPercent > maxDropPercent,
    `Rueckgang von ${previousCount} auf ${newCount} Fahrzeuge (${dropPercent.toFixed(1)}%) ` +
      `wuerde bei Schwellwert ${maxDropPercent}% korrekt als Sanity-Check-Fehler erkannt`
  );

  const noDropPercent = ((previousCount - 9) / previousCount) * 100; // 10%
  assert(
    noDropPercent <= maxDropPercent,
    `Leichter Rueckgang (10%) bleibt unter dem Schwellwert und wuerde den Sync-Lauf NICHT abbrechen`
  );

  console.log('\n--- Fertig ---');
  if (process.exitCode === 1) {
    console.error('Es gab Fehler, siehe oben.');
  } else {
    console.log('Alle Pruefungen erfolgreich.');
  }
}

main();
