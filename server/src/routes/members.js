import { Router } from 'express';
import { inviteMember, listMembers, changeRole } from '../controllers/memberController.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get('/', listMembers);
router.post('/', requireRole('chairperson'), inviteMember);
router.patch('/:memberId/role', requireRole('chairperson'), changeRole); 

export default router;