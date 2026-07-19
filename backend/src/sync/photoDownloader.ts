// Laedt Foto-URLs aus dem mobile.de-Feed herunter und speichert sie im
// bestehenden Uploads/Photos-Verzeichnis - gleiche Konvention wie der
// bestehende manuelle Foto-Upload (siehe middleware/upload.ts,
// controllers/photoController.ts): gleiche Zielverzeichnis-Konstante
// (PHOTOS_DIR), gleiches Dateinamens-Schema (Timestamp + Zufallsstring +
// Original-Extension) und gleiche Magic-Bytes-Pruefung der erlaubten
// Bildtypen.
//
// Ein einzelnes fehlerhaftes Foto (Timeout, 404, falscher Dateityp) darf den
// gesamten Sync-Lauf NICHT abbrechen - dieses Modul faengt Fehler pro Foto
// ab und gibt sie im Ergebnis-Array zurueck, statt zu werfen.

import path from 'path';
import fs from 'fs';
import { PHOTOS_DIR } from '../middleware/upload';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOWNLOAD_TIMEOUT_MS = 10_000; // siehe Report Abschnitt 4.4 (Empfehlung: ~10s pro Bild)
const MAX_PHOTO_BYTES = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

export interface DownloadedPhoto {
  sourceUrl: string;
  filename: string;
  originalName: string;
  sortOrder: number;
  isMain: boolean;
}

export interface PhotoDownloadFailure {
  sourceUrl: string;
  error: string;
}

export interface PhotoDownloadResult {
  downloaded: DownloadedPhoto[];
  failed: PhotoDownloadFailure[];
}

// Gleiche Dateinamens-Konvention wie middleware/upload.ts safeFilename().
function safeFilename(ext: string): string {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${unique}${ext}`;
}

function extensionFromContentType(contentType: string | null): string {
  switch (contentType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}

async function downloadSingle(
  sourceUrl: string,
  sortOrder: number,
  isMain: boolean
): Promise<DownloadedPhoto> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength === 0) {
      throw new Error('Leere Bild-Antwort');
    }
    if (buffer.byteLength > MAX_PHOTO_BYTES) {
      throw new Error(`Bild ueberschreitet maximale Groesse (${MAX_PHOTO_BYTES} Bytes)`);
    }

    // Magic-Bytes-Pruefung wie bei manuellen Uploads (verifyPhotoMagicBytes),
    // hier direkt auf den Buffer statt auf eine bereits gespeicherte Datei.
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(buffer);
    const mime = detected?.mime ?? contentType;
    if (!mime || !ALLOWED_PHOTO_TYPES.includes(mime)) {
      throw new Error(`Nicht erlaubter Bildtyp: ${mime ?? 'unbekannt'}`);
    }

    const ext = detected ? `.${detected.ext}` : extensionFromContentType(contentType);
    const filename = safeFilename(ext || '.jpg');
    const destination = path.join(PHOTOS_DIR, filename);

    await fs.promises.writeFile(destination, buffer);

    return {
      sourceUrl,
      filename,
      originalName: path.basename(new URL(sourceUrl).pathname) || filename,
      sortOrder,
      isMain,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Laedt eine Liste von Foto-URLs herunter. Jedes Foto wird unabhaengig
// verarbeitet; Fehler werden gesammelt statt geworfen.
export async function downloadPhotos(
  images: { url: string; sortOrder: number; isMain: boolean }[]
): Promise<PhotoDownloadResult> {
  const downloaded: DownloadedPhoto[] = [];
  const failed: PhotoDownloadFailure[] = [];

  for (const image of images) {
    try {
      const result = await downloadSingle(image.url, image.sortOrder, image.isMain);
      downloaded.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[photoDownloader] Foto-Download fehlgeschlagen fuer ${image.url}: ${message}`);
      failed.push({ sourceUrl: image.url, error: message });
    }
  }

  return { downloaded, failed };
}
