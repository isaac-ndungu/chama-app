import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import catchAsync from '../utils/catchAsync.js';

const router = Router({ mergeParams: true });

router.get('/', catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const { role } = req.membership;
    const { limit = 50, skip = 0 } = req.query;

    const query = { chamaId };
    // Members only see their own actions
    if (role === 'member') query.actorId = req.user._id;

    const logs = await AuditLog.find(query)
        .populate('actorId', 'name')
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit));

    res.json({ logs });
}));

export default router;
