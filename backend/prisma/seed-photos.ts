// Einmal-Skript: registriert die per curl von loremflickr beschafften
// Fahrzeugfotos (bereits im Uploads-Verzeichnis) als Photo-Datensaetze.
// Nutzt exakt das bestehende Photo-Schema (filename, originalName, isMain, sortOrder),
// damit die Auslieferung ueber die bestehende /uploads/photos Static-Route funktioniert.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// make -> [dateiname-praefix] passend zu den heruntergeladenen Fotos (3 pro Fahrzeug)
const PHOTO_MAP: Record<string, string[]> = {
  Porsche: ['porsche-1.jpg', 'porsche-2.jpg', 'porsche-3.jpg'],
  Ford: ['ford-1.jpg', 'ford-2.jpg', 'ford-3.jpg'],
  Tesla: ['tesla-1.jpg', 'tesla-2.jpg', 'tesla-3.jpg'],
  'Škoda': ['skoda-1.jpg', 'skoda-2.jpg', 'skoda-3.jpg'],
  'Mercedes-Benz': ['mercedes-1.jpg', 'mercedes-2.jpg', 'mercedes-3.jpg'],
  Audi: ['audi-1.jpg', 'audi-2.jpg', 'audi-3.jpg'],
  BMW: ['bmw-1.jpg', 'bmw-2.jpg', 'bmw-3.jpg'],
  Volkswagen: ['vw-1.jpg', 'vw-2.jpg', 'vw-3.jpg'],
};

async function main() {
  const vehicles = await prisma.vehicle.findMany();
  console.log(`${vehicles.length} Fahrzeuge gefunden.`);

  for (const vehicle of vehicles) {
    const files = PHOTO_MAP[vehicle.make];
    if (!files) {
      console.warn(`Keine Fotos fuer Marke "${vehicle.make}" hinterlegt, ueberspringe.`);
      continue;
    }

    const existing = await prisma.photo.count({ where: { vehicleId: vehicle.id } });
    if (existing > 0) {
      console.log(`Fahrzeug ${vehicle.make} ${vehicle.model} hat bereits Fotos, ueberspringe.`);
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
