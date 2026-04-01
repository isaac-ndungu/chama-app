import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoanCard from '../LoanCard';

// Mock context hooks
vi.mock('../../../context/ChamaContext', () => ({
  useChamaContext: () => ({ can: () => true })
}));

const authUser = { id: 'voter-user-id', name: 'Kamau' };

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: authUser })
}));

vi.mock('../../../api/loans', () => ({
  voteOnLoan: vi.fn()
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() }
}));

const baseLoan = {
  _id: 'loan1',
  borrowerId: { _id: 'borrower-user-id', name: 'Wanjiru' },
  principalAmount: 10000,
  interestRate: 0.10,
  durationMonths: 3,
  totalDue: 13000,
  monthlyInstalment: 4334,
  quorumRequired: 3,
  approvals: [],
  rejections: [],
  approvalStatus: 'pending',
  status: 'pending',
  totalRepaid: 0
};

const members = [
  { userId: { _id: 'voter-user-id', name: 'Kamau' }, role: 'chairman' },
  { userId: { _id: 'borrower-user-id', name: 'Wanjiru' }, role: 'member' }
];

describe('LoanCard', () => {
  beforeEach(() => {
    authUser.id = 'voter-user-id';
    authUser.name = 'Kamau';
  });

  it('shows vote buttons when logged-in user is NOT the borrower', () => {
    // Voter ID differs from borrower ID
    render(<LoanCard loan={baseLoan} chamaId="chama1" members={members} onUpdate={() => {}} />);
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('hides vote buttons and shows message when logged-in user IS the borrower', () => {
    authUser.id = 'borrower-user-id';
    authUser.name = 'Wanjiru';
    const borrowerLoan = { ...baseLoan };
    render(<LoanCard loan={borrowerLoan} chamaId="chama1" members={members} onUpdate={() => {}} />);
    expect(screen.getByText(/0 \/ 3 needed/)).toBeInTheDocument();
    expect(screen.getByText(/You cannot vote on your own loan application\./)).toBeInTheDocument();
  });

  it('shows already voted message when user has voted', () => {
    authUser.id = 'voter-user-id';
    authUser.name = 'Kamau';
    const loanWithVote = {
      ...baseLoan,
      approvals: [{ memberId: { _id: 'voter-user-id' }, role: 'chairman', note: '' }]
    };
    render(<LoanCard loan={loanWithVote} chamaId="chama1" members={members} onUpdate={() => {}} />);
    expect(screen.getByText(/You have voted on this loan\./)).toBeInTheDocument();
  });
});