import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, attachRefreshTokenCookie } from '../utils/jwt.js';

export const register = catchAsync(async (req, res, next) => {
    const { name, email, phone, password } = req.body;

    // Check duplicate email before attempting to create
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return next(new AppError('An account with this email already exists', 409));

    const user = await User.create({ name, email, phone, password });

    // Issue tokens 
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store refresh token hash server-side 
    user.refreshTokens = [refreshToken];
    await user.save({ validateBeforeSave: false });

    attachRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
        accessToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone
        }
    });
});


export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError('Email and password required', 400));

    // Explicitly select password — it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Invalid email or password', 401));   // same message — no enumeration
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Append new refresh token
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save({ validateBeforeSave: false });

    attachRefreshTokenCookie(res, refreshToken);

    res.json({
        accessToken,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
});

export const refresh = catchAsync(async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    if (!token) return next(new AppError('No refresh token', 401));

    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch {
        return next(new AppError('Invalid or expired refresh token', 401));
    }

    // Find user only if refresh token is valid and present in DB (prevent race/VersionError)
    const user = await User.findOne({ _id: decoded.id, refreshTokens: token }).select('+refreshTokens');

    if (!user) {
        const staleUser = await User.findById(decoded.id).select('+refreshTokens');
        if (staleUser) {
            await User.updateOne({ _id: staleUser._id }, { $set: { refreshTokens: [] } });
        }
        return next(new AppError('Invalid or expired refresh token', 401));
    }

    const newRefreshToken = signRefreshToken(user._id);

    const remainingTokens = user.refreshTokens.filter(t => t !== token);
    const updatedTokens = [...remainingTokens, newRefreshToken].slice(-4);

    await User.updateOne(
        { _id: user._id, refreshTokens: token },
        { $set: { refreshTokens: updatedTokens } }
    );

    attachRefreshTokenCookie(res, newRefreshToken);

    res.json({ accessToken: signAccessToken(user._id) });
});

export const logout = catchAsync(async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    if (token) {
        const user = await User.findById(req.user.id).select('+refreshTokens');
        if (user) {
            user.refreshTokens = user.refreshTokens.filter(t => t !== token);
            await user.save({ validateBeforeSave: false });
        }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
});
