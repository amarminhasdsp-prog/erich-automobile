import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';

// JWT-Secret wird ausschliesslich ueber Umgebungsvariablen konfiguriert
// (siehe .env.example). Kein Hardcoding von Secrets im Code.
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '12h';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

// Name des Auth-Cookies. Das Frontend muss diesen Namen NICHT selbst auslesen
// (httpOnly) - der Browser sendet ihn automatisch mit, sofern Requests mit
// `credentials: 'include'` (fetch) bzw. `withCredentials: true` (axios) erfolgen.
export const ADMIN_COOKIE_NAME = 'admin_token';

export type AdminRole = 'ADMIN' | 'EDITOR';

export interface AdminTokenPayload {
  userId: string;
  role: AdminRole;
}

// Am Request-Objekt angehaengte Admin-Identitaet (siehe requireAdminAuth).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: AdminTokenPayload;
    }
  }
}

if (!JWT_SECRET) {
  // Fail-fast: ein Admin-Bereich ohne konfiguriertes Secret waere entweder
  // unbenutzbar oder (schlimmer) unsicher. Server startet nicht.
  throw new Error('JWT_SECRET muss als Umgebungsvariable gesetzt sein (siehe .env.example)');
}

export function issueAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: TOKEN_TTL });
}

// Setzt das Auth-Cookie httpOnly -> nicht per JavaScript (und damit nicht per
// XSS) auslesbar.
export function setAdminAuthCookie(res: Response, token: string) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: TOKEN_TTL_MS,
    path: '/',
  });
}

export function clearAdminAuthCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  });
}

// Middleware: prueft das httpOnly-Auth-Cookie fuer alle /api/admin-Routen und
// haengt die Identitaet (userId + role) an req.adminUser.
export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) {
    return next(new ApiError(401, 'Nicht authentifiziert'));
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as AdminTokenPayload;
    if (!payload?.userId || !payload?.role) {
      return next(new ApiError(401, 'Ungueltiges Token'));
    }
    req.adminUser = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Ungueltiges oder abgelaufenes Token'));
  }
}

// Middleware-Factory: erzwingt eine der erlaubten Rollen. Muss NACH
// requireAdminAuth eingehaengt werden (benoetigt req.adminUser).
export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return next(new ApiError(401, 'Nicht authentifiziert'));
    }
    if (!allowedRoles.includes(req.adminUser.role)) {
      return next(new ApiError(403, 'Keine Berechtigung fuer diese Aktion'));
    }
    next();
  };
}
