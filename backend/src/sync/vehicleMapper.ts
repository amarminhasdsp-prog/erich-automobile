// Mapped ein MobileDeFeedVehicleDto (siehe mobileDeXmlParser.ts) auf die
// Prisma Vehicle-Feld-Struktur (ohne dealerId/id - die setzt syncService.ts).
//
// Mapping-Grundlage: Recherche-Report Abschnitt 3.2. Wertebereiche fuer
// category/condition/fuelType/transmission/status muessen exakt den Enums
// in src/utils/validation.ts entsprechen, da vehicleCreateSchema/
// vehicleUpdateSchema diese Werte per Zod validieren.

import { MobileDeFeedVehicleDto } from './mobileDeXmlParser';

export class VehicleMappingError extends Error {}

// Feed-Wert (Arbeitsannahme, siehe Report Abschnitt 6) -> unser Enum-Wert.
const CATEGORY_MAP: Record<string, string> = {
  SEDAN: 'LIMOUSINE',
  LIMOUSINE: 'LIMOUSINE',
  SUV: 'SUV_GELAENDEWAGEN',
  SUV_GELAENDEWAGEN: 'SUV_GELAENDEWAGEN',
  ESTATE: 'KOMBI',
  KOMBI: 'KOMBI',
  SMALL_CAR: 'KLEINWAGEN',
  KLEINWAGEN: 'KLEINWAGEN',
  CONVERTIBLE: 'CABRIO',
  CABRIO: 'CABRIO',
  VAN: 'TRANSPORTER',
  TRANSPORTER: 'TRANSPORTER',
  MOTORCYCLE: 'MOTORRAD',
  MOTORRAD: 'MOTORRAD',
  MOTORHOME: 'WOHNMOBIL',
  WOHNMOBIL: 'WOHNMOBIL',
  CAR: 'PKW',
  PKW: 'PKW',
};

const CONDITION_MAP: Record<string, string> = {
  NEW: 'NEU',
  NEU: 'NEU',
  USED: 'GEBRAUCHT',
  GEBRAUCHT: 'GEBRAUCHT',
  ANNUAL: 'JAHRESWAGEN',
  JAHRESWAGEN: 'JAHRESWAGEN',
  ACCIDENT: 'UNFALLFAHRZEUG',
  UNFALLFAHRZEUG: 'UNFALLFAHRZEUG',
  DEMONSTRATION: 'VORFUEHRWAGEN',
  VORFUEHRWAGEN: 'VORFUEHRWAGEN',
};

const FUEL_TYPE_MAP: Record<string, string> = {
  PETROL: 'BENZIN',
  BENZIN: 'BENZIN',
  DIESEL: 'DIESEL',
  ELECTRIC: 'ELEKTRO',
  ELEKTRO: 'ELEKTRO',
  HYBRID: 'HYBRID',
  PLUGIN_HYBRID: 'PLUGIN_HYBRID',
  LPG: 'GAS_LPG',
  GAS_LPG: 'GAS_LPG',
  CNG: 'GAS_CNG',
  GAS_CNG: 'GAS_CNG',
  HYDROGEN: 'WASSERSTOFF',
  WASSERSTOFF: 'WASSERSTOFF',
};

const TRANSMISSION_MAP: Record<string, string> = {
  MANUAL: 'MANUELL',
  MANUELL: 'MANUELL',
  AUTOMATIC: 'AUTOMATIK',
  AUTOMATIK: 'AUTOMATIK',
  SEMI_AUTOMATIC: 'HALBAUTOMATIK',
  HALBAUTOMATIK: 'HALBAUTOMATIK',
};

// Feed-Status -> unser VehicleStatus. Fahrzeuge, die im Feed als verkauft/
// inaktiv markiert sind, werden genauso behandelt wie Fahrzeuge, die
// komplett aus dem Feed verschwinden (siehe syncService.ts Soft-Delete).
const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'VERFUEGBAR',
  VERFUEGBAR: 'VERFUEGBAR',
  RESERVED: 'RESERVIERT',
  RESERVIERT: 'RESERVIERT',
  SOLD: 'VERKAUFT',
  VERKAUFT: 'VERKAUFT',
  INACTIVE: 'VERKAUFT',
};

function mapEnum(
  map: Record<string, string>,
  value: string | undefined,
  fieldName: string,
  fallback: string
): string {
  if (!value) return fallback;
  const normalized = value.trim().toUpperCase();
  const mapped = map[normalized];
  if (!mapped) {
    console.error(
      `[vehicleMapper] Unbekannter Feed-Wert fuer ${fieldName}: "${value}" - falle auf Default "${fallback}" zurueck`
    );
    return fallback;
  }
  return mapped;
}

// Normalisiert ein Datum aus dem Feed. Akzeptiert volle Daten (YYYY-MM-DD)
// sowie Monat/Jahr-Angaben (YYYY-MM), die auf den 1. des Monats normalisiert
// werden (siehe Report Abschnitt 3.2, Mapping-Hinweis firstRegistration).
function parseFirstRegistration(value: string | undefined): Date {
  if (!value) return new Date();
  const trimmed = value.trim();
  const monthYearMatch = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (monthYearMatch) {
    return new Date(`${monthYearMatch[1]}-${monthYearMatch[2]}-01T00:00:00.000Z`);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new VehicleMappingError(`Ungueltiges Datum in firstRegistration: "${value}"`);
  }
  return parsed;
}

// EUR (Dezimalzahl, z.B. 24990.00) -> Cent (Int), wie vom Prisma-Schema
// erwartet (price ist Int, siehe schema.prisma Kommentar "in Cent (EUR)").
export function eurToCents(priceEur: number): number {
  return Math.round(priceEur * 100);
}

export interface MappedVehicleFields {
  externalId: string;
  externalSource: 'MOBILE_DE';
  make: string;
  model: string;
  variant?: string;
  category: string;
  condition: string;
  status: string;
  price: number;
  vatDeductible: boolean;
  firstRegistration: Date;
  mileageKm: number;
  powerKw: number;
  powerHp: number;
  fuelType: string;
  transmission: string;
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
}

// Mapped ein einzelnes Feed-DTO auf die Prisma Vehicle-Felder. Wirft
// VehicleMappingError bei fachlich unbrauchbaren Pflichtfeldern (leere
// Marke/Modell) - der Aufrufer zaehlt das als Fehler fuer dieses eine
// Fahrzeug, ohne den gesamten Sync-Lauf abzubrechen (siehe syncService.ts).
export function mapFeedVehicleToPrisma(dto: MobileDeFeedVehicleDto): MappedVehicleFields {
  if (!dto.make || !dto.model) {
    throw new VehicleMappingError(
      `Fahrzeug ${dto.externalId} hat keine gueltige Marke/Modell-Angabe`
    );
  }

  return {
    externalId: dto.externalId,
    externalSource: 'MOBILE_DE',
    make: dto.make,
    model: dto.model,
    variant: dto.variant,
    category: mapEnum(CATEGORY_MAP, dto.category, 'category', 'PKW'),
    condition: mapEnum(CONDITION_MAP, dto.condition, 'condition', 'GEBRAUCHT'),
    status: mapEnum(STATUS_MAP, dto.status, 'status', 'VERFUEGBAR'),
    price: eurToCents(dto.priceEur),
    vatDeductible: dto.vatDeductible,
    firstRegistration: parseFirstRegistration(dto.firstRegistration),
    mileageKm: dto.mileageKm ?? 0,
    powerKw: dto.powerKw ?? 0,
    powerHp: dto.powerHp ?? 0,
    fuelType: mapEnum(FUEL_TYPE_MAP, dto.fuelType, 'fuelType', 'BENZIN'),
    transmission: mapEnum(TRANSMISSION_MAP, dto.transmission, 'transmission', 'MANUELL'),
    cubicCapacity: dto.cubicCapacity,
    cylinders: dto.cylinders,
    fuelConsumption: dto.fuelConsumptionCombined,
    co2Emissions: dto.co2Emission,
    emissionClass: dto.emissionClass,
    numberOfDoors: dto.numberOfDoors,
    numberOfSeats: dto.numberOfSeats,
    previousOwners: dto.previousOwners,
    exteriorColor: dto.exteriorColor,
    interiorColor: dto.interiorColor,
    interiorMaterial: dto.interiorMaterial,
    // Feature-Liste -> kommagetrennter String (siehe Prisma-Schema-Kommentar
    // zu Vehicle.features: bewusst keine Relationstabelle).
    features: dto.features.length > 0 ? dto.features.join(',') : undefined,
    title: dto.title,
    description: dto.description ?? '',
    locationCity: dto.locationCity,
    locationPostalCode: dto.locationPostalCode,
    vin: dto.vin,
  };
}
