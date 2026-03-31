import { useState } from 'react';
import { voteOnLoan } from '../../api/loans';
import { useChamaContext } from '../../context/ChamaContext';
import { useAuth } from '../../context/AuthContext';
import LoanVoterRoll from './LoanVoterRoll';
import toast from 'react-hot-toast';

const LoanCard = ({ loan, chamaId, members, onUpdate }) => {
    const { user } = useAuth();
    const { can } = useChamaContext();
    const [rejectReason, setRejectReason] = useState('');
    const [voting, setVoting] = useState(false);

    const isBorrower = loan.borrowerId?._id === user.id || loan.borrowerId === user.id;
    const hasVoted =
        loan.approvals.some(a => (a.memberId?._id || a.memberId) === user.id) ||
        loan.rejections.some(r => (r.memberId?._id || r.memberId) === user.id);

    const handleVote = async (vote) => {
        if (vote === 'reject' && !rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        setVoting(true);
        try {
            await voteOnLoan(chamaId, loan._id, vote, rejectReason);
            toast.success(`Vote recorded: ${vote}`);
            onUpdate();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Vote failed');
        } finally {
            setVoting(false);
        }
    };

    const progressPct = Math.round((loan.approvals.length / loan.quorumRequired) * 100);

    return (
        <div style={{ padding: 16, border: `2px solid ${loan.approvalStatus === 'pending' ? '#f90' : loan.approvalStatus === 'approved' ? '#090' : '#c00'}`, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{loan.borrowerId?.name} — KES {loan.principalAmount.toLocaleString()}</strong>
                <span style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 'bold' }}>{loan.approvalStatus}</span>
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                Interest: {(loan.interestRate * 100).toFixed(0)}% flat × {loan.durationMonths} months
                | Total due: KES {loan.totalDue.toLocaleString()}
                | Monthly: KES {loan.monthlyInstalment.toLocaleString()}
            </div>

            {loan.approvalStatus === 'pending' && (
                <>
                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#666' }}>
                            Approvals: {loan.approvals.length} / {loan.quorumRequired} needed
                        </div>
                        <div style={{ height: 8, background: '#eee', borderRadius: 4, marginTop: 4 }}>
                            <div style={{ height: '100%', width: `${Math.min(progressPct, 100)}%`, background: '#090', borderRadius: 4 }} />
                        </div>
                    </div>

                    <LoanVoterRoll
                        approvals={loan.approvals}
                        rejections={loan.rejections}
                        members={members}
                        borrowerId={loan.borrowerId?._id || loan.borrowerId}
                    />

                    {!isBorrower && !hasVoted && (
                        <div style={{ marginTop: 12 }}>
                            <button onClick={() => handleVote('approve')} disabled={voting} style={{ marginRight: 8, background: '#090', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4 }}>
                                Approve
                            </button>
                            <div style={{ marginTop: 8 }}>
                                <input
                                    placeholder="Reason for rejection (required)"
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    style={{ marginRight: 8, padding: '6px 10px', width: 250 }}
                                />
                                <button onClick={() => handleVote('reject')} disabled={voting} style={{ background: '#c00', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4 }}>
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}
                    {isBorrower && <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>You cannot vote on your own loan application.</p>}
                    {hasVoted && <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>✓ You have voted on this loan.</p>}
                </>
            )}

            {loan.status === 'active' && (
                <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13 }}>
                        Repaid: KES {loan.totalRepaid.toLocaleString()} / KES {loan.totalDue.toLocaleString()}
                    </div>
                    <div style={{ height: 8, background: '#eee', borderRadius: 4, marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${Math.min(Math.round((loan.totalRepaid / loan.totalDue) * 100), 100)}%`, background: '#39f', borderRadius: 4 }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanCard;
