import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import Chama from '../models/Chama.js';
import catchAsync from '../utils/catchAsync.js';
import PDFDocument from 'pdfkit';

const router = Router({ mergeParams: true });

// Export PDF route 
router.get('/export-pdf', catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const { role } = req.membership;
    const { from, to, action, member } = req.query;

    const query = { chamaId };
    
    if (role === 'member') query.actorId = req.user._id;

    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            query.createdAt.$lte = toDate;
        }
    }

    if (action) query.action = action;

    if (member?.trim()) {
        const memberRegex = new RegExp(member.trim(), 'i');
        const matchingActors = await AuditLog.find({ chamaId, actorId: { $exists: true } })
            .populate('actorId', 'name')
            .then(logs => {
                const actors = logs
                    .filter(log => log.actorId?.name?.match(memberRegex))
                    .map(log => log.actorId._id);
                return [...new Set(actors)];
            });
        if (matchingActors.length > 0) {
            query.actorId = { $in: matchingActors };
        }
    }

    const logs = await AuditLog.find(query)
        .populate('actorId', 'name')
        .populate('targetId')
        .sort({ createdAt: -1 });

    const chama = await Chama.findById(chamaId);

    // Generate PDF
    const doc = new PDFDocument({ margin: 40, bufferPages: true });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-log-${chamaId}-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Audit Log Report', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(chama?.name || 'Chama', { align: 'center' });
    
    const fromText = from ? new Date(from).toLocaleDateString('en-KE') : 'Beginning';
    const toText = to ? new Date(to).toLocaleDateString('en-KE') : 'Today';
    doc.fontSize(10).text(`Period: ${fromText} to ${toText}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-KE')}`, { align: 'center' });
    
    doc.moveDown(0.8);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // Entries
    const pageHeight = doc.page.height;
    const bottomMargin = 60;
    
    logs.forEach((log, index) => {
        const y = doc.y;
        if (y > pageHeight - bottomMargin) {
            doc.addPage();
        }

        const dt = new Date(log.createdAt);
        const dateStr = dt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const actor = log.actorId?.name || 'Unknown';

        doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${dateStr} ${timeStr}`, 50, y);
        doc.fontSize(9).font('Helvetica').text(`${actor} • ${log.action}`, 50, doc.y);
        
        if (log.before || log.after) {
            const details = [];
            if (log.after?.amount) details.push(`Amount: KSh ${log.after.amount.toLocaleString('en-KE')}`);
            if (log.after?.mpesaRef) details.push(`Ref: ${log.after.mpesaRef}`);
            if (log.after?.principalAmount) details.push(`Principal: KSh ${log.after.principalAmount.toLocaleString('en-KE')}`);
            if (log.after?.borrowerId?.name) details.push(`Borrower: ${log.after.borrowerId.name}`);
            if (log.reason) details.push(`Reason: ${log.reason}`);
            if (log.disputeNote) details.push(`Note: ${log.disputeNote}`);
            
            if (details.length > 0) {
                doc.fontSize(8).text(details.join(' • '), 50, doc.y, { width: 450 });
            }
        }
        
        doc.moveDown(0.4);
    });

    if (logs.length === 0) {
        doc.moveDown(1);
        doc.fontSize(11).text('No audit entries found for the selected filters.', { align: 'center' });
    }

    // Footer
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.fontSize(8).text(`This is a permanent record that cannot be changed. Total entries: ${logs.length}`, 
        { align: 'center', color: '#666' });

    doc.end();
}));

// Main audit log route
router.get('/', catchAsync(async (req, res) => {
    const { chamaId } = req.params;
    const { role } = req.membership;
    const { limit = 50, skip = 0, from, to, action, member } = req.query;

    const query = { chamaId };
    
    // Members only see their own actions
    if (role === 'member') query.actorId = req.user._id;

    // Date filters
    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            query.createdAt.$lte = toDate;
        }
    }

    // Action filter
    if (action) query.action = action;

    // Member filter (search by actor name)
    if (member?.trim()) {
        const memberRegex = new RegExp(member.trim(), 'i');
        const matchingActors = await AuditLog.find({ chamaId, actorId: { $exists: true } })
            .populate('actorId', 'name')
            .then(logs => {
                const actors = logs
                    .filter(log => log.actorId?.name?.match(memberRegex))
                    .map(log => log.actorId._id);
                return [...new Set(actors)];
            });
        if (matchingActors.length > 0) {
            query.actorId = { $in: matchingActors };
        }
    }

    const logs = await AuditLog.find(query)
        .populate('actorId', 'name')
        .populate('targetId')
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({ logs, total });
}));

export default router;
