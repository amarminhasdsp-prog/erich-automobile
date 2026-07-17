import { Router } from 'express';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController';
import { uploadPhotos, setMainPhoto, deletePhoto } from '../controllers/photoController';
import { uploadDocument, deleteDocument } from '../controllers/documentController';
import { uploadPhoto, uploadDocument as uploadDocumentMiddleware, verifyPhotoMagicBytes, verifyDocumentMagicBytes } from '../middleware/upload';
import { requireAdminAuth } from '../middleware/adminAuth';

// Admin-Routen: identische Fahrzeugverwaltung wie die oeffentliche API, aber
// mit Bearer-Token-Pflicht (requireAdminAuth) und Sicht auf ENTWURF-Inserate.
const router = Router();
router.use(requireAdminAuth);

router.get('/', (req, res, next) => listVehicles(req, res, next, true));
router.get('/:id', (req, res, next) => getVehicle(req, res, next, true));
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

router.post('/:vehicleId/photos', uploadPhoto.array('photos', 20), verifyPhotoMagicBytes, uploadPhotos);
router.patch('/:vehicleId/photos/:photoId/main', setMainPhoto);
router.delete('/:vehicleId/photos/:photoId', deletePhoto);

router.post(
  '/:vehicleId/documents',
  uploadDocumentMiddleware.single('document'),
  verifyDocumentMagicBytes,
  uploadDocument
);
router.delete('/:vehicleId/documents/:documentId', deleteDocument);

export default router;
