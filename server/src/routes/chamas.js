import { Router } from 'express';
import { createChama, getMyChamas, getChamaById } from '../controllers/chamaController.js';
import { protect } from '../middleware/auth.js';
import { requireChamaMember } from '../middleware/requireChamaMember.js';
import memberRoutes from './members.js';
import contributionRoutes from './contributions.js';
import loanRoutes from './loans.js';
import auditRoutes from './audit.js';
import dashboardRoutes from './dashboard.js';
import { addClient, removeClient } from '../services/sseService.js';
import reportRoutes from './reports.js';

const router = Router();

// All chama routes require authentication
router.use(protect);

router.post('/', createChama);
router.get('/mine', getMyChamas);
router.get('/:chamaId/events', protect, requireChamaMember, (req, res) => {
    const { chamaId } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');  // disable nginx buffering if behind proxy
    res.flushHeaders();

    // Send a heartbeat immediately — confirms connection
    res.write(`event: connected\ndata: ${JSON.stringify({ chamaId })}\n\n`);

    addClient(chamaId, res);

    // Heartbeat every 30s to keep connection alive through proxies
    const heartbeat = setInterval(() => {
        res.write(':heartbeat\n\n');
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        removeClient(chamaId, res);
    });
});

// All routes below require chama membership (chamaId in params)
router.get('/:chamaId', requireChamaMember, getChamaById);

router.use('/:chamaId/members', requireChamaMember, memberRoutes);
router.use('/:chamaId/contributions', requireChamaMember, contributionRoutes);
router.use('/:chamaId/loans', requireChamaMember, loanRoutes);
router.use('/:chamaId/audit', requireChamaMember, auditRoutes);
router.use('/:chamaId/dashboard', requireChamaMember, dashboardRoutes);
router.use('/:chamaId/reports', protect, requireChamaMember, reportRoutes);

export default router;