import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
const PHOTOS_DIR = path.join(UPLOAD_DIR, 'photos');
const DOCUMENTS_DIR = path.join(UPLOAD_DIR, 'documents');
const LOGO_DIR = path.join(UPLOAD_DIR, 'logo');

// Upload-Verzeichnisse sicherstellen
[UPLOAD_DIR, PHOTOS_DIR, DOCUMENTS_DIR, LOGO_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

function safeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${unique}${ext}`;
}

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCUMENTS_DIR),
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});

// Logo hat genau eine aktuelle Datei (kein Verlauf wie bei Fahrzeugfotos).
// Der Dateiname wird dennoch per safeFilename() eindeutig generiert (statt
// z.B. immer "logo.png"), damit ein CDN/Browser-Cache alter Logo-Versionen
// beim Ersetzen nicht versehentlich weiter ausgeliefert wird. Die jeweils
// aktuelle Datei wird zentral in der Dealer-Tabelle (logoFilename) referenziert;
// alte Logo-Dateien werden beim Ersetzen aufgeraeumt (siehe dealerController).
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGO_DIR),
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
// Logos sind haeufig als PNG (mit Transparenz) oder WebP vorhanden. Bewusst
// KEIN SVG erlaubt: SVG kann eingebettetes JavaScript/externe Referenzen
// enthalten und wird von der Magic-Bytes-Pruefung (file-type) nicht sicher
// erkannt, was die zweite Verteidigungslinie gegen gefaelschte Dateitypen
// aushebeln wuerde (siehe verifyMagicBytesFactory unten).
const ALLOWED_LOGO_TYPES = ['image/png', 'image/webp', 'image/jpeg'];

function fileFilterFactory(allowed: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error(`Dateityp nicht erlaubt: ${file.mimetype}`));
    }
    cb(null, true);
  };
}

export const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilterFactory(ALLOWED_PHOTO_TYPES),
});

export const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilterFactory(ALLOWED_DOCUMENT_TYPES),
});

export const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilterFactory(ALLOWED_LOGO_TYPES),
});

// Zweite Verteidigungslinie nach Multer: file.mimetype wird vom Client per
// HTTP-Header gesetzt und ist damit faelschbar (z.B. eine .exe/.html-Datei
// umbenannt in "foto.jpg" mit Content-Type "image/jpeg"). Diese Middleware
// liest die tatsaechlichen Magic-Bytes der bereits auf Platte gespeicherten
// Datei(en) und lehnt den Request ab, falls der erkannte Dateityp nicht in
// der erlaubten Liste ist. Nicht erkennbare Typen (z.B. reine Textdateien)
// werden ebenfalls abgelehnt, da fuer Fotos/Dokumente immer ein bekanntes
// Binaerformat erwartet wird.
function verifyMagicBytesFactory(allowed: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const files: Express.Multer.File[] = req.file
      ? [req.file]
      : (req.files as Express.Multer.File[]) || [];

    if (files.length === 0) return next();

    try {
      // file-type ist ab v17 pure ESM. Da dieses Projekt CommonJS ist, wird
      // hier bewusst ein dynamischer import() genutzt (von TypeScript nicht
      // zu require() herunterkompiliert), statt auf eine veraltete CJS-Version
      // mit bekannter Sicherheitsluecke (GHSA-5v7r-6r5c-r473) zurueckzugreifen.
      const { fileTypeFromFile } = await import('file-type');
      const invalidFiles: Express.Multer.File[] = [];

      for (const file of files) {
        const detected = await fileTypeFromFile(file.path);
        if (!detected || !allowed.includes(detected.mime)) {
          invalidFiles.push(file);
        }
      }

      if (invalidFiles.length > 0) {
        // Alle Dateien dieses Requests aufraeumen (nicht nur die ungueltigen),
        // damit kein Datenmuell bei teilweise gueltigen Batch-Uploads bleibt.
        await Promise.all(
          files.map((file) => fs.promises.unlink(file.path).catch(() => undefined))
        );
        return next(
          new Error(
            `Dateiinhalt entspricht nicht dem erlaubten Dateityp (${invalidFiles
              .map((f) => f.originalname)
              .join(', ')})`
          )
        );
      }

      next();
    } catch (err) {
      await Promise.all(
        files.map((file) => fs.promises.unlink(file.path).catch(() => undefined))
      );
      next(err);
    }
  };
}

export const verifyPhotoMagicBytes = verifyMagicBytesFactory(ALLOWED_PHOTO_TYPES);
export const verifyDocumentMagicBytes = verifyMagicBytesFactory(ALLOWED_DOCUMENT_TYPES);
export const verifyLogoMagicBytes = verifyMagicBytesFactory(ALLOWED_LOGO_TYPES);

export { PHOTOS_DIR, DOCUMENTS_DIR, LOGO_DIR, UPLOAD_DIR };
