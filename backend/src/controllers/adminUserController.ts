import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { ApiError } from '../middleware/errorHandler';
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
  adminUserChangeOwnPasswordSchema,
} from '../utils/validation';

const BCRYPT_COST = 12;

// Feld-Whitelist fuer alle Responses: passwordHash wird NIEMALS zurueckgegeben.
function toPublicUser(user: { id: string; email: string; name: string; role: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// GET /api/admin/users - nur ADMIN (siehe requireRole('ADMIN') in den Routen)
export async function listAdminUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ items: users.map(toPublicUser) });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/users - nur ADMIN
export async function createAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = adminUserCreateSchema.parse(req.body);

    const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, 'E-Mail wird bereits verwendet');

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);
    const user = await prisma.adminUser.create({
      data: { email: data.email, name: data.name, passwordHash, role: data.role },
    });

    res.status(201).json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/:id - nur ADMIN
export async function updateAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = adminUserUpdateSchema.parse(req.body);

    const existing = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Benutzer nicht gefunden');

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.adminUser.findUnique({ where: { email: data.email } });
      if (emailTaken) throw new ApiError(409, 'E-Mail wird bereits verwendet');
    }

    const updateData: { email?: string; name?: string; role?: string; passwordHash?: string } = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);

    const user = await prisma.adminUser.update({ where: { id: req.params.id }, data: updateData });
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id - nur ADMIN, nicht die eigene ID (verhindert,
// dass sich ein Admin versehentlich selbst aussperrt bzw. den letzten
// verbliebenen Zugang loescht).
export async function deleteAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.params.id === req.adminUser?.userId) {
      throw new ApiError(400, 'Der eigene Account kann nicht geloescht werden');
    }

    const existing = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Benutzer nicht gefunden');

    await prisma.adminUser.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/me/password - jeder eingeloggte Benutzer kann sein
// eigenes Passwort aendern (benoetigt das aktuelle Passwort zur Bestaetigung).
export async function changeOwnPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = adminUserChangeOwnPasswordSchema.parse(req.body);

    const userId = req.adminUser?.userId;
    if (!userId) throw new ApiError(401, 'Nicht authentifiziert');

    const user = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'Benutzer nicht gefunden');

    const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentMatches) throw new ApiError(401, 'Aktuelles Passwort ist falsch');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await prisma.adminUser.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
