import Chama from '../models/Chama.js';
import Membership from '../models/Membership.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { createAuditLog } from '../services/auditService.js';

export const createChama = catchAsync(async (req, res, next) => {
    const { name, description, contributionAmount, meetingFrequency, defaultLoanInterestRate } = req.body;

    const chama = await Chama.create({
        name,
        description,
        contributionAmount,
        meetingFrequency,
        defaultLoanInterestRate,
        createdBy: req.user._id
    });

    // Creator automatically becomes chairman
    await Membership.create({
        chamaId: chama._id,
        userId: req.user._id,
        role: 'chairman',
        status: 'active',
        rotationPosition: 1
    });

    await createAuditLog({
        chamaId: chama._id,
        actorId: req.user._id,
        action: 'CHAMA_CREATED',
        targetCollection: 'chamas',
        targetId: chama._id,
        before: null,
        after: chama.toObject(),
        ipAddress: req.ip
    });

    res.status(201).json({ chama });
});

// Get all chamas the authenticated user is an active member of
export const getMyChamas = catchAsync(async (req, res) => {
    const memberships = await Membership.find({
        userId: req.user._id,
        status: 'active'
    }).populate('chamaId');

    const chamas = memberships.map(m => ({
        ...m.chamaId.toObject(),
        myRole: m.role,
        membershipId: m._id
    }));

    res.json({ chamas });
});

export const getChamaById = catchAsync(async (req, res, next) => {
    const chama = await Chama.findById(req.params.chamaId);
    if (!chama) return next(new AppError('Chama not found', 404));

    const memberCount = await Membership.countDocuments({
        chamaId: chama._id,
        status: 'active'
    });

    res.json({ chama, memberCount, myRole: req.membership.role });
});
