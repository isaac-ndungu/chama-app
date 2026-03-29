import Contribution from '../models/Contribution.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { createAuditLog } from '../services/auditService.js';
import { recalculateMemberLedger } from '../services/ledgerService.js';

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

    const contribution = await Contribution.findOne({ _id: contributionId, chamaId });
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

    // Update ledger synchronously — ledger must stay in sync with verified contributions
    await recalculateMemberLedger(chamaId, contribution.memberId);

    await createAuditLog({
        chamaId,
        actorId: verifierId,
        action: 'CONTRIBUTION_VERIFIED',
        targetCollection: 'contributions',
        targetId: contribution._id,
        before,
        after: contribution.toObject(),
        ipAddress: req.ip
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

    await createAuditLog({
        chamaId, actorId: req.user._id, action: 'CONTRIBUTION_DISPUTED',
        targetCollection: 'contributions', targetId: contribution._id,
        before, after: contribution.toObject(), ipAddress: req.ip
    });

    res.json({ contribution });
});

export const listContributions = catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const { cycleId, status, memberId } = req.query;

    const query = { chamaId };
    if (cycleId) query.cycleId = cycleId;
    if (status) query.status = status;

    // Members can only see their own contributions
    if (req.membership.role === 'member') {
        query.memberId = req.user._id;
    } else if (memberId) {
        query.memberId = memberId;
    }

    const contributions = await Contribution.find(query)
        .populate('memberId', 'name')
        .populate('recordedBy', 'name')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 });

    res.json({ contributions });
});

export const getPendingVerifications = catchAsync(async (req, res) => {
    const contributions = await Contribution.find({
        chamaId: req.params.chamaId,
        status: 'pending_verification'
    })
        .populate('memberId', 'name')
        .populate('recordedBy', 'name')
        .sort({ createdAt: 1 });   // oldest first — process in order

    res.json({ contributions, count: contributions.length });
});
