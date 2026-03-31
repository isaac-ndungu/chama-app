import { Router } from 'express';
import {
  recordContribution, verifyContribution, disputeContribution,
  listContributions, getPendingVerifications
} from '../controllers/contributionController.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get('/', listContributions);
router.get('/pending', requireRole('chairperson', 'treasurer'), getPendingVerifications);
router.post('/', requireRole('chairperson', 'treasurer'), recordContribution);
router.patch('/:contributionId/verify', requireRole('chairperson', 'treasurer'), verifyContribution);
router.patch('/:contributionId/dispute', requireRole('chairperson', 'treasurer'), disputeContribution);

export default router;