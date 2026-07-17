import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const BCRYPT_COST = 12;

// Verzeichnis mit den im Repo versionierten Seed-Fotos (werden bei jedem
// Deploy/Seed-Lauf nach UPLOAD_DIR/photos kopiert, da das Upload-Volume auf
// Render bei einem Neu-Deploy nicht garantiert erhalten bleibt).
const SEED_PHOTOS_DIR = path.join(__dirname, 'seed-photos');
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'uploads');
const PHOTOS_TARGET_DIR = path.join(UPLOAD_DIR, 'photos');

// make -> [dateiname-praefix] passend zu den Fotos in prisma/seed-photos/
const PHOTO_MAP: Record<string, string[]> = {
  Volkswagen: ['vw-1.jpg', 'vw-2.jpg', 'vw-3.jpg'],
  BMW: ['bmw-1.jpg', 'bmw-2.jpg', 'bmw-3.jpg'],
  Audi: ['audi-1.jpg', 'audi-2.jpg', 'audi-3.jpg'],
  'Mercedes-Benz': ['mercedes-1.jpg', 'mercedes-2.jpg', 'mercedes-3.jpg'],
  'Škoda': ['skoda-1.jpg', 'skoda-2.jpg', 'skoda-3.jpg'],
  Tesla: ['tesla-1.jpg', 'tesla-2.jpg', 'tesla-3.jpg'],
  Ford: ['ford-1.jpg', 'ford-2.jpg', 'ford-3.jpg'],
  Porsche: ['porsche-1.jpg', 'porsche-2.jpg', 'porsche-3.jpg'],
};

/**
 * Kopiert die im Repo versionierten Seed-Fotos in das Upload-Verzeichnis.
 * Idempotent: ueberspringt bereits vorhandene Dateien.
 */
function copySeedPhotos(): void {
  if (!fs.existsSync(SEED_PHOTOS_DIR)) {
    console.warn(`Seed-Fotos-Verzeichnis nicht gefunden: ${SEED_PHOTOS_DIR}, ueberspringe Foto-Kopie.`);
    return;
  }
  fs.mkdirSync(PHOTOS_TARGET_DIR, { recursive: true });

  const files = fs.readdirSync(SEED_PHOTOS_DIR);
  let copied = 0;
  for (const file of files) {
    const src = path.join(SEED_PHOTOS_DIR, file);
    const dest = path.join(PHOTOS_TARGET_DIR, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }
  console.log(`Seed-Fotos kopiert: ${copied} neu, ${files.length - copied} bereits vorhanden (${PHOTOS_TARGET_DIR}).`);
}

/**
 * Registriert die Seed-Fotos als Photo-Datensaetze fuer die uebergebenen
 * Fahrzeuge (3 Fotos pro Marke, erstes = isMain). Idempotent pro Fahrzeug:
 * Fahrzeuge mit bereits vorhandenen Fotos werden uebersprungen.
 */
async function seedPhotosForVehicles(vehicles: { id: string; make: string; model: string }[]): Promise<void> {
  for (const vehicle of vehicles) {
    const files = PHOTO_MAP[vehicle.make];
    if (!files) {
      console.warn(`Keine Seed-Fotos fuer Marke "${vehicle.make}" hinterlegt, ueberspringe.`);
      continue;
    }

    const existing = await prisma.photo.count({ where: { vehicleId: vehicle.id } });
    if (existing > 0) {
      continue;
    }

    await prisma.$transaction(
      files.map((filename, idx) =>
        prisma.photo.create({
          data: {
            vehicleId: vehicle.id,
            filename,
            originalName: filename,
            isMain: idx === 0,
            sortOrder: idx,
          },
        })
      )
    );
    console.log(`Fotos registriert fuer ${vehicle.make} ${vehicle.model}: ${files.join(', ')}`);
  }
}

// Default-Admin fuer den Erststart des Systems. Passwort wird ausschliesslich
// gehasht (bcrypt, Cost 12) gespeichert - niemals im Klartext in der DB.
const DEFAULT_ADMIN = {
  email: 'admin@erich-automobile.de',
  name: 'Admin',
  password: 'AutohausPremium2026!',
  role: 'ADMIN' as const,
};


// Hinweis: Diese Felder sind bewusst als String modelliert (siehe
// schema.prisma). Die gueltigen Werte entsprechen den Zod-Enums in
// src/utils/validation.ts.
type FuelType = 'BENZIN' | 'DIESEL' | 'ELEKTRO' | 'HYBRID' | 'PLUGIN_HYBRID' | 'GAS_LPG' | 'GAS_CNG' | 'WASSERSTOFF';
type TransmissionType = 'MANUELL' | 'AUTOMATIK' | 'HALBAUTOMATIK';
type VehicleCategory =
  | 'PKW'
  | 'SUV_GELAENDEWAGEN'
  | 'KOMBI'
  | 'LIMOUSINE'
  | 'KLEINWAGEN'
  | 'CABRIO'
  | 'TRANSPORTER'
  | 'MOTORRAD'
  | 'WOHNMOBIL';
type ConditionType = 'NEU' | 'GEBRAUCHT' | 'JAHRESWAGEN' | 'UNFALLFAHRZEUG' | 'VORFUEHRWAGEN';
type VehicleStatus = 'VERFUEGBAR' | 'RESERVIERT' | 'VERKAUFT' | 'ENTWURF';

// Realistische Dummy-Daten fuer ein Autohaus, angelehnt an typische mobile.de Angebote.

const DEALER = {
  companyName: 'Erich Automobile Stuttgart',
  street: 'Sigmaringer Str. 205',
  postalCode: '70567',
  city: 'Stuttgart-Degerloch',
  country: 'Deutschland',
  phone: '+49 711 1234567',
  email: 'info@erich-automobile.de',
  website: 'https://erich-automobile.de/',
};

type VehicleSeed = {
  make: string;
  model: string;
  variant?: string;
  category: VehicleCategory;
  condition: ConditionType;
  status: VehicleStatus;
  price: number; // Cent
  vatDeductible: boolean;
  firstRegistration: Date;
  mileageKm: number;
  powerKw: number;
  powerHp: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  cubicCapacity?: number;
  cylinders?: number;
  fuelConsumption?: number;
  co2Emissions?: number;
  emissionClass?: string;
  numberOfDoors?: number;
  numberOfSeats?: number;
  previousOwners?: number;
  exteriorColor?: string;
  interiorColor?: string;
  interiorMaterial?: string;
  features?: string;
  title: string;
  description: string;
  locationCity?: string;
  locationPostalCode?: string;
  vin?: string;
};

const VEHICLES: VehicleSeed[] = [
  {
    make: 'Volkswagen',
    model: 'Golf',
    variant: 'GTI',
    category: 'KLEINWAGEN',
    condition: 'GEBRAUCHT',
    status: 'VERFUEGBAR',
    price: 2890000,
    vatDeductible: true,
    firstRegistration: new Date('2021-06-01'),
    mileageKm: 32500,
    powerKw: 180,
    powerHp: 245,
    fuelType: 'BENZIN',
    transmission: 'AUTOMATIK',
    cubicCapacity: 1984,
    cylinders: 4,
    fuelConsumption: 7.2,
    co2Emissions: 164,
    emissionClass: 'Euro 6d',
    numberOfDoors: 5,
    numberOfSeats: 5,
    previousOwners: 1,
    exteriorColor: 'Tornadorot',
    interiorColor: 'Schwarz',
    interiorMaterial: 'Stoff/Leder',
    features: 'Klimaautomatik,Navigationssystem,Sitzheizung,LED-Scheinwerfer,Einparkhilfe,Tempomat,Bluetooth,Alufelgen',
    title: 'VW Golf GTI 2.0 TSI DSG - Top Zustand, 1. Hand',
    description:
      'Verkaufe unseren gepflegten VW Golf GTI aus erster Hand. Scheckheftgepflegt, nichtraucherfahrzeug, keine Unfaelle. Ausstattung: Navigationssystem, Sitzheizung, LED-Scheinwerfer, Einparkhilfe vorne und hinten, Tempomat mit Abstandsregelung. Vollausstattung, sofort verfuegbar.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: 'WVWZZZ1KZAM123456',
  },
  {
    make: 'BMW',
    model: '3er',
    variant: '320d Touring',
    category: 'KOMBI',
    condition: 'GEBRAUCHT',
    status: 'VERFUEGBAR',
    price: 3390000,
    vatDeductible: true,
    firstRegistration: new Date('2020-09-15'),
    mileageKm: 58000,
    powerKw: 140,
    powerHp: 190,
    fuelType: 'DIESEL',
    transmission: 'AUTOMATIK',
    cubicCapacity: 1995,
    cylinders: 4,
    fuelConsumption: 4.8,
    co2Emissions: 126,
    emissionClass: 'Euro 6d-TEMP',
    numberOfDoors: 5,
    numberOfSeats: 5,
    previousOwners: 2,
    exteriorColor: 'Mineralgrau Metallic',
    interiorColor: 'Beige',
    interiorMaterial: 'Leder',
    features: 'Panoramadach,Head-Up-Display,Ledersitze,Standheizung,Anhaengerkupplung,Navigationssystem,Xenon',
    title: 'BMW 320d Touring xDrive - Panoramadach, Leder, Top!',
    description:
      'Sehr gepflegter BMW 320d Touring mit umfangreicher Ausstattung. Panoramaglasdach, Ledersitze, Head-Up-Display, Standheizung. Regelmaessige Wartung beim BMW-Vertragshaendler, alle Belege vorhanden. Ideal fuer Vielfahrer.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: 'WBA8E9103L1234567',
  },
  {
    make: 'Audi',
    model: 'Q5',
    variant: '40 TDI quattro S line',
    category: 'SUV_GELAENDEWAGEN',
    condition: 'JAHRESWAGEN',
    status: 'VERFUEGBAR',
    price: 5290000,
    vatDeductible: true,
    firstRegistration: new Date('2023-02-01'),
    mileageKm: 8500,
    powerKw: 150,
    powerHp: 204,
    fuelType: 'DIESEL',
    transmission: 'AUTOMATIK',
    cubicCapacity: 1968,
    cylinders: 4,
    fuelConsumption: 5.9,
    co2Emissions: 154,
    emissionClass: 'Euro 6d',
    numberOfDoors: 5,
    numberOfSeats: 5,
    previousOwners: 1,
    exteriorColor: 'Gletscherweiß Metallic',
    interiorColor: 'Schwarz',
    interiorMaterial: 'Leder/Alcantara',
    features: 'Matrix-LED,Virtual Cockpit,S line Paket,Sitzheizung,Standheizung,360-Grad-Kamera,Adaptive Cruise Control',
    title: 'Audi Q5 40 TDI quattro S line - Jahreswagen, wie neu',
    description:
      'Nahezu neuwertiger Audi Q5 als Jahreswagen mit S line Exterieur- und Interieurpaket. Matrix-LED-Scheinwerfer, virtuelles Cockpit, 360-Grad-Kamera, adaptiver Tempomat. Voller Werksgarantie-Umfang bis 2026.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: 'WAUZZZFY1N2123456',
  },
  {
    make: 'Mercedes-Benz',
    model: 'C-Klasse',
    variant: 'C 200 Avantgarde',
    category: 'LIMOUSINE',
    condition: 'GEBRAUCHT',
    status: 'RESERVIERT',
    price: 3690000,
    vatDeductible: false,
    firstRegistration: new Date('2021-11-01'),
    mileageKm: 41000,
    powerKw: 150,
    powerHp: 204,
    fuelType: 'BENZIN',
    transmission: 'AUTOMATIK',
    cubicCapacity: 1497,
    cylinders: 4,
    fuelConsumption: 6.8,
    co2Emissions: 155,
    emissionClass: 'Euro 6d',
    numberOfDoors: 4,
    numberOfSeats: 5,
    previousOwners: 1,
    exteriorColor: 'Obsidianschwarz Metallic',
    interiorColor: 'Schwarz',
    interiorMaterial: 'Leder',
    features: 'MBUX,Ambientebeleuchtung,Ledersitze,Sitzheizung,Spurhalteassistent,Totwinkelassistent',
    title: 'Mercedes-Benz C 200 Avantgarde - MBUX, Ledersitze',
    description:
      'Elegante C-Klasse mit MBUX Multimediasystem, Ledersitzen und umfangreichen Assistenzsystemen. Unfallfrei, scheckheftgepflegt. Fahrzeug ist derzeit reserviert.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: 'WDD2050441A123456',
  },
  {
    make: 'Škoda',
    model: 'Octavia',
    variant: 'Combi Style',
    category: 'KOMBI',
    condition: 'GEBRAUCHT',
    status: 'VERFUEGBAR',
    price: 2190000,
    vatDeductible: true,
    firstRegistration: new Date('2019-05-01'),
    mileageKm: 78000,
    powerKw: 110,
    powerHp: 150,
    fuelType: 'DIESEL',
    transmission: 'MANUELL',
    cubicCapacity: 1968,
    cylinders: 4,
    fuelConsumption: 4.5,
    co2Emissions: 118,
    emissionClass: 'Euro 6',
    numberOfDoors: 5,
    numberOfSeats: 5,
    previousOwners: 2,
    exteriorColor: 'Business-Grau Metallic',
    interiorColor: 'Grau',
    interiorMaterial: 'Stoff',
    features: 'Navigationssystem,Einparkhilfe,Tempomat,Klimaautomatik,Alufelgen',
    title: 'Škoda Octavia Combi 2.0 TDI Style - Großer Kofferraum',
    description:
      'Praktischer und sparsamer Kombi mit großem Kofferraumvolumen. Ideal fuer Familien und Vielfahrer. Gepflegter Zustand, neue Bremsen und Zahnriemen wurden erst gewechselt.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: 'TMBJJ7NE1K0123456',
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    variant: 'Long Range',
    category: 'LIMOUSINE',
    condition: 'GEBRAUCHT',
    status: 'VERFUEGBAR',
    price: 3490000,
    vatDeductible: true,
    firstRegistration: new Date('2022-03-01'),
    mileageKm: 25000,
    powerKw: 324,
    powerHp: 441,
    fuelType: 'ELEKTRO',
    transmission: 'AUTOMATIK',
    fuelConsumption: 15.5,
    co2Emissions: 0,
    emissionClass: 'Euro 6',
    numberOfDoors: 4,
    numberOfSeats: 5,
    previousOwners: 1,
    exteriorColor: 'Perleffekt-Weiß',
    interiorColor: 'Schwarz',
    interiorMaterial: 'Kunstleder (vegan)',
    features: 'Autopilot,Glasdach,Premium-Soundsystem,Beheizte Sitze,Over-the-Air-Updates',
    title: 'Tesla Model 3 Long Range AWD - Autopilot, Glasdach',
    description:
      'Vollelektrisches Model 3 mit Allradantrieb und großer Reichweite. Autopilot-Funktion, Glasdach, Premium-Soundsystem. Batterie in einwandfreiem Zustand, aktuelle Software-Version.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: '5YJ3E1EA1NF123456',
  },
  {
    make: 'Ford',
    model: 'Fiesta',
    variant: 'Titanium',
    category: 'KLEINWAGEN',
    condition: 'GEBRAUCHT',
    status: 'VERKAUFT',
    price: 1390000,
    vatDeductible: false,
    firstRegistration: new Date('2018-07-01'),
    mileageKm: 62000,
    powerKw: 74,
    powerHp: 100,
    fuelType: 'BENZIN',
    transmission: 'MANUELL',
    cubicCapacity: 998,
    cylinders: 3,
    fuelConsumption: 5.3,
    co2Emissions: 121,
    emissionClass: 'Euro 6',
    numberOfDoors: 5,
    numberOfSeats: 5,
    previousOwners: 2,
    exteriorColor: 'Blau Metallic',
    interiorColor: 'Schwarz',
    interiorMaterial: 'Stoff',
    features: 'Klimaanlage,Bluetooth,Tempomat,Einparkhilfe hinten',
    title: 'Ford Fiesta 1.0 EcoBoost Titanium - Sparsam & Zuverlaessig',
    description:
      'Wirtschaftlicher Kleinwagen mit geringem Verbrauch. Idealer Stadtwagen. Fahrzeug wurde bereits verkauft, Anzeige dient nur als Referenz.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: 'WF0FXXGAJFJA12345',
  },
  {
    make: 'Porsche',
    model: '911',
    variant: 'Carrera S',
    category: 'CABRIO',
    condition: 'VORFUEHRWAGEN',
    status: 'VERFUEGBAR',
    price: 13990000,
    vatDeductible: true,
    firstRegistration: new Date('2023-08-01'),
    mileageKm: 3200,
    powerKw: 331,
    powerHp: 450,
    fuelType: 'BENZIN',
    transmission: 'AUTOMATIK',
    cubicCapacity: 2981,
    cylinders: 6,
    fuelConsumption: 10.9,
    co2Emissions: 248,
    emissionClass: 'Euro 6d',
    numberOfDoors: 2,
    numberOfSeats: 4,
    previousOwners: 0,
    exteriorColor: 'GT-Silber Metallic',
    interiorColor: 'Bordeauxrot',
    interiorMaterial: 'Vollleder',
    features: 'Sportabgasanlage,Bose-Soundsystem,Sportsitze Plus,Keyless Go,Matrix-LED,Sport Chrono Paket',
    title: 'Porsche 911 Carrera S Cabrio - Vorfuehrwagen, Sport Chrono',
    description:
      'Exklusives Vorfuehrfahrzeug mit Sport Chrono Paket und Sportabgasanlage. Wie neu, minimale Laufleistung. Vollgarantie des Herstellers.',
    locationCity: 'Stuttgart-Degerloch',
    locationPostalCode: '70567',
    vin: 'WP0ZZZ99ZTS123456',
  },
];

async function main() {
  console.log('Seed wird ausgefuehrt...');

  // Default-Admin per upsert anlegen: idempotent, ueberschreibt keinen
  // bereits vorhandenen (ggf. vom Nutzer geaenderten) Account erneut mit dem
  // Ausgangspasswort, legt ihn aber beim Erststart zuverlaessig an.
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, BCRYPT_COST);
  const adminUser = await prisma.adminUser.upsert({
    where: { email: DEFAULT_ADMIN.email },
    update: {},
    create: {
      email: DEFAULT_ADMIN.email,
      name: DEFAULT_ADMIN.name,
      passwordHash,
      role: DEFAULT_ADMIN.role,
    },
  });
  console.log(`Admin-Benutzer vorhanden: ${adminUser.email} (Rolle: ${adminUser.role})`);

  // Bestehende Daten bereinigen (nur lokale Dev-DB)
  await prisma.document.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.dealer.deleteMany();

  const dealer = await prisma.dealer.create({ data: DEALER });
  console.log(`Haendler angelegt: ${dealer.companyName}`);

  const createdVehicles: { id: string; make: string; model: string }[] = [];
  for (const v of VEHICLES) {
    const vehicle = await prisma.vehicle.create({
      data: { ...v, dealerId: dealer.id },
    });
    createdVehicles.push({ id: vehicle.id, make: vehicle.make, model: vehicle.model });
    console.log(`Fahrzeug angelegt: ${vehicle.make} ${vehicle.model}`);
  }

  // Seed-Fotos aus dem Repo (prisma/seed-photos/) ins Upload-Verzeichnis
  // kopieren und als Photo-Datensaetze registrieren. Notwendig, damit nach
  // jedem Render-Deploy (frisches Upload-Volume) wieder Fahrzeugfotos
  // vorhanden sind statt grauer Platzhalter.
  copySeedPhotos();
  await seedPhotosForVehicles(createdVehicles);

  console.log(`Fertig: ${VEHICLES.length} Fahrzeuge fuer Haendler "${dealer.companyName}" angelegt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
