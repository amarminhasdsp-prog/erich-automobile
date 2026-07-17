import type { Vehicle, VehicleListResponse, VehicleQuery } from '../../types/vehicle';
import { API_URL, ApiRequestError } from '../../api/client';

export { ApiRequestError };

// Das Admin-JWT wird seit dem Backend-Security-Fix (httpOnly-Cookie statt
// Response-Body) NICHT MEHR im localStorage gehalten - der Cookie ist per
// JavaScript nicht lesbar (XSS-Schutz) und wird vom Browser automatisch mit
// jedem Request an dieselbe Origin/Port-Kombination mitgesendet, sofern
// `credentials: 'include'` gesetzt ist (siehe unten). Dieser Eintrag haelt nur
// die oeffentlichen Nutzerdaten aus der Login-Antwort (kein Secret, kein
// Token), damit die Admin-Routen nach einem Reload nicht kurz aufblitzen,
// bevor eine Anfrage 401 liefert, und damit Header/Nav den Namen sowie die
// Rolle anzeigen koennen (es gibt bewusst keinen GET /me-Endpoint im Backend).
const SESSION_USER_KEY = 'autohaus-premium-admin-user';

export type AdminRole = 'ADMIN' | 'EDITOR';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminUserWithTimestamps extends AdminUser {
  createdAt: string;
  updatedAt: string;
}

export function getStoredAdminUser(): AdminUser | null {
  const raw = sessionStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function hasAdminSession(): boolean {
  return getStoredAdminUser() !== null;
}

function setStoredAdminUser(user: AdminUser): void {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearAdminSessionFlag(): void {
  sessionStorage.removeItem(SESSION_USER_KEY);
}

async function handleAdminResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Cookie abgelaufen/ungueltig: lokalen Auth-Zustand aufraeumen, damit die
    // naechste Aktion wieder zum Login fuehrt statt in einer Fehlerschleife
    // zu enden. Das Cookie selbst wird vom Server verwaltet (Ablaufzeit).
    clearAdminSessionFlag();
  }
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

// `credentials: 'include'` ist bei jedem Admin-Request erforderlich, damit
// der Browser das httpOnly-Cookie an das Backend mitsendet (auch bei
// Cross-Origin-Requests zwischen Frontend-Port und Backend-Port 4000).
const WITH_CREDENTIALS: Pick<RequestInit, 'credentials'> = { credentials: 'include' };

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

export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    ...WITH_CREDENTIALS,
  });
  const body = await handleAdminResponse<{ success: true; user: AdminUser }>(res);
  setStoredAdminUser(body.user);
  return body.user;
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/admin/logout`, { method: 'POST', ...WITH_CREDENTIALS });
  } finally {
    clearAdminSessionFlag();
  }
}

export async function listAdminUsers(): Promise<AdminUserWithTimestamps[]> {
  const res = await fetch(`${API_URL}/api/admin/users`, WITH_CREDENTIALS);
  const body = await handleAdminResponse<{ items: AdminUserWithTimestamps[] }>(res);
  return body.items;
}

export interface AdminUserCreatePayload {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

export async function createAdminUser(payload: AdminUserCreatePayload): Promise<AdminUserWithTimestamps> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<AdminUserWithTimestamps>(res);
}

export interface AdminUserUpdatePayload {
  email?: string;
  name?: string;
  password?: string;
  role?: AdminRole;
}

export async function updateAdminUser(
  id: string,
  payload: AdminUserUpdatePayload
): Promise<AdminUserWithTimestamps> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<AdminUserWithTimestamps>(res);
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    method: 'DELETE',
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<void>(res);
}

export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/users/me/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
    ...WITH_CREDENTIALS,
  });
  await handleAdminResponse<{ success: true }>(res);
}

export async function fetchAdminVehicles(query: VehicleQuery = {}): Promise<VehicleListResponse> {
  const res = await fetch(`${API_URL}/api/admin/vehicles${buildQueryString(query)}`, WITH_CREDENTIALS);
  return handleAdminResponse<VehicleListResponse>(res);
}

export async function fetchAdminVehicle(id: string): Promise<Vehicle> {
  const res = await fetch(`${API_URL}/api/admin/vehicles/${id}`, WITH_CREDENTIALS);
  return handleAdminResponse<Vehicle>(res);
}

export type VehicleWritePayload = Omit<
  Vehicle,
  'id' | 'createdAt' | 'updatedAt' | 'photos' | 'documents' | 'dealer'
>;

export async function createAdminVehicle(payload: Partial<VehicleWritePayload>): Promise<Vehicle> {
  const res = await fetch(`${API_URL}/api/admin/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<Vehicle>(res);
}

export async function updateAdminVehicle(id: string, payload: Partial<VehicleWritePayload>): Promise<Vehicle> {
  const res = await fetch(`${API_URL}/api/admin/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<Vehicle>(res);
}

export async function deleteAdminVehicle(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/vehicles/${id}`, {
    method: 'DELETE',
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<void>(res);
}

export async function uploadAdminPhotos(vehicleId: string, files: File[]): Promise<void> {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  const res = await fetch(`${API_URL}/api/admin/vehicles/${vehicleId}/photos`, {
    method: 'POST',
    body: formData,
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<void>(res);
}

export async function setAdminMainPhoto(vehicleId: string, photoId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/vehicles/${vehicleId}/photos/${photoId}/main`, {
    method: 'PATCH',
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<void>(res);
}

export async function deleteAdminPhoto(vehicleId: string, photoId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/vehicles/${vehicleId}/photos/${photoId}`, {
    method: 'DELETE',
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<void>(res);
}

export async function uploadAdminDocument(vehicleId: string, file: File, type: string): Promise<void> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', type);
  const res = await fetch(`${API_URL}/api/admin/vehicles/${vehicleId}/documents`, {
    method: 'POST',
    body: formData,
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<void>(res);
}

export async function deleteAdminDocument(vehicleId: string, documentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/vehicles/${vehicleId}/documents/${documentId}`, {
    method: 'DELETE',
    ...WITH_CREDENTIALS,
  });
  return handleAdminResponse<void>(res);
}
