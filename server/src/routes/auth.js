import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

router.get('/me', protect, catchAsync(async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone
        }
    });
}));

export default router;