import { Router } from 'express';
import { runMobileDeSyncNow, getMobileDeSyncStatus } from '../controllers/syncController';
import { requireAdminAuth } from '../middleware/adminAuth';

// Admin-Routen fuer den mobile.de-Sync. Beide Endpunkte liegen hinter der
// bestehenden Admin-Authentifizierung (requireAdminAuth) - sie loesen
// interne Sync-Logik aus bzw. legen Betriebsdetails offen und sind daher
// bewusst NICHT oeffentlich (siehe Recherche-Report Abschnitt 11.2).
const router = Router();
router.use(requireAdminAuth);

router.post('/mobile-de/run', runMobileDeSyncNow);
router.get('/mobile-de/status', getMobileDeSyncStatus);

export default router;
