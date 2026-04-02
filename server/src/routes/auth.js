import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import catchAsync from '../utils/catchAsync.js';
import { signAccessToken, signRefreshToken, attachRefreshTokenCookie } from '../utils/jwt.js';
import passport from 'passport';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google`
  }),
  async (req, res) => {
    const user = req.user;

    const accessToken  = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store refresh token same as normal login flow
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save({ validateBeforeSave: false });

    attachRefreshTokenCookie(res, refreshToken);

    const clientURL = process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL_PRODUCTION
      : process.env.CLIENT_URL;

    res.redirect(`${clientURL}/auth/callback?token=${accessToken}`);
  }
);

router.get('/me', protect, catchAsync(async (req, res) => {
  res.json({
    user: {
      id:    req.user._id,
      name:  req.user.name,
      email: req.user.email,
      phone: req.user.phone,
    }
  });
}));

export default router;