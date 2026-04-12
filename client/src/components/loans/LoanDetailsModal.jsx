import { useState } from 'react';
import MemberAvatar from '../dashboard/MemberAvatar';
import StatusBadge from '../dashboard/StatusBadge';
import RoleBadge from '../ui/RoleBadge';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const fmtDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' +
    dt.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
};

export default function LoanDetailsModal({ loan, members, onClose }) {
  const [tab, setTab] = useState('details');

  if (!loan) return null;

  const eligible = members.filter((m) => {
    const uid = m.userId?._id || m.userId;
    const bid = loan.borrowerId?._id || loan.borrowerId;
    return uid?.toString() !== bid?.toString();
  });

  const approvedVoters = (loan.approvals || []).map((a) => {
    const member = eligible.find((m) => {
      const mid = m.userId?._id || m.userId;
      const aid = a.memberId?._id || a.memberId;
      return mid?.toString() === aid?.toString();
    });
    return { ...a, memberData: member };
  });

  const rejectedVoters = (loan.rejections || []).map((r) => {
    const member = eligible.find((m) => {
      const mid = m.userId?._id || m.userId;
      const rid = r.memberId?._id || r.memberId;
      return mid?.toString() === rid?.toString();
    });
    return { ...r, memberData: member };
  });

  const notVoted = eligible.filter((m) => {
    const uid = m.userId?._id || m.userId;
    return ![...approvedVoters, ...rejectedVoters].some((v) => {
      const vid = v.memberId?._id || v.memberId;
      return vid?.toString() === uid?.toString();
    });
  });

  const isOverdue =
    loan.status === 'active' && new Date(loan.dueDate) < new Date();
  const pct =
    loan.totalDue > 0
      ? Math.round((loan.totalRepaid / loan.totalDue) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4 overflow-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-7 w-full max-w-[580px] my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-bold text-[17px] text-[#1C1814]">
              {loan.borrowerId?.name}
            </h2>
            <p className="text-[12px] text-[#9E9690] mt-0.5">
              {(loan.interestRate * 100).toFixed(0)}% flat · {loan.durationMonths}{' '}
              months · Applied {fmtDate(loan.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9E9690] hover:text-[#1C1814] text-[20px]"
          >
            ✕
          </button>
        </div>

        {/* Principal & Status */}
        <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-[#E8E4DF]">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
              Principal
            </label>
            <p className="text-[20px] font-serif text-[#1C1814] mt-1">
              {fmt(loan.principalAmount)}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
              Status
            </label>
            <div className="mt-2">
              <StatusBadge
                status={
                  isOverdue
                    ? 'overdue'
                    : loan.status === 'pending'
                      ? 'pending'
                      : loan.status
                }
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8E4DF] mb-4 gap-1">
          {['details', 'votes', 'repayments'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 pb-2 text-[12px] font-semibold border-b-2 -mb-px transition capitalize ${
                tab === t
                  ? 'text-amber-600 border-amber-600'
                  : 'text-[#9E9690] border-transparent hover:text-[#1C1814]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/*    DETAILS TAB    */}
        {tab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
                  Total Payable
                </label>
                <p className="text-[16px] font-semibold text-[#1C1814] mt-1">
                  {fmt(loan.totalDue)}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
                  Interest
                </label>
                <p className="text-[16px] font-semibold text-[#1C1814] mt-1">
                  {fmt(loan.totalDue - loan.principalAmount)}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
                  Monthly Installment
                </label>
                <p className="text-[16px] font-semibold text-[#1C1814] mt-1">
                  {fmt(loan.monthlyInstalment)}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
                  Due Date
                </label>
                <p className="text-[16px] font-semibold text-[#1C1814] mt-1">
                  {fmtDate(loan.dueDate)}
                </p>
              </div>
            </div>

            {/* Repayment Progress */}
            {loan.status === 'active' && (
              <div className="bg-[#F8F6F3] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#1C1814]">
                    Repayment Progress
                  </span>
                  <span className="text-[12px] font-semibold text-[#1C1814]">
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E8E4DF] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isOverdue
                        ? 'bg-[#C0392B]'
                        : pct === 100
                          ? 'bg-[#2A7A4B]'
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#6B6560] mt-2">
                  {fmt(loan.totalRepaid)} repaid of {fmt(loan.totalDue)}
                </p>
              </div>
            )}
          </div>
        )}

        {/*    VOTES TAB    */}
        {tab === 'votes' && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {/* Approved */}
            {approvedVoters.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#2A7A4B] mb-3">
                  ✓ Approved ({approvedVoters.length})
                </div>
                <div className="space-y-2">
                  {approvedVoters.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[#EAF5EE] border border-[#D4E8DD] rounded-lg p-3"
                    >
                      <MemberAvatar
                        name={
                          v.memberData?.userId?.name ||
                          v.memberId?.name ||
                          'Member'
                        }
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-[#1C1814]">
                          {v.memberData?.userId?.name ||
                            v.memberId?.name ||
                            'Unknown'}
                        </p>
                        {v.note && (
                          <p className="text-[11px] text-[#6B6560] mt-0.5">
                            "{v.note}"
                          </p>
                        )}
                      </div>
                      <RoleBadge role={v.memberData?.role} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {rejectedVoters.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#C0392B] mb-3">
                  ✗ Rejected ({rejectedVoters.length})
                </div>
                <div className="space-y-2">
                  {rejectedVoters.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[#F9EDED] border border-[#E8B5B5] rounded-lg p-3"
                    >
                      <MemberAvatar
                        name={
                          r.memberData?.userId?.name ||
                          r.memberId?.name ||
                          'Member'
                        }
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-[#1C1814]">
                          {r.memberData?.userId?.name ||
                            r.memberId?.name ||
                            'Unknown'}
                        </p>
                        {r.reason && (
                          <p className="text-[11px] text-[#6B6560] mt-0.5">
                            "{r.reason}"
                          </p>
                        )}
                      </div>
                      <RoleBadge role={r.memberData?.role} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Not voted */}
            {notVoted.length > 0 && loan.status === 'pending' && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
                  — Not voted ({notVoted.length})
                </div>
                <div className="space-y-2">
                  {notVoted.slice(0, 5).map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[#F8F6F3] border border-[#E8E4DF] rounded-lg p-3"
                    >
                      <MemberAvatar name={m.userId?.name || 'Member'} size="sm" />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-[#1C1814]">
                          {m.userId?.name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-[#9E9690] mt-0.5">
                          Awaiting vote
                        </p>
                      </div>
                      <RoleBadge role={m.role} />
                    </div>
                  ))}
                  {notVoted.length > 5 && (
                    <p className="text-[11px] text-[#9E9690] text-center py-2">
                      +{notVoted.length - 5} more awaiting
                    </p>
                  )}
                </div>
              </div>
            )}

            {approvedVoters.length === 0 &&
              rejectedVoters.length === 0 &&
              notVoted.length === 0 && (
                <p className="text-center text-[13px] text-[#9E9690] py-4">
                  No voting activity yet
                </p>
              )}
          </div>
        )}

        {/*    REPAYMENTS TAB    */}
        {tab === 'repayments' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {loan.repayments && loan.repayments.length > 0 ? (
              loan.repayments.map((r, i) => (
                <div
                  key={i}
                  className="border border-[#E8E4DF] rounded-lg p-3 bg-[#F8F6F3]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[13px] text-[#1C1814]">
                      {fmt(r.amount)}
                    </span>
                    <span className="text-[11px] text-[#9E9690]">
                      {fmtDateTime(r.paidAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6B6560]">
                    <span>Ref: {r.mpesaRef || '—'}</span>
                    <span>Recorded by {r.recordedBy?.name || '—'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[13px] text-[#9E9690] py-4">
                No repayments recorded yet
              </p>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-[#E8E4DF]">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[13px] font-semibold text-[#6B6560] border border-[#E8E4DF] rounded-lg hover:bg-[#F8F6F3] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
