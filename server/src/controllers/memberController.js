import Membership from '../models/Membership.js';
import User from '../models/User.js';
import MemberLedger from '../models/MemberLedger.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { createAuditLog } from '../services/auditService.js';

// Invite an existing user by email
export const inviteMember = catchAsync(async (req, res, next) => {
    const { email, role = 'member' } = req.body;
    const { chamaId } = req.params;

    if (!['treasurer', 'member'].includes(role)) {
        return next(new AppError('You can only invite as treasurer or member', 400));
    }

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) return next(new AppError('No user found with that email. They must register first.', 404));

    const existing = await Membership.findOne({ chamaId, userId: invitee._id });
    if (existing) return next(new AppError('This user is already a member of this chama', 409));

    // Get current member count to assign rotation position
    const memberCount = await Membership.countDocuments({ chamaId, status: 'active' });
    const membership = await Membership.create({
        chamaId,
        userId: invitee._id,
        role,
        invitedBy: req.user._id,
        rotationPosition: memberCount + 1
    });

    // Create a blank ledger entry for the new member
    await MemberLedger.create({ chamaId, memberId: invitee._id });

    await createAuditLog({
        chamaId,
        actorId: req.user._id,
        action: 'MEMBER_INVITED',
        targetCollection: 'memberships',
        targetId: membership._id,
        before: null,
        after: { userId: invitee._id, role, email: invitee.email },
        ipAddress: req.ip
    });

    res.status(201).json({
        message: `${invitee.name} added as ${role}`,
        membership: { ...membership.toObject(), user: { name: invitee.name, email: invitee.email } }
    });
});

export const listMembers = catchAsync(async (req, res) => {
    const members = await Membership.find({
        chamaId: req.params.chamaId,
        status: 'active'
    })
        .populate('userId', 'name email phone')
        .sort({ rotationPosition: 1 });

    res.json({ members });
});

export const changeRole = catchAsync(async (req, res, next) => {
    const { memberId } = req.params;
    const { role } = req.body;

    if (!['treasurer', 'member'].includes(role)) {
        return next(new AppError('Can only assign treasurer or member role. Chairman is assigned at chama creation.', 400));
    }

    const membership = await Membership.findOne({
        _id: memberId,
        chamaId: req.params.chamaId
    });
    if (!membership) return next(new AppError('Membership not found', 404));
    if (membership.role === 'chairman') {
        return next(new AppError('Cannot change the chairman\'s role', 403));
    }

    const before = membership.toObject();
    membership.role = role;
    await membership.save();

    await createAuditLog({
        chamaId: req.params.chamaId,
        actorId: req.user._id,
        action: 'MEMBER_ROLE_CHANGED',
        targetCollection: 'memberships',
        targetId: membership._id,
        before,
        after: membership.toObject(),
        ipAddress: req.ip
    });

    res.json({ membership });
});
