import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import MemberAvatar from '../components/dashboard/MemberAvatar';
import RoleBadge from '../components/ui/RoleBadge';
import StatusBadge from '../components/dashboard/StatusBadge';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function MemberProfile() {
  const { chamaId, memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMemberData = async () => {
      setLoading(true);
      try {
        // Fetch all members and find the specific one
        const membersRes = await api.get(`/chamas/${chamaId}/members`);
        const memberData = membersRes.data.members?.find(m => m.userId?._id === memberId);
        
        if (memberData) {
          setMember(memberData);
          
          // Fetch all contributions and filter for this member
          const contribRes = await api.get(`/chamas/${chamaId}/contributions`);
          const memberContributions = contribRes.data.contributions?.filter(c => c.memberId?._id === memberId) || [];
          setContributions(memberContributions);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load member profile');
      } finally {
        setLoading(false);
      }
    };

    loadMemberData();
  }, [chamaId, memberId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="h-8 bg-[#E8E4DF] rounded w-40 mb-2 animate-pulse" />
            <div className="h-4 bg-[#E8E4DF] rounded w-60 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_300px] gap-6">
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-7 animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-[#E8E4DF] rounded" />
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-[#E8E4DF] rounded" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!member) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-[#9E9690] mb-4">Member not found</p>
          <button
            onClick={() => navigate(`/chamas/${chamaId}/members`)}
            className="text-amber-600 hover:underline text-sm font-medium"
          >
            ← Back to Members
          </button>
        </div>
      </AppLayout>
    );
  }

  const userName = member.userId?.name || 'Unknown';
  const userEmail = member.userId?.email || '—';
  const userPhone = member.userId?.phone || '—';
  
  // Calculate balance from contributions
  const verifiedContributions = contributions.filter(c => c.status === 'verified');
  const totalPaid = verifiedContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalContributed = verifiedContributions.length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">{userName}</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">Member Profile</p>
        </div>
        <button
          onClick={() => navigate(`/chamas/${chamaId}/members`)}
          className="text-[13px] text-[#6B6560] border border-[#E8E4DF] h-9 px-4 rounded-lg hover:bg-[#F8F6F3] transition"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Member Info Card */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-7">
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[#E8E4DF]">
              <MemberAvatar name={userName} size="lg" />
              <div className="flex-1">
                <h2 className="font-semibold text-[18px] text-[#1C1814]">{userName}</h2>
                <p className="text-[13px] text-[#9E9690] mt-1">Position {member.rotationPosition || '—'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">Role</label>
                  <div className="mt-2">
                    <RoleBadge role={member.role} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">Status</label>
                  <div className="mt-2">
                    <StatusBadge status={member.status} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1.5">Email</label>
                <p className="text-[13px] text-[#1C1814]">{userEmail}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1.5">Phone</label>
                <p className="text-[13px] text-[#1C1814]">{userPhone}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1.5">Joined</label>
                <p className="text-[13px] text-[#1C1814]">{fmtDate(member.joinedAt)}</p>
              </div>
            </div>
          </div>

          {/* Contribution History */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-7">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-4 pb-3 border-b border-[#E8E4DF]">
              Contribution History
            </h3>

            {contributions.length === 0 ? (
              <p className="text-[13px] text-[#9E9690] text-center py-6">No contributions recorded</p>
            ) : (
              <div className="space-y-3">
                {contributions.slice(0, 10).map(c => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between p-3 bg-[#F8F6F3] rounded-lg"
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-[#1C1814]">{fmt(c.amount)}</p>
                      <p className="text-[11px] text-[#9E9690] mt-0.5">
                        {fmtDate(c.paymentDate)} · Ref: {c.mpesaRef}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
                {contributions.length > 10 && (
                  <p className="text-[12px] text-[#9E9690] text-center pt-2">
                    +{contributions.length - 10} more contributions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-4">
              Summary
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#9E9690]">Total Contributed</label>
                <p className="font-serif text-[20px] text-[#1C1814] mt-1">{fmt(totalPaid)}</p>
                <p className="text-[11px] text-[#9E9690] mt-0.5">{totalContributed} verified payments</p>
              </div>

              {contributions.length > 0 && (
                <div className="border-t border-[#E8E4DF] pt-4">
                  <label className="text-[11px] text-[#9E9690]">Contribution Status</label>
                  <p className="text-[13px] text-[#1C1814] mt-1">
                    {totalContributed} verified · {contributions.length - totalContributed} pending
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
              Actions
            </h3>
            <div className="space-y-2">
              
              <button className="w-full py-2 text-[12px] text-amber-600 border border-amber-400 rounded-lg hover:bg-amber-50 transition font-medium">
                View Ledger
              </button>
              <button className="w-full py-2 text-[12px] text-amber-600 border border-amber-400 rounded-lg hover:bg-amber-50 transition font-medium">
                Transaction History
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
