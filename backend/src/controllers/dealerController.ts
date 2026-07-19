import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';
import { ApiError } from '../middleware/errorHandler';
import { LOGO_DIR } from '../middleware/upload';

// GET /api/dealers - Liste der Haendler (fuer Auswahl im Frontend, aktuell nur einer)
export async function listDealers(_req: Request, res: Response, next: NextFunction) {
  try {
    const dealers = await prisma.dealer.findMany();
    res.json(dealers);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/dealers/:id/logo - Haendler-Logo hochladen/ersetzen (Admin-only,
// requireAdminAuth ist in adminDealerRoutes.ts vor diese Route gehaengt).
// Ersetzt eine vorher hochgeladene Logo-Datei vollstaendig (alte Datei wird
// vom Datentraeger entfernt), damit sich keine verwaisten Logo-Dateien
// ansammeln - anders als bei Fahrzeugfotos gibt es hier bewusst nur eine
// aktuelle Version statt eines Verlaufs.
export async function uploadDealerLogo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const dealer = await prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new ApiError(404, 'Haendler nicht gefunden');

    const file = req.file;
    if (!file) throw new ApiError(400, 'Keine Datei hochgeladen');

    const previousFilename = dealer.logoFilename;

    const updated = await prisma.dealer.update({
      where: { id },
      data: { logoFilename: file.filename },
    });

    if (previousFilename) {
      const previousPath = path.join(LOGO_DIR, previousFilename);
      await fs.promises.unlink(previousPath).catch(() => undefined);
    }

    res.status(201).json({ logoFilename: updated.logoFilename });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/dealers/:id/logo - Logo entfernen, Frontend faellt
// automatisch auf das generierte SVG-Signet zurueck.
export async function deleteDealerLogo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const dealer = await prisma.dealer.findUnique({ where: { id } });
    if (!dealer) throw new ApiError(404, 'Haendler nicht gefunden');
    if (!dealer.logoFilename) {
      return res.status(204).send();
    }

    const logoPath = path.join(LOGO_DIR, dealer.logoFilename);
    await prisma.dealer.update({ where: { id }, data: { logoFilename: null } });
    await fs.promises.unlink(logoPath).catch(() => undefined);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
