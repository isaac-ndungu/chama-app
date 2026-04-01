import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();



export const signAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }   // '15m'
    );
};

export const signRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY }  // '7d'
    );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Sends the refresh token as an httpOnly cookie
export const attachRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    // For cross-site auth flows (localhost:5173 -> localhost:5000 in dev, Vercel -> Railway/Vercel in prod)
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days
  });
};