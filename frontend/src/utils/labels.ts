import type {
  ConditionType,
  DocumentType,
  FuelType,
  TransmissionType,
  VehicleCategory,
  VehicleStatus,
} from '../types/vehicle';

export const statusLabels: Record<VehicleStatus, string> = {
  VERFUEGBAR: 'Verfuegbar',
  RESERVIERT: 'Reserviert',
  VERKAUFT: 'Verkauft',
  ENTWURF: 'Entwurf',
};

export const documentTypeLabels: Record<DocumentType, string> = {
  TUEV_BERICHT: 'TÜV-Bericht',
  FAHRZEUGSCHEIN: 'Fahrzeugschein',
  FAHRZEUGBRIEF: 'Fahrzeugbrief',
  RECHNUNG: 'Rechnung',
  SERVICEHEFT: 'Serviceheft',
  GUTACHTEN: 'Gutachten',
  SONSTIGES: 'Sonstiges',
};

export const fuelTypeLabels: Record<FuelType, string> = {
  BENZIN: 'Benzin',
  DIESEL: 'Diesel',
  ELEKTRO: 'Elektro',
  HYBRID: 'Hybrid',
  PLUGIN_HYBRID: 'Plug-in-Hybrid',
  GAS_LPG: 'LPG',
  GAS_CNG: 'CNG',
  WASSERSTOFF: 'Wasserstoff',
};

export const transmissionLabels: Record<TransmissionType, string> = {
  MANUELL: 'Manuell',
  AUTOMATIK: 'Automatik',
  HALBAUTOMATIK: 'Halbautomatik',
};

export const categoryLabels: Record<VehicleCategory, string> = {
  PKW: 'PKW',
  SUV_GELAENDEWAGEN: 'SUV / Gelaendewagen',
  KOMBI: 'Kombi',
  LIMOUSINE: 'Limousine',
  KLEINWAGEN: 'Kleinwagen',
  CABRIO: 'Cabrio',
  TRANSPORTER: 'Transporter',
  MOTORRAD: 'Motorrad',
  WOHNMOBIL: 'Wohnmobil',
};

export const conditionLabels: Record<ConditionType, string> = {
  NEU: 'Neufahrzeug',
  GEBRAUCHT: 'Gebrauchtfahrzeug',
  JAHRESWAGEN: 'Jahreswagen',
  UNFALLFAHRZEUG: 'Unfallfahrzeug',
  VORFUEHRWAGEN: 'Vorfuehrwagen',
};

const priceFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const mileageFormatter = new Intl.NumberFormat('de-DE');

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

export function formatMileage(km: number): string {
  return `${mileageFormatter.format(km)} km`;
}

export function formatPower(kw: number, hp: number): string {
  return `${kw} kW (${hp} PS)`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatFeatures(features?: string | null): string[] {
  if (!features) return [];
  return features
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
}
