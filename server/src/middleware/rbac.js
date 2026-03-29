import AppError from '../utils/AppError.js';

// requireRole('chairman', 'treasurer') 
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.membership) {
            return next(new AppError('Membership context missing — run requireChamaMember first', 500));
        }
        if (!allowedRoles.includes(req.membership.role)) {
            return next(new AppError(
                `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
                403
            ));
        }
        next();
    };
};
