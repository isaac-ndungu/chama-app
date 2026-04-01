import { Router } from 'express';
import { applyForLoan, voteOnLoan, recordRepayment, listLoans } from '../controllers/loanController.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get('/', listLoans);
router.post('/', requireRole('chairperson', 'treasurer', 'member'), applyForLoan);
router.post('/:loanId/vote', voteOnLoan);                                          // all members
router.post('/:loanId/repayments', requireRole('chairperson', 'treasurer'), recordRepayment);

export default router;