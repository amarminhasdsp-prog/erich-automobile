import rateLimit from 'express-rate-limit';

// Striktes Limit fuer den Login-Endpunkt: Brute-Force auf das Master-Passwort
// verhindern. 5 Versuche pro 15 Minuten pro IP, danach 429 statt weiterer Pruefung.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Loginversuche. Bitte spaeter erneut versuchen.' },
  // Nur fehlgeschlagene Versuche zaehlen waere komfortabler, birgt aber das Risiko,
  // dass ein Angreifer durch gezieltes Ausloesen von 400ern (falsches Body-Format)
  // das Limit umgeht. Daher zaehlen alle Requests gegen den Login-Endpunkt.
});

// Moderateres, globales Limit fuer alle /api/admin/*-Routen (Schutz gegen
// automatisiertes Abklappern des Admin-Bereichs, unabhaengig vom Login).
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte spaeter erneut versuchen.' },
});
