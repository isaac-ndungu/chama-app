import { Router } from 'express';
import {
  recordContribution, verifyContribution, disputeContribution,
  listContributions, getPendingVerifications
} from '../controllers/contributionController.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get('/', listContributions);
router.get('/pending', requireRole('chairman', 'treasurer'), getPendingVerifications);
router.post('/', requireRole('chairman', 'treasurer'), recordContribution);
router.patch('/:contributionId/verify', requireRole('chairman', 'treasurer'), verifyContribution);
router.patch('/:contributionId/dispute', requireRole('chairman', 'treasurer'), disputeContribution);

export default router;