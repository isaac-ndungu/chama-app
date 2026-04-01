import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import MemberAvatar from '../components/dashboard/MemberAvatar';
import RoleBadge from '../components/ui/RoleBadge';
import StatusBadge from '../components/dashboard/StatusBadge';
import LedgerModal from '../components/ui/LedgerModal';
import TransactionHistoryModal from '../components/ui/TransactionHistoryModal';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt    = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function MemberProfile() {
  const { chamaId, memberId } = useParams();
  const navigate = useNavigate();

  const [member, setMember]             = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showLedger, setShowLedger]     = useState(false);
  const [showHistory, setShowHistory]   = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [membersRes, contribRes] = await Promise.all([
          api.get(`/chamas/${chamaId}/members`),
          api.get(`/chamas/${chamaId}/contributions?memberId=${memberId}`),
        ]);

        const found = membersRes.data.members?.find(m => m.userId?._id === memberId);
        setMember(found || null);
        setContributions(contribRes.data.contributions || []);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load member profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chamaId, memberId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="grid grid-cols-[1fr_320px] gap-6 animate-pulse">
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-7 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#E8E4DF] rounded" />)}
          </div>
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-[#E8E4DF] rounded" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!member) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-[#9E9690] mb-4">Member not found</p>
          <button onClick={() => navigate(`/chamas/${chamaId}/members`)} className="text-amber-600 hover:underline text-sm font-medium">
            ← Back to Members
          </button>
        </div>
      </AppLayout>
    );
  }

  const userName  = member.userId?.name  || 'Unknown';
  const userEmail = member.userId?.email || '—';
  const userPhone = member.userId?.phone || '—';

  const verified       = contributions.filter(c => c.status === 'verified');
  const totalContrib   = verified.reduce((s, c) => s + (c.amount || 0), 0);
  const pendingCount   = contributions.filter(c => c.status === 'pending_verification').length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">{userName}</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">Member Profile</p>
        </div>
        <button
          onClick={() => navigate(`/chamas/${chamaId}/members`)}
          className="text-[13px] text-[#6B6560] border border-[#E8E4DF] h-9 px-4 rounded-lg hover:bg-[#F8F6F3] transition"
        >
          ← Back to Members
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">

        {/* ── Main Column ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Identity card */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-7">
            <div className="flex items-center gap-5 mb-6 pb-5 border-b border-[#E8E4DF]">
              <MemberAvatar name={userName} size="lg" />
              <div className="flex-1">
                <h2 className="font-semibold text-[18px] text-[#1C1814]">{userName}</h2>
                <p className="text-[13px] text-[#9E9690] mt-0.5">
                  Position {member.rotationPosition || '—'} in rotation
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <RoleBadge role={member.role} />
                  <StatusBadge status={member.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                ['Email', userEmail],
                ['Phone', userPhone],
                ['Joined', fmtDay(member.joinedAt)],
                ['Rotation Position', member.rotationPosition ? `#${member.rotationPosition}` : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">{label}</div>
                  <div className="text-[13px] text-[#1C1814]">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent contributions */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DF]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
                Recent Contributions
              </span>
              {contributions.length > 5 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-[12px] text-amber-600 hover:underline font-medium"
                >
                  View all {contributions.length} →
                </button>
              )}
            </div>

            {contributions.length === 0 ? (
              <div className="text-center py-10 text-[#9E9690] text-sm">
                No contributions recorded yet
              </div>
            ) : (
              contributions.slice(0, 5).map(c => (
                <div
                  key={c._id}
                  className="flex items-center justify-between px-6 py-3.5 border-b border-[#F8F6F3] last:border-0 hover:bg-[#F8F6F3] transition"
                >
                  <div>
                    <div className="font-semibold text-[13px] text-[#1C1814]">{fmt(c.amount)}</div>
                    <div className="text-[11px] text-[#9E9690] mt-0.5">
                      {fmtDay(c.paymentDate)}
                      {c.mpesaRef && <span className="font-mono ml-1.5">· {c.mpesaRef}</span>}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Summary card */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-4">
              Financial Summary
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-[#9E9690]">Total Contributed</div>
                <div className="font-serif text-[22px] text-[#2A7A4B]">{fmt(totalContrib)}</div>
                <div className="text-[11px] text-[#9E9690] mt-0.5">{verified.length} verified payments</div>
              </div>
              {pendingCount > 0 && (
                <div className="pt-3 border-t border-[#F8F6F3]">
                  <div className="text-[11px] text-[#9E9690]">Pending Verification</div>
                  <div className="font-semibold text-[14px] text-[#B8650A]">{pendingCount} contribution{pendingCount !== 1 ? 's' : ''}</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
              Quick Actions
            </div>
            <div className="space-y-2">

              {/* View Ledger — opens ledger modal */}
              <button
                onClick={() => setShowLedger(true)}
                className="w-full flex items-center gap-3 py-2.5 px-3 text-[13px] text-[#1C1814] border border-[#E8E4DF] rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition text-left font-medium group"
              >
               
                View Ledger
              </button>

              {/* Transaction History — opens slide-over */}
              <button
                onClick={() => setShowHistory(true)}
                className="w-full flex items-center gap-3 py-2.5 px-3 text-[13px] text-[#1C1814] border border-[#E8E4DF] rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition text-left font-medium group"
              >
                
                Transaction History
              </button>

              {/* Download statement */}
              <button
                onClick={() => {
                  window.open(`/api/chamas/${chamaId}/reports/member/${memberId}`, '_blank');
                }}
                className="w-full flex items-center gap-3 py-2.5 px-3 text-[13px] text-[#1C1814] border border-[#E8E4DF] rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition text-left font-medium group"
              >
          
                Download Statement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showLedger && (
        <LedgerModal
          chamaId={chamaId}
          memberId={memberId}
          memberName={userName}
          onClose={() => setShowLedger(false)}
        />
      )}
      {showHistory && (
        <TransactionHistoryModal
          contributions={contributions}
          memberName={userName}
          loading={false}
          onClose={() => setShowHistory(false)}
        />
      )}
    </AppLayout>
  );
}