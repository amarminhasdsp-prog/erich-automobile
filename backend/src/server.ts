import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import vehicleRoutes from './routes/vehicleRoutes';
import dealerRoutes from './routes/dealerRoutes';
import adminVehicleRoutes from './routes/adminVehicleRoutes';
import adminAuthRoutes from './routes/adminAuthRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import adminSyncRoutes from './routes/adminSyncRoutes';
import adminDealerRoutes from './routes/adminDealerRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { UPLOAD_DIR } from './middleware/upload';
import { adminRateLimiter } from './middleware/rateLimit';
import { startMobileDeScheduler } from './sync/scheduler';

const app = express();
const PORT = process.env.PORT || 4000;

// Security-Header
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: Nur die konfigurierten Frontend-Origins duerfen zugreifen.
// CORS_ORIGIN akzeptiert eine kommagetrennte Liste, damit mehrere Frontends
// (z.B. altes Portal auf 5173 und ein neues auf 5174) dieselbe API nutzen
// koennen, ohne den API-Vertrag zu aendern.
// Hinweis: Fuer den produktiven Server-Deploy muss CORS_ORIGIN in .env
// auf die tatsaechlichen Frontend-Domains gesetzt werden.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests ohne Origin (z.B. curl, server-to-server) zulassen.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin nicht erlaubt: ${origin}`));
    },
    // Erforderlich, damit der Browser das httpOnly-Auth-Cookie bei
    // Cross-Origin-Requests (Frontend :5173/:5174 -> Backend :4000) mitsendet.
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Statische Auslieferung der hochgeladenen Fotos/Dokumente
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/dealers', dealerRoutes);
// Globales, moderates Rate-Limit fuer alle /api/admin/*-Routen (Login + Vehicles + Users),
// zusaetzlich zum strikteren Login-spezifischen Limit in adminAuthRoutes.
app.use('/api/admin', adminRateLimiter);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/vehicles', adminVehicleRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/sync', adminSyncRoutes);
app.use('/api/admin/dealers', adminDealerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend laeuft auf http://localhost:${PORT}`);
  startMobileDeScheduler();
});
