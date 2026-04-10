import Contribution from '../models/Contribution.js';
import Cycle from '../models/Cycle.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { createAuditLog } from '../services/auditService.js';
import { recalculateMemberLedger } from '../services/ledgerService.js';
import { broadcastToChama } from '../services/sseService.js';

export const recordContribution = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
    const { memberId, amount, mpesaRef, paymentDate, cycleId } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
        return next(new AppError('Amount must be a positive whole number in KES', 400));
    }

    const contribution = await Contribution.create({
        chamaId,
        memberId,
        cycleId,
        amount,
        mpesaRef: mpesaRef.trim().toUpperCase(),
        paymentDate: new Date(paymentDate),
        recordedBy: req.user._id,
        recordedAt: new Date(),
        status: 'pending_verification'
    });

    await createAuditLog({
        chamaId,
        actorId: req.user._id,
        action: 'CONTRIBUTION_RECORDED',
        targetCollection: 'contributions',
        targetId: contribution._id,
        before: null,
        after: contribution.toObject(),
        ipAddress: req.ip
    });

    res.status(201).json({ contribution });
});

export const verifyContribution = catchAsync(async (req, res, next) => {
    const { chamaId, contributionId } = req.params;
    const verifierId = req.user._id;

    const contribution = await Contribution.findOne({ _id: contributionId, chamaId })
        .populate('cycleId', 'cycleNumber');   // ← populate so audit detail has cycleNumber

    if (!contribution) return next(new AppError('Contribution not found', 404));
    if (contribution.status !== 'pending_verification') {
        return next(new AppError('Only pending contributions can be verified', 400));
    }
    if (contribution.recordedBy.toString() === verifierId.toString()) {
        return next(new AppError('You cannot verify a contribution you recorded', 403));
    }

    const before = contribution.toObject();
    contribution.verifiedBy = verifierId;
    contribution.verifiedAt = new Date();
    contribution.status = 'verified';
    await contribution.save();

    // ── CRITICAL: update cycle.actualAmount so CycleBanner progress fills correctly ──
    // Re-aggregate ALL verified contributions for this cycle (not just +amount, in case
    // of disputes/reversals) and write the authoritative total back to the cycle.
    if (contribution.cycleId) {
        const cycleId = contribution.cycleId._id || contribution.cycleId;

        const agg = await Contribution.aggregate([
            {
                $match: {
                    chamaId: contribution.chamaId,
                    cycleId,
                    status: 'verified',
                },
            },
            {
                $group: { _id: null, total: { $sum: '$amount' } },
            },
        ]);

        const newTotal = agg[0]?.total || 0;

        await Cycle.findByIdAndUpdate(cycleId, { actualAmount: newTotal });
    }

    broadcastToChama(chamaId, 'contribution_verified', {
        contributionId: contribution._id,
        memberName: req.user.name,
        amount: contribution.amount,
        verifiedAt: contribution.verifiedAt,
    });

    // Recalculate member ledger synchronously
    await recalculateMemberLedger(chamaId, contribution.memberId);

    await createAuditLog({
        chamaId,
        actorId: verifierId,
        action: 'CONTRIBUTION_VERIFIED',
        targetCollection: 'contributions',
        targetId: contribution._id,
        before,
        after: contribution.toObject(),
        ipAddress: req.ip,
    });

    res.json({ contribution });
});

export const disputeContribution = catchAsync(async (req, res, next) => {
    const { chamaId, contributionId } = req.params;
    const { note } = req.body;
    if (!note?.trim()) return next(new AppError('A dispute note is required', 400));

    const contribution = await Contribution.findOne({ _id: contributionId, chamaId });
    if (!contribution) return next(new AppError('Contribution not found', 404));

    const before = contribution.toObject();
    contribution.status = 'disputed';
    contribution.disputeNote = note.trim();
    await contribution.save();

    // ── If disputed contribution was previously verified, subtract from cycle total ──
    if (before.status === 'verified' && contribution.cycleId) {
        const agg = await Contribution.aggregate([
            {
                $match: {
                    chamaId: contribution.chamaId,
                    cycleId: contribution.cycleId,
                    status: 'verified',
                },
            },
            {
                $group: { _id: null, total: { $sum: '$amount' } },
            },
        ]);
        await Cycle.findByIdAndUpdate(contribution.cycleId, {
            actualAmount: agg[0]?.total || 0,
        });
    }

    await createAuditLog({
        chamaId, actorId: req.user._id, action: 'CONTRIBUTION_DISPUTED',
        targetCollection: 'contributions', targetId: contribution._id,
        before, after: contribution.toObject(), ipAddress: req.ip,
    });

    res.json({ contribution });
});

export const listContributions = catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const { cycleId, status, memberId } = req.query;

    const query = { chamaId };
    if (cycleId) query.cycleId = cycleId;
    if (memberId) query.memberId = memberId;

    // Members see all verified contributions (transparency) — officers see everything
    if (req.membership.role === 'member') {
        query.status = 'verified';
    } else if (status) {
        // Officers can filter by any status
        query.status = status;
    }

    const contributions = await Contribution.find(query)
        .populate('memberId', 'name rotationPosition')
        .populate('recordedBy', 'name')
        .populate('verifiedBy', 'name')
        .populate('cycleId', 'cycleNumber')
        .sort({ createdAt: -1 });

    res.json({ contributions });
});

export const getPendingVerifications = catchAsync(async (req, res) => {
    const contributions = await Contribution.find({
        chamaId: req.params.chamaId,
        status: 'pending_verification',
    })
        .populate('memberId', 'name rotationPosition')
        .populate('recordedBy', 'name')
        .sort({ createdAt: 1 });  // oldest first

    res.json({ contributions, count: contributions.length });
});