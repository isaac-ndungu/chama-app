import Chama from '../models/Chama.js';
import Cycle from '../models/Cycle.js';
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

    // Creator automatically becomes chairperson
    await Membership.create({
        chamaId: chama._id,
        userId: req.user._id,
        role: 'chairperson',
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

    const userRole = req.membership.role === 'chairperson' ? 'chairperson' : req.membership.role;
    res.json({ chama, memberCount, myRole: userRole });
});

export const updateChama = catchAsync(async (req, res, next) => {
    const { name, description, contributionAmount, meetingFrequency, defaultLoanInterestRate } = req.body;
    const { chamaId } = req.params;

    const chama = await Chama.findById(chamaId);
    if (!chama) return next(new AppError('Chama not found', 404));

    // Store before state for audit
    const before = chama.toObject();

    // Update allowed fields
    if (name !== undefined) chama.name = name;
    if (description !== undefined) chama.description = description;
    if (contributionAmount !== undefined) chama.contributionAmount = contributionAmount;
    if (meetingFrequency !== undefined) chama.meetingFrequency = meetingFrequency;
    if (defaultLoanInterestRate !== undefined) chama.defaultLoanInterestRate = defaultLoanInterestRate;

    await chama.save();

    // Log the change
    await createAuditLog({
        chamaId: chama._id,
        actorId: req.user._id,
        action: 'CHAMA_SETTINGS_UPDATED',
        targetCollection: 'chamas',
        targetId: chama._id,
        before,
        after: chama.toObject(),
        ipAddress: req.ip
    });

    res.json({ chama });
});

export const closeCycle = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
    const activeCycle = await Cycle.findOne({ chamaId, status: 'active' });
    if (!activeCycle) return next(new AppError('No active cycle found', 404));

    activeCycle.status = 'closed';
    await activeCycle.save();

    await createAuditLog({
        chamaId,
        actorId: req.user._id,
        action: 'CYCLE_CLOSED',
        targetCollection: 'cycles',
        targetId: activeCycle._id,
        before: { status: 'active' },
        after: { status: 'closed' },
        ipAddress: req.ip
    });

    res.json({ cycle: activeCycle });
});

export const startCycle = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
    const chama = await Chama.findById(chamaId);
    if (!chama) return next(new AppError('Chama not found', 404));

    const activeCycle = await Cycle.findOne({ chamaId, status: 'active' });
    if (activeCycle) return next(new AppError('There is already an active cycle', 400));

    const lastCycle = await Cycle.findOne({ chamaId }).sort({ cycleNumber: -1 });
    const nextCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    const newCycle = await Cycle.create({
        chamaId,
        cycleNumber: nextCycleNumber,
        startDate,
        endDate,
        status: 'active',
        expectedAmount: chama.contributionAmount * (await Membership.countDocuments({ chamaId, status: 'active' }))
    });

    await createAuditLog({
        chamaId,
        actorId: req.user._id,
        action: 'CYCLE_CREATED',
        targetCollection: 'cycles',
        targetId: newCycle._id,
        before: null,
        after: newCycle.toObject(),
        ipAddress: req.ip
    });

    res.status(201).json({ cycle: newCycle });
});
