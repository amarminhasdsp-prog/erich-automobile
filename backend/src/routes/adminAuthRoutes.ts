import { Router } from 'express';
import { adminLogin, adminLogout } from '../controllers/authController';
import { loginRateLimiter } from '../middleware/rateLimit';

const router = Router();
router.post('/login', loginRateLimiter, adminLogin);
router.post('/logout', adminLogout);

export default router;
