import { Router } from 'express';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  changeOwnPassword,
} from '../controllers/adminUserController';
import { requireAdminAuth, requireRole } from '../middleware/adminAuth';

// Admin-User-Verwaltung: alle Routen erfordern ein gueltiges Login
// (requireAdminAuth). Die eigentliche Verwaltung (Liste/Anlegen/Aendern/
// Loeschen fremder Accounts) ist zusaetzlich auf die Rolle ADMIN beschraenkt.
// Die Passwort-Selbstaenderung (/me/password) ist fuer jede eingeloggte
// Rolle (ADMIN und EDITOR) erlaubt.
const router = Router();
router.use(requireAdminAuth);

router.put('/me/password', changeOwnPassword);

router.get('/', requireRole('ADMIN'), listAdminUsers);
router.post('/', requireRole('ADMIN'), createAdminUser);
router.put('/:id', requireRole('ADMIN'), updateAdminUser);
router.delete('/:id', requireRole('ADMIN'), deleteAdminUser);

export default router;
