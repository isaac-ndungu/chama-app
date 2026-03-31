import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import MemberAvatar from '../components/dashboard/MemberAvatar';
import StatusBadge from '../components/dashboard/StatusBadge';
import RoleBadge from '../components/ui/RoleBadge';
import RotationQueue from '../components/dashboard/RotationQueue';
import { useChama } from '../hooks/useChama';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

export default function Members() {
  const { chamaId } = useParams();
  const navigate = useNavigate();
  const { chama, can, memberCount } = useChama(chamaId);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    api.get(`/chamas/${chamaId}/members`)
      .then(res => setMembers(res.data.members))
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false));
  }, [chamaId]);

  const filtered = members.filter(m =>
    !search || m.userId?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = showAll ? filtered : filtered.slice(0, 5);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post(`/chamas/${chamaId}/members`, { email: inviteEmail, role: inviteRole });
      toast.success('Member invited successfully');
      setInviteEmail('');
      setShowInvite(false);
      const res = await api.get(`/chamas/${chamaId}/members`);
      setMembers(res.data.members);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  // Current pot recipient position (assume cycle 3 = position 3 for demo)
  const currentPosition = 3;

  return (
    <AppLayout>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">Members</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">
            {memberCount} active members · {chama?.name}
          </p>
        </div>
        {can('manage_members') && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-amber-600 text-white h-10 px-5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
          >
            + Add Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        {/* Member table */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden">
          {/* Table title + search */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DF]">
            <span className="font-bold text-[14px] text-[#1C1814]">Member Directory</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-8 px-3 border border-[#E8E4DF] rounded-lg text-[12px] bg-[#F8F6F3] focus:outline-none focus:border-amber-500 w-[180px]"
            />
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[44px_1fr_130px_130px_160px_90px] px-5 py-2.5 border-b border-[#E8E4DF]">
            {['#', 'Member', 'Role', 'Cycle Status', 'Phone', ''].map(h => (
              <div key={h} className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9E9690]">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="grid grid-cols-[44px_1fr_130px_130px_160px_90px] px-5 py-4 border-b border-[#E8E4DF] last:border-0 animate-pulse">
                <div className="h-3 bg-[#E8E4DF] rounded" />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E8E4DF]" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-[#E8E4DF] rounded w-28" />
                    <div className="h-2.5 bg-[#E8E4DF] rounded w-20" />
                  </div>
                </div>
                {[1, 2, 3, 4].map(j => <div key={j} className="h-3 bg-[#E8E4DF] rounded self-center" />)}
              </div>
            ))
          ) : (
            displayed.map(m => (
              <div
                key={m._id}
                className="grid grid-cols-[44px_1fr_130px_130px_160px_90px] px-5 py-4 border-b border-[#E8E4DF] last:border-0 hover:bg-[#F8F6F3] transition items-center cursor-pointer"
                onClick={() => navigate(`/chamas/${chamaId}/members/${m.userId?._id}`)}
              >
                {/* Position number */}
                <div className="font-serif text-[22px] text-[#E8E4DF] leading-none">
                  {m.rotationPosition}
                </div>

                {/* Member info */}
                <div className="flex items-center gap-3">
                  <MemberAvatar name={m.userId?.name} size="md" />
                  <div>
                    <div className="font-semibold text-[13px] text-[#1C1814]">{m.userId?.name}</div>
                    <div className="text-[11px] text-[#9E9690]">
                      Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div><RoleBadge role={m.role} /></div>

                {/* Cycle status - derived from contributions */}
                <div>
                  <StatusBadge status={m.cycleStatus || 'pending'} />
                </div>

                {/* Phone */}
                <div className="text-[12px] text-[#6B6560]">{m.userId?.phone || '—'}</div>

                {/* Profile button */}
                <div onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/chamas/${chamaId}/members/${m.userId?._id}`)}
                    className="text-[12px] text-amber-600 border border-amber-400 px-3 h-8 rounded-lg hover:bg-amber-50 transition"
                  >
                    Profile
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Show all toggle */}
          {filtered.length > 5 && (
            <div className="px-5 py-3 border-t border-[#E8E4DF] text-[13px] text-[#9E9690]">
              Showing {displayed.length} of {filtered.length} ·{' '}
              <button
                onClick={() => setShowAll(v => !v)}
                className="text-amber-600 font-medium hover:underline"
              >
                {showAll ? 'Show less' : 'Show all'}
              </button>
            </div>
          )}
        </div>

        {/* Rotation queue + pot value */}
        <RotationQueue
          members={members}
          currentPosition={currentPosition}
          contributionAmount={chama?.contributionAmount || 0}
          loading={loading}
        />
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-[17px] text-[#1C1814] mb-1">Invite New Member</h2>
            <p className="text-[13px] text-[#9E9690] mb-5">The user must have a ChamaLedger account first</p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  placeholder="member@example.com"
                  className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500"
                >
                  <option value="member">Member</option>
                  <option value="treasurer">Treasurer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 h-10 bg-amber-600 text-white rounded-lg font-semibold text-[13px] hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {inviting ? 'Inviting...' : 'Send Invitation'}
                </button>
                <button type="button" onClick={() => setShowInvite(false)} className="px-5 border border-[#E8E4DF] text-[#6B6560] h-10 rounded-lg text-[13px] hover:bg-[#F8F6F3] transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}