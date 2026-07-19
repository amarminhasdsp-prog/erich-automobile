import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { ApiError } from '../middleware/errorHandler';

// POST /api/vehicles/:vehicleId/photos - Mehrere Fotos hochladen
export async function uploadPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicleId } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new ApiError(404, 'Fahrzeug nicht gefunden');

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) throw new ApiError(400, 'Keine Dateien hochgeladen');

    const existingCount = await prisma.photo.count({ where: { vehicleId } });

    const photos = await prisma.$transaction(
      files.map((file, idx) =>
        prisma.photo.create({
          data: {
            vehicleId,
            filename: file.filename,
            originalName: file.originalname,
            isMain: existingCount === 0 && idx === 0,
            sortOrder: existingCount + idx,
          },
        })
      )
    );

    res.status(201).json(photos);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/vehicles/:vehicleId/photos/:photoId/main - als Hauptbild setzen
export async function setMainPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicleId, photoId } = req.params;
    const photo = await prisma.photo.findFirst({ where: { id: photoId, vehicleId } });
    if (!photo) throw new ApiError(404, 'Foto nicht gefunden');

    await prisma.$transaction([
      prisma.photo.updateMany({ where: { vehicleId }, data: { isMain: false } }),
      prisma.photo.update({ where: { id: photoId }, data: { isMain: true } }),
    ]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/vehicles/:vehicleId/photos/:photoId
export async function deletePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicleId, photoId } = req.params;
    const photo = await prisma.photo.findFirst({ where: { id: photoId, vehicleId } });
    if (!photo) throw new ApiError(404, 'Foto nicht gefunden');

    await prisma.photo.delete({ where: { id: photoId } });
    // Hinweis: Physische Datei wird bewusst nicht geloescht, um Datenverlust bei
    // gleichzeitigen Requests zu vermeiden. Kann per Cleanup-Job entfernt werden.
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
