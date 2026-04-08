import Cycle from '../models/Cycle.js';
import Chama from '../models/Chama.js';
import Membership from '../models/Membership.js';
import Contribution from '../models/Contribution.js';
import MemberLedger from '../models/MemberLedger.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { createAuditLog } from '../services/auditService.js';

//  GET current active cycle 
export const getCurrentCycle = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
    const cycle = await Cycle.findOne({
        chamaId,
        status: { $in: ['active', 'collection', 'disbursed'] },
    }).populate('potRecipientId', 'name email phone');

    res.json({ cycle: cycle || null });
});

//  creare first or next cycle 
export const createNextCycle = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
    const { startDate, endDate } = req.body;

    const chama = await Chama.findById(chamaId);
    if (!chama) return next(new AppError('Chama not found', 404));

    // Find the last closed cycle to determine next position
    const lastCycle = await Cycle.findOne({ chamaId, status: 'closed' })
        .sort({ cycleNumber: -1 });

    const nextCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1;
    const nextPosition = lastCycle ? lastCycle.potRecipientPosition + 1 : 1;

    // Check no active cycle already exists
    const activeCycle = await Cycle.findOne({
        chamaId,
        status: { $in: ['active', 'collection', 'disbursed'] },
    });
    if (activeCycle) {
        return next(new AppError('A cycle is already active. Close it before starting a new one.', 409));
    }

    // Find the member at nextPosition in the rotation
    const membership = await Membership.findOne({
        chamaId,
        rotationPosition: nextPosition,
        status: 'active',
    }).populate('userId', 'name');

    if (!membership) {
        // All positions have received,  rotation complete, start over
        const firstMembership = await Membership.findOne({
            chamaId,
            rotationPosition: 1,
            status: 'active',
        }).populate('userId', 'name');
        if (!firstMembership) return next(new AppError('No members found in rotation', 404));
    }

    const recipientMembership = membership || await Membership.findOne({
        chamaId,
        rotationPosition: 1,
        status: 'active',
    }).populate('userId', 'name');

    const activeMemberCount = await Membership.countDocuments({ chamaId, status: 'active' });

    const cycle = await Cycle.create({
        chamaId,
        cycleNumber: nextCycleNumber,
        potRecipientId: recipientMembership.userId._id,
        potRecipientPosition: recipientMembership.rotationPosition,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedAmount: activeMemberCount * chama.contributionAmount,
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

    const populated = await Cycle.findById(cycle._id).populate('potRecipientId', 'name email phone');
    res.status(201).json({ cycle: populated });
});

//  record pot disbursement (officers)
export const recordDisbursement = catchAsync(async (req, res, next) => {
    const { chamaId, cycleId } = req.params;
    const { disbursementRef, disbursedAmount } = req.body;

    if (!disbursementRef?.trim()) {
        return next(new AppError('M-Pesa reference is required for pot disbursement', 400));
    }

    const cycle = await Cycle.findOne({ _id: cycleId, chamaId });
    if (!cycle) return next(new AppError('Cycle not found', 404));

    if (cycle.status !== 'active' && cycle.status !== 'collection') {
        return next(new AppError(`Cannot disburse a cycle with status: ${cycle.status}`, 400));
    }

    // Calculate actual amount from verified contributions
    const contribAgg = await Contribution.aggregate([
        { $match: { chamaId: cycle.chamaId, cycleId: cycle._id, status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const actualCollected = contribAgg[0]?.total || 0;

    const before = cycle.toObject();
    cycle.status = 'disbursed';
    cycle.disbursementRef = disbursementRef.trim().toUpperCase();
    cycle.disbursedAt = new Date();
    cycle.actualAmount = disbursedAmount || actualCollected;
    await cycle.save();

    // Update recipient's MemberLedger potReceived field
    await MemberLedger.findOneAndUpdate(
        { chamaId, memberId: cycle.potRecipientId },
        { $inc: { potReceived: cycle.actualAmount } },
        { upsert: true }
    );

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

    const populated = await Cycle.findById(cycle._id).populate('potRecipientId', 'name email phone');
    res.json({ cycle: populated });
});

// Pot recipient confirmation

export const confirmReceipt = catchAsync(async (req, res, next) => {
    const { chamaId, cycleId } = req.params;

    const cycle = await Cycle.findOne({ _id: cycleId, chamaId });
    if (!cycle) return next(new AppError('Cycle not found', 404));

    if (cycle.status !== 'disbursed') {
        return next(new AppError('Pot has not been disbursed yet — officers must record disbursement first', 400));
    }

    // Only the recipient can confirm
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
        message: 'Receipt confirmed. Cycle is now closed.',
    });
});

// rotation history
export const getCycleHistory = catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const cycles = await Cycle.find({ chamaId })
        .populate('potRecipientId', 'name')
        .sort({ cycleNumber: 1 });

    res.json({ cycles });
});