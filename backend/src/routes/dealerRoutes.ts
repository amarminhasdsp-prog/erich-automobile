import { Router } from 'express';
import { listDealers } from '../controllers/dealerController';

const router = Router();
router.get('/', listDealers);

export default router;
