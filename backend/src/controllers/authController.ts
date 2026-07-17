import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { ApiError } from '../middleware/errorHandler';
import { adminLoginSchema } from '../utils/validation';
import {
  issueAdminToken,
  setAdminAuthCookie,
  clearAdminAuthCookie,
  AdminRole,
} from '../middleware/adminAuth';

// POST /api/admin/login - email+password gegen AdminUser pruefen, JWT
// (userId + role) als httpOnly-Cookie setzen. Der Token wird NICHT im
// Response-Body zurueckgegeben (XSS-Haertung), das Frontend erhaelt lediglich
// eine Erfolgsbestaetigung samt oeffentlichen Nutzerdaten (ohne Hash).
export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);

    // Bewusst generische Fehlermeldung fuer "E-Mail nicht gefunden" UND
    // "Passwort falsch" - verhindert User-Enumeration ueber die Login-Route.
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) throw new ApiError(401, 'E-Mail oder Passwort falsch');

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) throw new ApiError(401, 'E-Mail oder Passwort falsch');

    const token = issueAdminToken({ userId: user.id, role: user.role as AdminRole });
    setAdminAuthCookie(res, token);

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/logout - Auth-Cookie loeschen.
export async function adminLogout(_req: Request, res: Response) {
  clearAdminAuthCookie(res);
  res.json({ success: true });
}
