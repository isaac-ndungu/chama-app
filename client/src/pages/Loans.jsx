import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import MemberAvatar from '../components/dashboard/MemberAvatar';
import StatusBadge from '../components/dashboard/StatusBadge';
import RoleBadge from '../components/ui/RoleBadge';
import ProgressBar from '../components/ui/ProgressBar';
import LoanApplicationModal from '../components/loans/LoanApplicationModal';
import LoanDetailsModal from '../components/loans/LoanDetailsModal';
import { useLoans } from '../hooks/useLoans';
import { useChama } from '../hooks/useChama';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ── Voter Roll ────────────────────────────────────────────────────────────────
function VoterRoll({ loan, members, currentUserId }) {
  const eligible = members.filter(m => {
    const uid = m.userId?._id || m.userId;
    const bid = loan.borrowerId?._id || loan.borrowerId;
    return uid?.toString() !== bid?.toString();
  });

  return (
    <div className="border border-[#E8E4DF] rounded-xl overflow-hidden mt-4">
      <div className="px-4 py-2 bg-[#F8F6F3] border-b border-[#E8E4DF]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">Voter Roll</span>
      </div>
      <div className="divide-y divide-[#E8E4DF]">
        {eligible.slice(0, 5).map(m => {
          const uid = m.userId?._id || m.userId;
          const name = m.userId?.name || 'Member';
          const approved = loan.approvals?.find(a => {
            const aid = a.memberId?._id || a.memberId;
            return aid?.toString() === uid?.toString();
          });
          const rejected = loan.rejections?.find(r => {
            const rid = r.memberId?._id || r.memberId;
            return rid?.toString() === uid?.toString();
          });

          return (
            <div key={m._id} className="flex items-center gap-3 px-4 py-3">
              <MemberAvatar name={name} size="sm" />
              <span className="flex-1 text-[13px] font-semibold text-[#1C1814]">{name}</span>
              <RoleBadge role={m.role} />
              <span className={`text-[12px] font-semibold ml-2 ${
                approved ? 'text-[#2A7A4B]' : rejected ? 'text-[#C0392B]' : 'text-[#9E9690]'
              }`}>
                {approved ? '✓ Approved' : rejected ? `✗ Rejected` : '— Not voted'}
              </span>
            </div>
          );
        })}
        {eligible.length > 5 && (
          <div className="text-center py-2.5 text-[12px] text-[#9E9690]">
            + {eligible.length - 5} more eligible voters
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loan Card (Active/History) ────────────────────────────────────────────────
function LoanCard({ loan, isOfficer, onRecordRepayment, onViewDetails }) {
  const isOverdue = loan.status === 'active' && new Date(loan.dueDate) < new Date();
  const pct = loan.totalDue > 0 ? Math.round((loan.totalRepaid / loan.totalDue) * 100) : 0;
  const isSettled = loan.status === 'settled';

  return (
    <div className={`bg-white border rounded-2xl p-5 ${isOverdue ? 'border-l-4 border-l-[#C0392B] border-[#E8E4DF]' : 'border-[#E8E4DF]'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-bold text-[15px] text-[#1C1814]">{loan.borrowerId?.name}</div>
          <div className="text-[12px] text-[#9E9690] mt-0.5">
            {(loan.interestRate * 100).toFixed(0)}% flat · {loan.durationMonths} months ·
            {isSettled ? ` Settled ${fmtDate(loan.updatedAt)}` : ` Approved ${fmtDate(loan.issuedAt)}`}
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-[20px] text-[#1C1814]">{fmt(loan.principalAmount)}</div>
          <div className={`text-[12px] mt-0.5 ${isOverdue ? 'text-[#C0392B] font-semibold' : 'text-[#9E9690]'}`}>
            {isOverdue ? `OVERDUE · ${fmtDate(loan.dueDate)}` : isSettled ? 'Settled ✓' : `Due ${fmtDate(loan.dueDate)}`}
          </div>
        </div>
      </div>

      <ProgressBar
        value={pct}
        color={isOverdue ? 'red' : isSettled ? 'green' : 'green'}
        label={`${fmt(loan.totalRepaid)} repaid of ${fmt(loan.totalDue)}`}
      />

      <div className="flex items-center justify-between mt-3">
        <StatusBadge status={isOverdue ? 'overdue' : loan.status} />
        <div className="flex gap-2.5">
          <button
            onClick={() => onViewDetails(loan)}
            className="text-[12px] text-amber-600 border border-amber-400 px-4 h-8 rounded-lg hover:bg-amber-50 transition"
          >
            {isSettled ? 'View Record' : 'View Details'}
          </button>
          {!isSettled && isOfficer && (
            <button
              onClick={() => onRecordRepayment(loan)}
              className="text-[12px] bg-[#2A7A4B] text-white px-4 h-8 rounded-lg hover:bg-[#236640] transition font-semibold"
            >
              Record Repayment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Repayment Modal ───────────────────────────────────────────────────────────
function RepaymentModal({ loan, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ amount: '', mpesaRef: '', paidAt: new Date().toISOString().split('T')[0] });

  if (!loan) return null;
  return (
    <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-100 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-[17px] text-[#1C1814] mb-1">Record Repayment</h2>
        <p className="text-[13px] text-[#9E9690] mb-5">{loan.borrowerId?.name} · Remaining: {fmt(loan.totalDue - loan.totalRepaid)}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Amount (KSh)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder={loan.monthlyInstalment} className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">M-Pesa Reference</label>
            <input value={form.mpesaRef} onChange={e => setForm(f => ({ ...f, mpesaRef: e.target.value.toUpperCase() }))} placeholder="RPY1A2B3C4D" className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] font-mono focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Payment Date</label>
            <input type="date" value={form.paidAt} onChange={e => setForm(f => ({ ...f, paidAt: e.target.value }))} className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => onSubmit(loan._id, { ...form, amount: parseInt(form.amount, 10) })} disabled={loading || !form.amount} className="flex-1 h-10 bg-amber-600 text-white rounded-lg font-semibold text-[13px] hover:bg-amber-700 disabled:opacity-50 transition">
              {loading ? 'Recording...' : 'Record Repayment'}
            </button>
            <button onClick={onClose} className="px-5 border border-[#E8E4DF] text-[#6B6560] h-10 rounded-lg text-[13px] hover:bg-[#F8F6F3] transition">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Loans() {
  const { chamaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chama, can } = useChama(chamaId);
  const { pendingLoans, activeLoans, settledLoans, overdueLoans, loading, vote, recordRepayment } = useLoans(chamaId);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('pending');
  const [voteNote, setVoteNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [votingId, setVotingId] = useState(null);
  const [repayTarget, setRepayTarget] = useState(null);
  const [repayLoading, setRepayLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);

  // Load members list
  useEffect(() => {
    api.get(`/chamas/${chamaId}/members`)
      .then(res => setMembers(res.data.members || []))
      .catch(() => toast.error('Failed to load members'));
  }, [chamaId]);

  const isOfficer = can('record_contribution');

  const totalOutstanding = activeLoans.reduce((s, l) => s + (l.totalDue - l.totalRepaid), 0);

  const tabs = [
    { key: 'pending', label: `Pending Vote (${pendingLoans.length})` },
    { key: 'active',  label: `Active (${activeLoans.length})` },
    { key: 'history', label: `History (${settledLoans.length})` },
  ];

  const handleVote = async (loanId, voteVal, reason = '') => {
    setVotingId(loanId);
    try {
      await vote(loanId, voteVal, reason);
      setVoteNote('');
      setRejectReason('');
    } catch {
    } finally {
      setVotingId(null);
    }
  };

  const handleRepayment = async (loanId, data) => {
    setRepayLoading(true);
    try {
      await recordRepayment(loanId, data);
      setRepayTarget(null);
      toast.success('Payment Recorded')
    } catch {
    } finally {
      setRepayLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">Loans</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">
            {activeLoans.length} active · {fmt(totalOutstanding)} outstanding
          </p>
        </div>
          <button
            onClick={() => setShowApplicationModal(true)}
            className="bg-amber-600 text-white h-10 px-5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
          >
            + Loan Application
          </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8E4DF] mb-5 gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 pb-3 text-[13px] font-semibold border-b-2 -mb-px transition ${
              tab === t.key
                ? 'text-amber-600 border-amber-600'
                : 'text-[#9E9690] border-transparent hover:text-[#1C1814]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PENDING VOTE TAB ── */}
      {tab === 'pending' && (
        <div className="space-y-4">
          {pendingLoans.length === 0 ? (
            <div className="bg-white border border-[#E8E4DF] rounded-2xl text-center py-16">
              <div className="text-[#9E9690] text-sm">No loans awaiting votes</div>
            </div>
          ) : (
            pendingLoans.map(loan => {
              const isBorrower = (loan.borrowerId?._id || loan.borrowerId)?.toString() === user?.id;
              const hasVoted = [...(loan.approvals || []), ...(loan.rejections || [])].some(v => {
                const vid = v.memberId?._id || v.memberId;
                return vid?.toString() === user?.id;
              });
              const pct = Math.round((loan.approvals?.length || 0) / loan.quorumRequired * 100);

              return (
                <div key={loan._id} className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
                  {/* Info banner */}
                  {!isBorrower && !hasVoted && (
                    <div className="bg-[#EEF2FF] border border-[rgba(26,62,140,0.15)] rounded-xl px-4 py-3 mb-4 text-[13px] text-[#1A3E8C]">
                      ℹ This loan requires {loan.quorumRequired} of {(members.length - 1) || '?'} eligible members to approve before it can be disbursed. You have not voted yet.
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-bold text-[15px] text-[#1C1814]">{loan.borrowerId?.name}</div>
                      <div className="text-[12px] text-[#9E9690] mt-0.5">
                        Borrower · {(loan.interestRate * 100).toFixed(0)}% flat · {loan.durationMonths} months · Applied {fmtDate(loan.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-[20px] text-[#1C1814]">{fmt(loan.principalAmount)}</div>
                      <div className="text-[12px] text-[#9E9690] mt-0.5">
                        Quorum: {loan.approvals?.length || 0}/{loan.quorumRequired} approved
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <ProgressBar
                    value={pct}
                    color="amber"
                    label="Approval Votes"
                    sublabel={`${loan.approvals?.length || 0} of ${loan.quorumRequired} needed`}
                    showPercent={false}
                  />
                  <div className="text-right text-[12px] font-bold text-[#1A3E8C] mt-1">
                    {loan.approvals?.length || 0} of {loan.quorumRequired} needed
                  </div>

                  {/* Voter roll */}
                  <VoterRoll loan={loan} members={members} currentUserId={user?.id} />

                  {/* Vote actions */}
                  {!isBorrower && !hasVoted && (
                    <div className="mt-4 space-y-3">
                      <input
                        value={voteNote}
                        onChange={e => setVoteNote(e.target.value)}
                        placeholder="Optional note for approval..."
                        className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVote(loan._id, 'approve', voteNote)}
                          disabled={votingId === loan._id}
                          className="flex-1 h-10 bg-amber-600 text-white rounded-lg font-semibold text-[13px] hover:bg-amber-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                        >
                          ✓ Approve Loan
                        </button>
                        <div className="flex flex-1 gap-2">
                          <input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason (required to reject)"
                            className="flex-1 h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-red-400"
                          />
                          <button
                            onClick={() => {
                              if (!rejectReason.trim()) { toast.error('A reason is required'); return; }
                              handleVote(loan._id, 'reject', rejectReason);
                            }}
                            disabled={votingId === loan._id}
                            className="h-10 px-5 bg-[#C0392B] text-white rounded-lg font-semibold text-[13px] hover:bg-[#a0302a] disabled:opacity-50 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isBorrower && (
                    <div className="mt-4 text-center text-[12px] text-[#9E9690] py-3 bg-[#F8F6F3] rounded-xl">
                      You cannot vote on your own loan application
                    </div>
                  )}
                  {hasVoted && (
                    <div className="mt-4 text-center text-[12px] text-[#2A7A4B] py-3 bg-[#EAF5EE] rounded-xl font-semibold">
                      ✓ You have voted on this loan
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── ACTIVE TAB ── */}
      {tab === 'active' && (
        <div className="space-y-4">
          {activeLoans.length === 0 ? (
            <div className="bg-white border border-[#E8E4DF] rounded-2xl text-center py-16">
              <div className="text-[#9E9690] text-sm">No active loans</div>
            </div>
          ) : (
            activeLoans.map(loan => (
              <LoanCard
                key={loan._id}
                loan={loan}
                isOfficer={isOfficer}
                onRecordRepayment={setRepayTarget}
                onViewDetails={setSelectedLoanDetails}
              />
            ))
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {settledLoans.length === 0 ? (
            <div className="bg-white border border-[#E8E4DF] rounded-2xl text-center py-16">
              <div className="text-[#9E9690] text-sm">No loan history yet</div>
            </div>
          ) : (
            settledLoans.map(loan => (
              <LoanCard
                key={loan._id}
                loan={loan}
                isOfficer={false}
                onRecordRepayment={() => {}}
                onViewDetails={setSelectedLoanDetails}
              />
            ))
          )}
        </div>
      )}

      {/* Repayment modal */}
      {repayTarget && (
        <RepaymentModal
          loan={repayTarget}
          onClose={() => setRepayTarget(null)}
          onSubmit={handleRepayment}
          loading={repayLoading}
        />
      )}

      {/* Loan Application Modal */}
      {showApplicationModal && (
        <LoanApplicationModal
          chamaId={chamaId}
          chama={chama}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {
            setTab('pending');
          }}
        />
      )}

      {/* Loan Details Modal */}
      {selectedLoanDetails && (
        <LoanDetailsModal
          loan={selectedLoanDetails}
          members={members}
          onClose={() => setSelectedLoanDetails(null)}
        />
      )}
    </AppLayout>
  );
}