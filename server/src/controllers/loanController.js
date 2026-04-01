import Loan from '../models/Loan.js';
import Membership from '../models/Membership.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { calculateLoan } from '../services/loanService.js';
import { createAuditLog } from '../services/auditService.js';

export const applyForLoan = catchAsync(async (req, res, next) => {
    const { chamaId } = req.params;
  const { borrowerId, principalAmount, interestRate, durationMonths } = req.body;

  // Block if borrower has active loan
  const existingLoan = await Loan.findOne({ chamaId, borrowerId, status: 'active' });
  if (existingLoan) return next(new AppError('This member already has an active loan', 409));

  // Snapshot quorum at application time
  const activeMemberCount = await Membership.countDocuments({ chamaId, status: 'active' });
  const quorumRequired = Math.ceil(activeMemberCount / 2);

  const calc = calculateLoan(principalAmount, interestRate, durationMonths);

  const loan = await Loan.create({
    chamaId,
    borrowerId,
    requestedBy: req.user._id,
    principalAmount,
    interestRate,
    durationMonths,
    ...calc,
    quorumRequired,
    approvals: [],
    rejections: [],
    approvalStatus: 'pending',
    repayments: [],
    totalRepaid: 0,
    status: 'pending'
  });

  await createAuditLog({
    chamaId, 
    actorId: req.user._id, 
    action: 'LOAN_APPLIED',
    targetCollection: 'loans', 
    targetId: loan._id,
    before: null, 
    after: loan.toObject(), 
    ipAddress: req.ip
  });

  res.status(201).json({ loan });
});

export const voteOnLoan = catchAsync(async (req, res, next) => {
  const { chamaId, loanId } = req.params;
  const { vote, reason = '' } = req.body;   
  const voterId = req.user._id;

  if (!['approve', 'reject'].includes(vote)) {
    return next(new AppError('Vote must be "approve" or "reject"', 400));
  }

  const loan = await Loan.findOne({ _id: loanId, chamaId });

  if (!loan) return next(new AppError('Loan not found', 404));
  if (loan.approvalStatus !== 'pending') {
    return next(new AppError('This loan vote is already closed', 400));
  }

  if (loan.borrowerId.toString() === voterId.toString()) {
    return next(new AppError('You cannot vote on your own loan application', 403));
  }

  const idStr = voterId.toString();
  const alreadyVoted = loan.approvals.some(a => a.memberId.toString() === idStr) || loan.rejections.some(r => r.memberId.toString() === idStr);

  if (alreadyVoted) return next(new AppError('You have already voted on this loan', 409));

  if (vote === 'reject' && !reason.trim()) {
    return next(new AppError('A reason is required when rejecting a loan', 400));
  }

  const before = loan.toObject();

  if (vote === 'approve') {
    loan.approvals.push({ memberId: voterId, role: req.membership.role, note: reason });
    if (loan.approvals.length >= loan.quorumRequired) {
      loan.approvalStatus = 'approved';
      loan.status = 'active';
    }
  } else {
    loan.rejections.push({ memberId: voterId, role: req.membership.role, reason });
    // check if quorum is now mathematically impossible
    const activeMemberCount = await Membership.countDocuments({ chamaId, status: 'active' });
    const eligibleVoters = activeMemberCount - 1;   // exclude borrower
    const totalVoted = loan.approvals.length + loan.rejections.length;
    const remainingVoters = eligibleVoters - totalVoted;
    const maxPossibleApprovals = loan.approvals.length + remainingVoters;
    if (maxPossibleApprovals < loan.quorumRequired) {
      loan.approvalStatus = 'rejected';
    }
  }

  await loan.save();

  await createAuditLog({
    chamaId, 
    actorId: voterId,
    action: vote === 'approve' ? 'LOAN_APPROVED' : 'LOAN_REJECTED',
    targetCollection: 'loans', 
    targetId: loan._id,
    before, 
    after: loan.toObject(), 
    ipAddress: req.ip
  });

  res.json({ loan });
});

export const recordRepayment = catchAsync(async (req, res, next) => {
  const { chamaId, loanId } = req.params;
  const { amount, mpesaRef, paidAt } = req.body;

  if (!Number.isInteger(amount) || amount <= 0) {
    return next(new AppError('Amount must be a positive whole number', 400));
  }

  const loan = await Loan.findOne({ _id: loanId, chamaId, status: 'active' });
  if (!loan) return next(new AppError('Active loan not found', 404));

  const repayment = {
    amount,
    mpesaRef: mpesaRef?.trim().toUpperCase(),
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    recordedBy: req.user._id
  };

  const before = loan.toObject();
  loan.repayments.push(repayment);
  loan.totalRepaid += amount;

  if (loan.totalRepaid >= loan.totalDue) {
    loan.status = 'settled';
  }

  await loan.save();

  await createAuditLog({
    chamaId, 
    actorId: req.user._id, 
    action: 'LOAN_REPAYMENT_RECORDED',
    targetCollection: 'loans', 
    targetId: loan._id,
    before, 
    after: loan.toObject(), 
    ipAddress: req.ip
  });

  res.json({ loan });
});

export const listLoans = catchAsync(async (req, res) => {
  const { status } = req.query;
  const query = { chamaId: req.params.chamaId };
  if (status) query.status = status;

  // All authenticated members can see all loans for transparency and voting
  const loans = await Loan.find(query)
    .populate('borrowerId', 'name')
    .populate('requestedBy', 'name')
    .populate('approvals.memberId', 'name')
    .populate('rejections.memberId', 'name')
    .sort({ createdAt: -1 });

  res.json({ loans });
});
