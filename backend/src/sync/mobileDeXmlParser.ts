// Parst den mobile.de-Fahrzeug-Feed (XML) in ein internes DTO-Array.
//
// Format-Referenz: siehe Recherche-Report Abschnitt 6 sowie die Beispiel-
// Fixture unter __fixtures__/sample-feed.xml. Dieses Format ist eine
// Arbeitsannahme, KEIN verifiziertes mobile.de-Format (siehe Report
// Abschnitt 5.2/6) - bei Abweichung vom echten Format ist nur dieser Parser
// bzw. vehicleMapper.ts anzupassen, nicht die restliche Architektur.

import { XMLParser } from 'fast-xml-parser';

export class MobileDeXmlParseError extends Error {}

export interface MobileDeFeedVehicleDto {
  externalId: string;
  status: string;
  make: string;
  model: string;
  variant?: string;
  category?: string;
  condition?: string;
  priceEur: number;
  vatDeductible: boolean;
  firstRegistration?: string;
  mileageKm?: number;
  powerKw?: number;
  powerHp?: number;
  fuelType?: string;
  transmission?: string;
  cubicCapacity?: number;
  cylinders?: number;
  fuelConsumptionCombined?: number;
  co2Emission?: number;
  emissionClass?: string;
  numberOfDoors?: number;
  numberOfSeats?: number;
  previousOwners?: number;
  exteriorColor?: string;
  interiorColor?: string;
  interiorMaterial?: string;
  features: string[];
  title: string;
  description?: string;
  locationCity?: string;
  locationPostalCode?: string;
  vin?: string;
  images: { url: string; sortOrder: number; isMain: boolean }[];
}

export interface MobileDeFeedDto {
  dealerId: string;
  generatedAt?: string;
  vehicles: MobileDeFeedVehicleDto[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  trimValues: true,
});

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOrUndefined(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseVehicleNode(node: Record<string, unknown>): MobileDeFeedVehicleDto {
  const externalId = textOrUndefined(node.externalId);
  if (!externalId) {
    throw new MobileDeXmlParseError('Fahrzeug im Feed ohne <externalId> gefunden');
  }

  const priceNode = (node.price ?? {}) as Record<string, unknown>;
  const priceValue = numberOrUndefined(
    typeof priceNode === 'object' ? (priceNode as any)['#text'] ?? node.price : node.price
  );
  if (priceValue === undefined) {
    throw new MobileDeXmlParseError(`Fahrzeug ${externalId} im Feed ohne gueltigen <price> gefunden`);
  }

  const powerNode = (node.power ?? {}) as Record<string, unknown>;
  const mileageNode = (node.mileage ?? {}) as Record<string, unknown>;
  const locationNode = (node.location ?? {}) as Record<string, unknown>;

  const featureNodes = toArray((node.features as any)?.feature);
  const features = featureNodes
    .map((f) => textOrUndefined(f))
    .filter((f): f is string => Boolean(f));

  const imageNodes = toArray((node.images as any)?.image);
  const images = imageNodes
    .map((img: any, idx: number) => {
      const url = textOrUndefined(img?.['#text'] ?? img);
      if (!url) return null;
      const sortOrderRaw = img?.['@_sortOrder'];
      const isMainRaw = img?.['@_isMain'];
      return {
        url,
        sortOrder: numberOrUndefined(sortOrderRaw) ?? idx,
        isMain: isMainRaw === true || isMainRaw === 'true',
      };
    })
    .filter((img): img is { url: string; sortOrder: number; isMain: boolean } => img !== null);

  return {
    externalId,
    status: textOrUndefined(node.status) ?? 'ACTIVE',
    make: textOrUndefined(node.make) ?? '',
    model: textOrUndefined(node.model) ?? '',
    variant: textOrUndefined(node.variant),
    category: textOrUndefined(node.category),
    condition: textOrUndefined(node.condition),
    priceEur: priceValue,
    vatDeductible: priceNode?.['@_vatDeductible'] === true || priceNode?.['@_vatDeductible'] === 'true',
    firstRegistration: textOrUndefined(node.firstRegistration),
    mileageKm: numberOrUndefined(mileageNode?.['#text'] ?? node.mileage),
    powerKw: numberOrUndefined(powerNode?.['@_kw']),
    powerHp: numberOrUndefined(powerNode?.['@_hp']),
    fuelType: textOrUndefined(node.fuelType),
    transmission: textOrUndefined(node.transmission),
    cubicCapacity: numberOrUndefined(node.cubicCapacity),
    cylinders: numberOrUndefined(node.cylinders),
    fuelConsumptionCombined: numberOrUndefined(node.fuelConsumptionCombined),
    co2Emission: numberOrUndefined(node.co2Emission),
    emissionClass: textOrUndefined(node.emissionClass),
    numberOfDoors: numberOrUndefined(node.numberOfDoors),
    numberOfSeats: numberOrUndefined(node.numberOfSeats),
    previousOwners: numberOrUndefined(node.previousOwners),
    exteriorColor: textOrUndefined(node.exteriorColor),
    interiorColor: textOrUndefined(node.interiorColor),
    interiorMaterial: textOrUndefined(node.interiorMaterial),
    features,
    title: textOrUndefined(node.title) ?? `${textOrUndefined(node.make) ?? ''} ${textOrUndefined(node.model) ?? ''}`.trim(),
    description: textOrUndefined(node.description),
    locationCity: textOrUndefined(locationNode?.['@_city']),
    locationPostalCode: textOrUndefined(locationNode?.['@_postalCode']),
    vin: textOrUndefined(node.vin),
    images,
  };
}

// Parst den rohen XML-String. Wirft MobileDeXmlParseError bei strukturell
// ungueltigem XML oder fehlenden Pflichtfeldern - der Aufrufer (syncService)
// muss das abfangen und den Sync-Lauf abbrechen, statt einen Teilzustand in
// die DB zu schreiben.
export function parseMobileDeFeed(xml: string): MobileDeFeedDto {
  let parsed: any;
  try {
    parsed = parser.parse(xml);
  } catch (err) {
    throw new MobileDeXmlParseError(`XML konnte nicht geparst werden: ${(err as Error).message}`);
  }

  const feedNode = parsed?.vehicleFeed;
  if (!feedNode) {
    throw new MobileDeXmlParseError('XML enthaelt kein <vehicleFeed>-Wurzelelement');
  }

  const dealerId = textOrUndefined(feedNode['@_dealerId']) ?? '';
  const generatedAt = textOrUndefined(feedNode['@_generatedAt']);
  const vehicleNodes = toArray(feedNode.vehicle);

  const vehicles: MobileDeFeedVehicleDto[] = [];
  for (const node of vehicleNodes) {
    vehicles.push(parseVehicleNode(node as Record<string, unknown>));
  }

  return { dealerId, generatedAt, vehicles };
}
