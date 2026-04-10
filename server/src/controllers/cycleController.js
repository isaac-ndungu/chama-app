import Cycle from '../models/Cycle.js';
import Chama from '../models/Chama.js';
import Membership from '../models/Membership.js';
import Contribution from '../models/Contribution.js';
import MemberLedger from '../models/MemberLedger.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { createAuditLog } from '../services/auditService.js';


// create the next round automatically 
async function createRound({ chamaId, afterCycle, actorId, ipAddress, startDate, endDate }) {
    const chama = await Chama.findById(chamaId);
    if (!chama) throw new Error('Chama not found');

    const activeMemberships = await Membership.find({ chamaId, status: 'active' })
        .populate('userId', 'name')
        .sort({ rotationPosition: 1 });

    if (activeMemberships.length === 0) throw new Error('No active members');

    const memberCount = activeMemberships.length;
    const nextRoundNum = afterCycle.cycleNumber + 1;


    const nextPosition = afterCycle.potRecipientPosition < memberCount
        ? afterCycle.potRecipientPosition + 1
        : 1; // start of new rotation

    const recipientMembership = activeMemberships.find(
        m => m.rotationPosition === nextPosition
    );

    if (!recipientMembership) {
        throw new Error(`No member found at rotation position ${nextPosition}`);
    }

    const now = startDate ? new Date(startDate) : new Date();
    const thirtyDaysOut = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newCycle = await Cycle.create({
        chamaId,
        cycleNumber: nextRoundNum,
        potRecipientId: recipientMembership.userId._id,
        potRecipientPosition: recipientMembership.rotationPosition,
        startDate: now,
        endDate: thirtyDaysOut,
        expectedAmount: memberCount * chama.contributionAmount,
        actualAmount: 0,
        status: 'active',
    });

    await createAuditLog({
        chamaId,
        actorId,
        action: 'CYCLE_CREATED',
        targetCollection: 'cycles',
        targetId: newCycle._id,
        before: null,
        after: newCycle.toObject(),
        ipAddress,
    });

    return Cycle.findById(newCycle._id).populate('potRecipientId', 'name email phone');
}

//  GET current active round 
export const getCurrentCycle = catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const cycle = await Cycle.findOne({
        chamaId,
        status: { $in: ['active', 'collection', 'disbursed'] },
    }).populate('potRecipientId', 'name email phone');

    res.json({ cycle: cycle || null });
});

//  GET all rounds (full history) 
export const getCycleHistory = catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const cycles = await Cycle.find({ chamaId })
        .populate('potRecipientId', 'name')
        .sort({ cycleNumber: 1 });

    // Attach rotation metadata 
    const memberCount = await Membership.countDocuments({ chamaId, status: 'active' });

    const annotated = cycles.map(c => ({
        ...c.toObject(),
        rotationNumber: memberCount > 0 ? Math.ceil(c.cycleNumber / memberCount) : 1,
        positionInRotation: memberCount > 0
            ? ((c.cycleNumber - 1) % memberCount) + 1
            : c.cycleNumber,
        totalMembersInRotation: memberCount,
    }));

    res.json({ cycles: annotated, memberCount });
});

//  CREATE first round 
export const createNextCycle = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
    const { startDate, endDate } = req.body;

    // Block if an active round already exists
    const activeCycle = await Cycle.findOne({
        chamaId,
        status: { $in: ['active', 'collection', 'disbursed'] },
    });
    if (activeCycle) {
        return next(new AppError(
            'A round is already active. It must be closed before starting a new one.', 409
        ));
    }

    const chama = await Chama.findById(chamaId);
    if (!chama) return next(new AppError('Chama not found', 404));

    const activeMemberships = await Membership.find({ chamaId, status: 'active' })
        .populate('userId', 'name')
        .sort({ rotationPosition: 1 });

    if (activeMemberships.length === 0) {
        return next(new AppError('Add members before starting a rotation', 404));
    }

    const memberCount = activeMemberships.length;

    // Determine next round number and position
    const lastAny = await Cycle.findOne({ chamaId }).sort({ cycleNumber: -1 });
    const nextRoundNum = lastAny ? lastAny.cycleNumber + 1 : 1;

    // Position within the current rotation
    const nextPosition = lastAny
        ? (lastAny.potRecipientPosition < memberCount
            ? lastAny.potRecipientPosition + 1
            : 1)
        : 1;

    const recipientMembership = activeMemberships.find(
        m => m.rotationPosition === nextPosition
    ) || activeMemberships[0];

    const now = startDate ? new Date(startDate) : new Date();
    const thirtyDaysOut = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const cycle = await Cycle.create({
        chamaId,
        cycleNumber: nextRoundNum,
        potRecipientId: recipientMembership.userId._id,
        potRecipientPosition: recipientMembership.rotationPosition,
        startDate: now,
        endDate: thirtyDaysOut,
        expectedAmount: memberCount * chama.contributionAmount,
        actualAmount: 0,
        status: 'active',
    });

    await createAuditLog({
        chamaId,
        actorId: req.user._id,
        action: 'CYCLE_CREATED',
        targetCollection: 'cycles',
        targetId: cycle._id,
        before: null,
        after: cycle.toObject(),
        ipAddress: req.ip,
    });

    const populated = await Cycle.findById(cycle._id)
        .populate('potRecipientId', 'name email phone');

    res.status(201).json({ cycle: populated });
});

//  RECORD POT DISBURSEMENT (officers) 
export const recordDisbursement = catchAsync(async (req, res, next) => {
    const { chamaId, cycleId } = req.params;
    const { disbursementRef, disbursedAmount } = req.body;

    if (!disbursementRef?.trim()) {
        return next(new AppError('M-Pesa reference is required', 400));
    }

    const cycle = await Cycle.findOne({ _id: cycleId, chamaId });
    if (!cycle) return next(new AppError('Round not found', 404));

    if (!['active', 'collection'].includes(cycle.status)) {
        return next(new AppError(`Cannot disburse — round status is: ${cycle.status}`, 400));
    }

    // Authoritative verified total from contributions
    const agg = await Contribution.aggregate([
        { $match: { chamaId: cycle.chamaId, cycleId: cycle._id, status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const verifiedTotal = agg[0]?.total || 0;

    const before = cycle.toObject();
    cycle.status = 'disbursed';
    cycle.disbursementRef = disbursementRef.trim().toUpperCase();
    cycle.disbursedAt = new Date();
    cycle.disbursedAmount = disbursedAmount || verifiedTotal;
    cycle.actualAmount = verifiedTotal; // keep verified total accurate
    await cycle.save();

    // Credit recipient's MemberLedger
    if (cycle.potRecipientId) {
        await MemberLedger.findOneAndUpdate(
            { chamaId, memberId: cycle.potRecipientId },
            { $inc: { potReceived: cycle.disbursedAmount } },
            { upsert: true }
        );
    }

    await createAuditLog({
        chamaId,
        actorId: req.user._id,
        action: 'POT_DISBURSED',
        targetCollection: 'cycles',
        targetId: cycle._id,
        before,
        after: cycle.toObject(),
        ipAddress: req.ip,
    });

    const populated = await Cycle.findById(cycle._id)
        .populate('potRecipientId', 'name email phone');

    res.json({ cycle: populated });
});

//  RECIPIENT CONFIRMS RECEIPT  auto-advances to the next round
export const confirmReceipt = catchAsync(async (req, res, next) => {
    const { chamaId, cycleId } = req.params;

    const cycle = await Cycle.findOne({ _id: cycleId, chamaId });
    if (!cycle) return next(new AppError('Round not found', 404));

    if (cycle.status !== 'disbursed') {
        return next(new AppError(
            'Pot has not been disbursed yet — officers must record disbursement first', 400
        ));
    }

    // Only the pot recipient can confirm
    if (cycle.potRecipientId.toString() !== req.user._id.toString()) {
        return next(new AppError('Only the pot recipient can confirm receipt', 403));
    }

    //  Close this round 
    const before = cycle.toObject();
    cycle.status = 'closed';
    cycle.recipientConfirmedAt = new Date();
    await cycle.save();

    await createAuditLog({
        chamaId,
        actorId: req.user._id,
        action: 'CYCLE_CLOSED',
        targetCollection: 'cycles',
        targetId: cycle._id,
        before,
        after: cycle.toObject(),
        ipAddress: req.ip,
    });

    //  Check rotation completion 
    const memberCount = await Membership.countDocuments({ chamaId, status: 'active' });

    // How many rounds have been closed in the current rotation?
    // Current rotation = Math.ceil(cycle.cycleNumber / memberCount)
    const currentRotationNumber = Math.ceil(cycle.cycleNumber / memberCount);
    const firstRoundInRotation = (currentRotationNumber - 1) * memberCount + 1;
    const lastRoundInRotation = currentRotationNumber * memberCount;

    const closedInThisRotation = await Cycle.countDocuments({
        chamaId,
        status: 'closed',
        cycleNumber: { $gte: firstRoundInRotation, $lte: lastRoundInRotation },
    });

    const rotationComplete = closedInThisRotation >= memberCount;

    //  Auto-advance if rotation is NOT complete 
    let nextCycle = null;
    if (!rotationComplete) {
        try {
            nextCycle = await createRound({
                chamaId,
                afterCycle: cycle,
                actorId: req.user._id, // logged as recipient — acceptable, auto action
                ipAddress: req.ip,
            });
        } catch (err) {
            // Log but don't fail the confirmation — the round IS closed correctly
            console.error('[confirmReceipt] Auto-advance failed:', err.message);
        }
    }

    // Build response 
    const closedCycle = await Cycle.findById(cycle._id)
        .populate('potRecipientId', 'name email phone');

    res.json({
        cycle: closedCycle,
        nextCycle: nextCycle,
        rotationComplete,
        rotationNumber: currentRotationNumber,
        message: rotationComplete
            ? `Rotation ${currentRotationNumber} complete! All ${memberCount} members have received the pot. Officers can start the next rotation when ready.`
            : `Receipt confirmed. Round ${nextCycle?.cycleNumber} has started automatically for ${nextCycle?.potRecipientId?.name}.`,
    });
});