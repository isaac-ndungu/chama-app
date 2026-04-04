import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import MemberAvatar from '../components/dashboard/MemberAvatar';
import StatusBadge from '../components/dashboard/StatusBadge';
import VerifyModal from '../components/ui/VerifyModal';
import ContributionReceipt from '../components/ui/ContributionReceipt';
import ContributionDetailModal from '../components/ui/ContributionDetailModal';
import { useContributions } from '../hooks/useContributions';
import { useDashboard } from '../hooks/useDashboard';
import { useChama } from '../hooks/useChama';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt    = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function Contributions() {
  const { chamaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = useChama(chamaId);
  const isOfficer = can('record_contribution');
  const { contributions, pending, loading, verify } = useContributions(chamaId, isOfficer);
  const { data: dashboard, loading: dashLoading } = useDashboard(chamaId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);   // ← new
  const [shown, setShown] = useState(6);

  const filtered = contributions.filter(c => {
    const name = c.memberId?.name?.toLowerCase() || '';
    return (
      (!search || name.includes(search.toLowerCase())) &&
      (!statusFilter || c.status === statusFilter)
    );
  });

  const handleVerify = async () => {
    if (!verifyTarget) return;
    setVerifyLoading(true);
    try {
      await verify(verifyTarget._id);
      setVerifyTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  

  const cycleLabel = () => {
    if (dashLoading) return 'Loading cycle...';
    const c = dashboard?.cycle;
    if (!c?.cycleNumber) return 'No active cycle';
    const s = new Date(c.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
    const e = new Date(c.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Cycle ${c.cycleNumber} · ${s} – ${e}`;
  };

  return (
    <AppLayout>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">Contributions</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">{cycleLabel()}</p>
        </div>
        {isOfficer && (
          <button
            onClick={() => navigate(`/chamas/${chamaId}/contributions/new`)}
            className="bg-amber-600 text-white h-10 px-5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition flex items-center gap-2"
          >
            + Record Contribution
          </button>
        )}
      </div>

      {/* Pending banner */}
      {isOfficer && pending.length > 0 && (
        <div className="flex items-center justify-between bg-[#FEF3E2] border border-[rgba(184,101,10,0.2)] rounded-xl px-5 py-3.5 mb-5">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 shrink-0">
              <path d="M10 3L17.5 16.5H2.5L10 3z" stroke="#B8650A" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 8v4M10 13.5v.5" stroke="#B8650A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <div className="font-bold text-[13px] text-[#B8650A]">
                {pending.length} contribution{pending.length !== 1 ? 's' : ''} awaiting verification
              </div>
              <div className="text-[12px] text-[#9E9690] mt-0.5">
                Another officer must confirm these entries
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending_verification')}
            className="bg-amber-600 text-white text-[12px] font-semibold px-4 h-8 rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
          >
            Review Now →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending_verification">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="disputed">Disputed</option>
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search member..."
          className="h-9 px-3 border border-[#E8E4DF] rounded-lg text-[13px] bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 w-50"
        />
        <span className="ml-auto text-[13px] text-[#9E9690]">
          Showing {Math.min(shown, filtered.length)} of {filtered.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_110px_130px_105px_170px_110px_90px] px-5 py-3 border-b border-[#E8E4DF]">
          {['Member', 'Amount', 'M-Pesa Ref', 'Date', 'Recorded By', 'Status', ''].map(h => (
            <div key={h} className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9E9690]">{h}</div>
          ))}
        </div>

        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="grid grid-cols-[1fr_110px_130px_105px_170px_110px_90px] px-5 py-4 border-b border-[#E8E4DF] last:border-0 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8E4DF]" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-[#E8E4DF] rounded w-28" />
                  <div className="h-2.5 bg-[#E8E4DF] rounded w-16" />
                </div>
              </div>
              {[1,2,3,4,5,6].map(j => <div key={j} className="h-3 bg-[#E8E4DF] rounded self-center" />)}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9E9690] text-sm">No contributions found</div>
        ) : (
          filtered.slice(0, shown).map(c => {
            const isPending = c.status === 'pending_verification';
            const isOverdue = c.status === 'overdue';
            const isMine    = c.recordedBy?._id === user?.id || c.recordedBy === user?.id;

            return (
              <div
                key={c._id}
                className="grid grid-cols-[1fr_110px_130px_105px_170px_110px_90px] px-5 py-4 border-b border-[#E8E4DF] last:border-0 hover:bg-[#F8F6F3] transition items-center"
              >
                <div className="flex items-center gap-2.5">
                  <MemberAvatar name={c.memberId?.name} />
                  <div>
                    <div className="font-semibold text-[13px] text-[#1C1814]">{c.memberId?.name}</div>
                    <div className="text-[11px] text-[#9E9690]">Position {c.memberId?.rotationPosition || '—'}</div>
                  </div>
                </div>

                <div className="font-bold text-[13px] text-[#1C1814]">
                  {c.amount ? fmt(c.amount) : <span className="text-[#9E9690]">—</span>}
                </div>

                <div className="font-mono text-[11px] text-[#9E9690]">
                  {c.mpesaRef || <span className="not-italic text-[#9E9690]">Not recorded</span>}
                </div>

                <div className={`text-[12px] ${isOverdue ? 'text-[#C0392B] font-semibold' : 'text-[#6B6560]'}`}>
                  {isOverdue ? 'Overdue' : fmtDate(c.paymentDate)}
                </div>

                <div className="text-[12px] text-[#6B6560]">
                  {c.recordedBy?.name
                    ? `${c.recordedBy.role === 'treasurer' ? 'Treasurer' : 'Chairman'} (${c.recordedBy.name?.split(' ')[0]} ${c.recordedBy.name?.split(' ')[1]?.[0]}.)`
                    : <span className="text-[#9E9690]">—</span>}
                </div>

                <div><StatusBadge status={c.status} /></div>

                <div>
                  {isPending && isOfficer && !isMine ? (
                    <button
                      onClick={() => setVerifyTarget(c)}
                      className="bg-amber-600 text-white text-[12px] font-semibold px-4 h-8 rounded-lg hover:bg-amber-700 transition"
                    >
                      Verify
                    </button>
                  ) : isPending && isMine ? (
                    <span className="text-[11px] text-[#9E9690]">Awaiting 2nd</span>
                  ) : isOverdue ? (
                    <button className="text-[12px] text-amber-600 border border-amber-400 px-3 h-8 rounded-lg hover:bg-amber-50 transition">
                      Remind
                    </button>
                  ) : (
                    // ← View button now opens the detail modal
                    <button
                      onClick={() => setViewTarget(c)}
                      className="text-[12px] text-amber-600 border border-amber-400 px-3 h-8 rounded-lg hover:bg-amber-50 transition"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {filtered.length > shown && (
          <div className="text-center py-4 border-t border-[#E8E4DF]">
            <span className="text-[13px] text-[#9E9690]">Showing {shown} of {filtered.length} · </span>
            <button onClick={() => setShown(s => s + 10)} className="text-[13px] text-amber-600 hover:underline font-medium">
              Load more
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {verifyTarget && (
        <VerifyModal
          contribution={verifyTarget}
          onConfirm={handleVerify}
          onClose={() => setVerifyTarget(null)}
          loading={verifyLoading}
        />
      )}
      {receipt && (
        <ContributionReceipt
          contribution={receipt}
          recorderName={user?.name}
          onRecordAnother={() => { setReceipt(null); navigate(`/chamas/${chamaId}/contributions/new`); }}
          onViewAll={() => setReceipt(null)}
          onClose={() => setReceipt(null)}
        />
      )}
      {viewTarget && (
        <ContributionDetailModal
          contribution={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}
    </AppLayout>
  );
}