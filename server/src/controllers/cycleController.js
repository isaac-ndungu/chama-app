import Cycle from '../models/Cycle.js';
import Chama from '../models/Chama.js';
import Membership from '../models/Membership.js';
import Contribution from '../models/Contribution.js';
import MemberLedger from '../models/MemberLedger.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { createAuditLog } from '../services/auditService.js';

export const getCurrentCycle = catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const cycle = await Cycle.findOne({
        chamaId,
        status: { $in: ['active', 'collection', 'disbursed'] },
    }).populate('potRecipientId', 'name email phone');

    res.json({ cycle: cycle || null });
});

export const createNextCycle = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
    const { startDate, endDate } = req.body;

    const chama = await Chama.findById(chamaId);
    if (!chama) return next(new AppError('Chama not found', 404));

    // Prevent creating a cycle when one is already active
    const activeCycle = await Cycle.findOne({
        chamaId,
        status: { $in: ['active', 'collection', 'disbursed'] },
    });
    if (activeCycle) {
        return next(new AppError(
            'A cycle is already active. The current cycle must be closed before starting a new one.', 409
        ));
    }

    // Determine next cycle number and rotation position
    const lastClosed = await Cycle.findOne({ chamaId, status: 'closed' })
        .sort({ cycleNumber: -1 });

    const nextCycleNumber = lastClosed ? lastClosed.cycleNumber + 1 : 1;
    const nextPosition = lastClosed ? lastClosed.potRecipientPosition + 1 : 1;

    // Find the active member at nextPosition
    const activeMemberships = await Membership.find({ chamaId, status: 'active' })
        .populate('userId', 'name')
        .sort({ rotationPosition: 1 });

    if (activeMemberships.length === 0) {
        return next(new AppError('No active members found', 404));
    }

    // Wrap around if all positions have received (restart rotation)
    const maxPosition = Math.max(...activeMemberships.map(m => m.rotationPosition));
    const effectivePos = nextPosition > maxPosition ? 1 : nextPosition;

    const recipientMembership = activeMemberships.find(
        m => m.rotationPosition === effectivePos
    ) || activeMemberships[0];

    const expectedAmount = activeMemberships.length * chama.contributionAmount;

    const cycle = await Cycle.create({
        chamaId,
        cycleNumber: nextCycleNumber,
        potRecipientId: recipientMembership.userId._id,
        potRecipientPosition: recipientMembership.rotationPosition,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedAmount,
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

export const recordDisbursement = catchAsync(async (req, res, next) => {
    const { chamaId, cycleId } = req.params;
    const { disbursementRef, disbursedAmount } = req.body;

    if (!disbursementRef?.trim()) {
        return next(new AppError('M-Pesa reference is required for pot disbursement', 400));
    }

    const cycle = await Cycle.findOne({ _id: cycleId, chamaId });
    if (!cycle) return next(new AppError('Cycle not found', 404));

    if (!['active', 'collection'].includes(cycle.status)) {
        return next(new AppError(`Cannot disburse — cycle status is: ${cycle.status}`, 400));
    }

    // Use provided amount or re-aggregate from verified contributions
    let finalAmount = disbursedAmount;
    if (!finalAmount) {
        const agg = await Contribution.aggregate([
            { $match: { chamaId: cycle.chamaId, cycleId: cycle._id, status: 'verified' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        finalAmount = agg[0]?.total || 0;
    }

    const before = cycle.toObject();
    cycle.status = 'disbursed';
    cycle.disbursementRef = disbursementRef.trim().toUpperCase();
    cycle.disbursedAt = new Date();
    cycle.disbursedAmount = finalAmount;
    
    await cycle.save();

    // Update recipient's MemberLedger potReceived
    if (cycle.potRecipientId) {
        await MemberLedger.findOneAndUpdate(
            { chamaId, memberId: cycle.potRecipientId },
            { $inc: { potReceived: finalAmount } },
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

export const confirmReceipt = catchAsync(async (req, res, next) => {
    const { chamaId, cycleId } = req.params;

    const cycle = await Cycle.findOne({ _id: cycleId, chamaId });
    if (!cycle) return next(new AppError('Cycle not found', 404));

    if (cycle.status !== 'disbursed') {
        return next(new AppError(
            'Pot has not been disbursed yet — officers must record disbursement first', 400
        ));
    }

    // only the pot recipient can confirm
    if (cycle.potRecipientId.toString() !== req.user._id.toString()) {
        return next(new AppError('Only the pot recipient can confirm receipt', 403));
    }

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

    res.json({
        cycle: await Cycle.findById(cycle._id).populate('potRecipientId', 'name email phone'),
        message: 'Receipt confirmed. This cycle is now closed.',
    });
});

export const getCycleHistory = catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const cycles = await Cycle.find({ chamaId })
        .populate('potRecipientId', 'name')
        .sort({ cycleNumber: 1 });

    res.json({ cycles });
});