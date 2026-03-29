import Membership from '../models/Membership.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

// Run AFTER protect — req.user must exist
export const requireChamaMember = catchAsync(async (req, res, next) => {
    const membership = await Membership.findOne({
        chamaId: req.params.chamaId,
        userId: req.user._id,
        status: 'active'
    });

    if (!membership) {
        return next(new AppError('You are not an active member of this chama', 403));
    }

    req.membership = membership;
    next();
});
