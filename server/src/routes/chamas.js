import { Router } from 'express';
import { createChama, getMyChamas, getChamaById } from '../controllers/chamaController.js';
import { protect } from '../middleware/auth.js';
import { requireChamaMember } from '../middleware/requireChamaMember.js';


const router = Router();

// All chama routes require authentication
router.use(protect);

router.post('/', createChama);
router.get('/mine', getMyChamas);

// All routes below require chama membership (chamaId in params)
router.get('/:chamaId', requireChamaMember, getChamaById);

export default router;