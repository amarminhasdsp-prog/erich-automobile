import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { ApiError } from '../middleware/errorHandler';
import { documentTypeEnum } from '../utils/validation';

// POST /api/vehicles/:vehicleId/documents - Dokument hochladen (TUEV, Rechnung etc.)
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicleId } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new ApiError(404, 'Fahrzeug nicht gefunden');

    const file = req.file;
    if (!file) throw new ApiError(400, 'Keine Datei hochgeladen');

    const parsedType = documentTypeEnum.safeParse(req.body.type);
    if (!parsedType.success) throw new ApiError(400, 'Ungueltiger Dokumenttyp');

    const document = await prisma.document.create({
      data: {
        vehicleId,
        filename: file.filename,
        originalName: file.originalname,
        type: parsedType.data,
      },
    });

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/vehicles/:vehicleId/documents/:documentId
export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicleId, documentId } = req.params;
    const document = await prisma.document.findFirst({ where: { id: documentId, vehicleId } });
    if (!document) throw new ApiError(404, 'Dokument nicht gefunden');

    await prisma.document.delete({ where: { id: documentId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
