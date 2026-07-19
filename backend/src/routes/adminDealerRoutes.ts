import { Router } from 'express';
import { uploadDealerLogo, deleteDealerLogo } from '../controllers/dealerController';
import { uploadLogo, verifyLogoMagicBytes } from '../middleware/upload';
import { requireAdminAuth } from '../middleware/adminAuth';

// Admin-Routen fuer die Haendler-Verwaltung (aktuell nur Logo-Upload).
const router = Router();
router.use(requireAdminAuth);

router.post('/:id/logo', uploadLogo.single('logo'), verifyLogoMagicBytes, uploadDealerLogo);
router.delete('/:id/logo', deleteDealerLogo);

export default router;
