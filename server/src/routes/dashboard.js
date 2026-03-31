import { Router } from 'express';
import catchAsync from '../utils/catchAsync.js';
import Cycle from '../models/Cycle.js';
import Contribution from '../models/Contribution.js';
import Loan from '../models/Loan.js';
import Membership from '../models/Membership.js';
import MemberLedger from '../models/MemberLedger.js';
import { differenceInDays } from 'date-fns';
import Chama from '../models/Chama.js';

const router = Router({ mergeParams: true });

router.get('/', catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const { role } = req.membership;
    const userId = req.user._id;

    const activeCycle = await Cycle.findOne({ chamaId, status: 'active' })
        .populate('potRecipientId', 'name');

    const [members, activeLoans] = await Promise.all([
        Membership.find({ chamaId, status: 'active' }).populate('userId', 'name'),
        Loan.find({ chamaId, status: 'active' })
    ]);

    let cycleData = null;
    if (activeCycle) {
        const verifiedContribs = await Contribution.find({
            chamaId,
            cycleId: activeCycle._id,
            status: 'verified'
        });
        const totalCollected = verifiedContribs.reduce((s, c) => s + c.amount, 0);

        const chama = await Chama.findById(chamaId);
        const totalExpected = activeCycle.expectedAmount || (members.length * chama.contributionAmount);
        
        // Get current position from pot recipient
        let currentPosition = 0;
        if (activeCycle.potRecipientId) {
            const potRecipientMembership = await Membership.findOne({
                chamaId,
                userId: activeCycle.potRecipientId
            });
            currentPosition = potRecipientMembership?.rotationPosition || 0;
        }

        cycleData = {
            cycleNumber: activeCycle.cycleNumber,
            potRecipient: activeCycle.potRecipientId,
            currentPosition,
            totalCollected,
            totalExpected: activeCycle.expectedAmount,
            collectionRate: activeCycle.expectedAmount
                ? Math.round((totalCollected / activeCycle.expectedAmount) * 100)
                : 0,
            daysRemaining: differenceInDays(activeCycle.endDate, new Date())
        };
    }

    const base = { cycle: cycleData };

    if (role !== 'member') {
        const pendingVerifications = await Contribution.countDocuments({
            chamaId, status: 'pending_verification'
        });
        const ledgers = await MemberLedger.find({ chamaId });
        const membersInArrears = ledgers.filter(l => l.balance > 0).length;
        const overdueLoans = activeLoans.filter(l => l.dueDate < new Date()).length;
        const totalOutstandingLoans = activeLoans.reduce((s, l) => s + (l.totalDue - l.totalRepaid), 0);

        Object.assign(base, {
            pendingVerifications,
            membersInArrears,
            overdueLoans,
            totalOutstandingLoans,
            totalMembers: members.length
        });
    } else {
        const myLedger = await MemberLedger.findOne({ chamaId, memberId: userId });
        const myLoan = activeLoans.find(l => l.borrowerId.toString() === userId.toString());
        Object.assign(base, { myLedger, myActiveLoan: myLoan || null });
    }

    res.json(base);
}));

export default router;
