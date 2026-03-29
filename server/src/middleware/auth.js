import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError('No access token provided', 401));
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Access token expired', 401));
        }
        return next(new AppError('Invalid access token', 401));
    }

    // Confirm user still exists 
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User no longer exists', 401));

    req.user = user;
    next();
});
