// Typen fuer den Fahrzeug-Datenvertrag der bestehenden Backend-API
// (autohaendler-backend, unveraendert). Siehe backend/prisma/schema.prisma
// und backend/src/utils/validation.ts im Referenzprojekt autohaendler-portal.

export type FuelType =
  | 'BENZIN'
  | 'DIESEL'
  | 'ELEKTRO'
  | 'HYBRID'
  | 'PLUGIN_HYBRID'
  | 'GAS_LPG'
  | 'GAS_CNG'
  | 'WASSERSTOFF';

export type TransmissionType = 'MANUELL' | 'AUTOMATIK' | 'HALBAUTOMATIK';

export type VehicleCategory =
  | 'PKW'
  | 'SUV_GELAENDEWAGEN'
  | 'KOMBI'
  | 'LIMOUSINE'
  | 'KLEINWAGEN'
  | 'CABRIO'
  | 'TRANSPORTER'
  | 'MOTORRAD'
  | 'WOHNMOBIL';

export type ConditionType = 'NEU' | 'GEBRAUCHT' | 'JAHRESWAGEN' | 'UNFALLFAHRZEUG' | 'VORFUEHRWAGEN';

export type VehicleStatus = 'VERFUEGBAR' | 'RESERVIERT' | 'VERKAUFT' | 'ENTWURF';

export type DocumentType =
  | 'TUEV_BERICHT'
  | 'FAHRZEUGSCHEIN'
  | 'FAHRZEUGBRIEF'
  | 'RECHNUNG'
  | 'SERVICEHEFT'
  | 'GUTACHTEN'
  | 'SONSTIGES';

export interface Photo {
  id: string;
  vehicleId: string;
  filename: string;
  originalName: string;
  isMain: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  filename: string;
  originalName: string;
  type: DocumentType;
  createdAt: string;
}

export interface Dealer {
  id: string;
  companyName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string | null;
  logoFilename?: string | null;
}

export interface Vehicle {
  id: string;
  dealerId: string;
  make: string;
  model: string;
  variant?: string | null;
  category: VehicleCategory;
  condition: ConditionType;
  status: VehicleStatus;
  price: number;
  vatDeductible: boolean;
  firstRegistration: string;
  mileageKm: number;
  powerKw: number;
  powerHp: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  cubicCapacity?: number | null;
  cylinders?: number | null;
  fuelConsumption?: number | null;
  co2Emissions?: number | null;
  emissionClass?: string | null;
  numberOfDoors?: number | null;
  numberOfSeats?: number | null;
  previousOwners?: number | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  interiorMaterial?: string | null;
  features?: string | null;
  title: string;
  description: string;
  locationCity?: string | null;
  locationPostalCode?: string | null;
  vin?: string | null;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  documents?: VehicleDocument[];
  dealer?: Dealer;
}

export interface VehicleListResponse {
  items: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VehicleQuery {
  make?: string;
  model?: string;
  category?: VehicleCategory;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  status?: VehicleStatus;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

// Alias fuer VehicleQuery aus Sicht der UI-Filterleiste/-Hooks.
export type VehicleFilters = VehicleQuery;
