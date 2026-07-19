import type { Dealer, Vehicle, VehicleListResponse, VehicleQuery } from '../types/vehicle';

// Basis-URL der bestehenden Backend-API (autohaendler-backend, Port 4000).
// API-Vertrag wird unveraendert konsumiert, siehe autohaendler-portal/backend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Anfrage fehlgeschlagen (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Antwort war kein JSON, Standardnachricht verwenden.
    }
    throw new ApiRequestError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function buildQueryString(query: VehicleQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchVehicles(query: VehicleQuery = {}): Promise<VehicleListResponse> {
  const res = await fetch(`${API_URL}/api/vehicles${buildQueryString(query)}`);
  return handleResponse<VehicleListResponse>(res);
}

export async function fetchVehicle(id: string): Promise<Vehicle> {
  const res = await fetch(`${API_URL}/api/vehicles/${id}`);
  return handleResponse<Vehicle>(res);
}

// Baut die vollstaendige URL zu einem hochgeladenen Foto/Dokument/Logo.
export function buildUploadUrl(filename: string, kind: 'photos' | 'documents' | 'logo' = 'photos'): string {
  return `${API_URL}/uploads/${kind}/${filename}`;
}

// Alias, wie in den Fahrzeug-Kartenkomponenten verwendet (Fotos konkret).
export function buildPhotoUrl(filename: string): string {
  return buildUploadUrl(filename, 'photos');
}

export async function fetchDealers(): Promise<Dealer[]> {
  const res = await fetch(`${API_URL}/api/dealers`);
  return handleResponse<Dealer[]>(res);
}

export { API_URL };
