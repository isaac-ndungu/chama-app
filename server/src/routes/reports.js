import { Router } from 'express';
import { generateMemberStatement } from '../controllers/reportController.js';
import { requireChamaMember } from '../middleware/requireChamaMember.js';

const router = Router({ mergeParams: true });
router.get('/member/:memberId', generateMemberStatement);
export default router;