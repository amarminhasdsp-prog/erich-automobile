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

const router = Router();

router.get('/', listVehicles);
router.get('/:id', getVehicle);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

// Fotos (mehrere gleichzeitig, max 20 pro Request)
router.post('/:vehicleId/photos', uploadPhoto.array('photos', 20), verifyPhotoMagicBytes, uploadPhotos);
router.patch('/:vehicleId/photos/:photoId/main', setMainPhoto);
router.delete('/:vehicleId/photos/:photoId', deletePhoto);

// Dokumente (ein Dokument pro Request)
router.post(
  '/:vehicleId/documents',
  uploadDocumentMiddleware.single('document'),
  verifyDocumentMagicBytes,
  uploadDocument
);
router.delete('/:vehicleId/documents/:documentId', deleteDocument);

export default router;
