import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Zentrale Fehlerbehandlung. Gibt niemals interne Details/Stacktraces an den Client.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  // Multer- und sonstige Fehler
  if (err instanceof Error) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Interner Serverfehler' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route nicht gefunden' });
}
