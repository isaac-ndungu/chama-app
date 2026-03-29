import { Router } from 'express';
import { createChama, getMyChamas, getChamaById } from '../controllers/chamaController.js';
import { protect } from '../middleware/auth.js';
import { requireChamaMember } from '../middleware/requireChamaMember.js';
import memberRoutes from './members.js';
import contributionRoutes from './contributions.js';
import loanRoutes from './loans.js';
import auditRoutes from './audit.js';
import dashboardRoutes from './dashboard.js';

const router = Router();

// All chama routes require authentication
router.use(protect);

router.post('/', createChama);
router.get('/mine', getMyChamas);

// All routes below require chama membership (chamaId in params)
router.get('/:chamaId', requireChamaMember, getChamaById);

router.use('/:chamaId/members', requireChamaMember, memberRoutes);
router.use('/:chamaId/contributions', requireChamaMember, contributionRoutes);
router.use('/:chamaId/loans', requireChamaMember, loanRoutes);
router.use('/:chamaId/audit', requireChamaMember, auditRoutes);
router.use('/:chamaId/dashboard', requireChamaMember, dashboardRoutes);

export default router;