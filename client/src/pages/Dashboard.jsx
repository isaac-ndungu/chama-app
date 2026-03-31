import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import StatCard from '../components/dashboard/StatCard';
import ContributionFeed from '../components/dashboard/ContributionFeed';
import RotationQueue from '../components/dashboard/RotationQueue';
import AuditFeed from '../components/dashboard/AuditFeed';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

export default function Dashboard() {
  const { chamaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [chama, setChama] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('member');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, chamaRes, memberRes, contribRes, auditRes] = await Promise.all([
        api.get(`/chamas/${chamaId}/dashboard`),
        api.get(`/chamas/${chamaId}`),
        api.get(`/chamas/${chamaId}/members`),
        api.get(`/chamas/${chamaId}/contributions`),
        api.get(`/chamas/${chamaId}/audit?limit=5`),
      ]);
      setDashboard(dashRes.data);
      setChama({ ...chamaRes.data.chama, memberCount: chamaRes.data.memberCount });
      setRole(chamaRes.data.myRole);
      setMembers(memberRes.data.members);
      setContributions(contribRes.data.contributions);
      setAuditLogs(auditRes.data.logs);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You are not a member of this chama');
        navigate('/');
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [chamaId, navigate]);

  useEffect(() => { load(); }, [load]);

  // Poll for SSE updates every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/chamas/${chamaId}/contributions`)
        .then(res => setContributions(res.data.contributions))
        .catch(() => { });
    }, 20000);
    return () => clearInterval(interval);
  }, [chamaId]);

  const isOfficer = role === 'chairman' || role === 'treasurer';
  const cycle = dashboard?.cycle;
  const pendingCount = dashboard?.pendingVerifications || 0;
  const currentPosition = cycle?.currentPosition || 1;

  return (
    <div className="flex min-h-screen bg-[#F8F6F3]">
      <Sidebar />

      <div className="ml-55 flex-1 flex flex-col min-h-screen">
        <TopBar
          chama={chama}
          cycle={cycle}
          pendingCount={pendingCount}
        />

        <main className="p-7 max-w-[1100px]">
          {/* Page title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-[26px] text-[#1C1814] leading-tight">Dashibodi</h1>
              {cycle && (
                <p className="text-sm text-[#9E9690] mt-0.5">
                  Cycle {cycle.cycleNumber} — {cycle.startDate
                    ? new Date(cycle.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'} to {cycle.endDate
                      ? new Date(cycle.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                </p>
              )}
            </div>
            {isOfficer && (
              <button
                onClick={() => navigate(`/chamas/${chamaId}/contributions/new`)}
                className="bg-amber-600 text-white px-5 h-10 rounded-lg font-semibold text-sm hover:bg-amber-700 transition flex items-center gap-2"
              >
                + Rekodi Mchango
              </button>
            )}
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {isOfficer ? (
              <>
                <StatCard
                  label="MICHANGO / Contributions"
                  value={loading ? '...' : fmt(dashboard?.cycle?.totalCollected)}
                  sub={loading ? '' : `Cycle ${cycle?.cycleNumber} · ${dashboard?.cycle?.paidCount || 0} of ${chama?.memberCount || 0} paid`}
                  trend={`↑ ${contributions.filter(c => c.status === 'verified').length} verified`}
                  trendType="up"
                />
                <StatCard
                  label="INASUBIRI / Pending Verify"
                  value={loading ? '...' : pendingCount}
                  sub="Awaiting second signature"
                  trend={pendingCount > 0 ? 'Action required' : 'All clear ✓'}
                  trendType={pendingCount > 0 ? 'down' : 'up'}
                  valueColor={pendingCount > 0 ? 'text-[#B8650A]' : undefined}
                />
                <StatCard
                  label="MIKOPO / Active Loans"
                  value={loading ? '...' : dashboard?.activeLoansCount || 0}
                  sub={dashboard?.totalOutstandingLoans ? `${fmt(dashboard.totalOutstandingLoans)} outstanding` : 'No outstanding loans'}
                  trend={dashboard?.overdueLoans > 0 ? `${dashboard.overdueLoans} overdue` : undefined}
                  trendType="down"
                />
                <StatCard
                  label="DENI / In Arrears"
                  value={loading ? '...' : dashboard?.membersInArrears || 0}
                  sub={dashboard?.membersInArrears > 0 ? 'Members behind on payments' : 'All members up to date'}
                  valueColor={dashboard?.membersInArrears > 0 ? 'text-[#C0392B]' : undefined}
                  trend={dashboard?.membersInArrears > 0 ? '↑ Action needed' : undefined}
                  trendType="bad"
                />
              </>
            ) : (
              /* Member view — only personal stats */
              <>
                <StatCard
                  label="MY CONTRIBUTIONS"
                  value={loading ? '...' : fmt(dashboard?.myLedger?.totalContributed)}
                  sub="Total paid to date"
                  trendType="up"
                />
                <StatCard
                  label="MY BALANCE"
                  value={loading ? '...' : fmt(Math.abs(dashboard?.myLedger?.balance || 0))}
                  sub={dashboard?.myLedger?.balance > 0 ? 'In arrears' : 'Up to date ✓'}
                  valueColor={dashboard?.myLedger?.balance > 0 ? 'text-[#C0392B]' : 'text-[#2A7A4B]'}
                />
                <StatCard
                  label="CYCLE PROGRESS"
                  value={loading ? '...' : `${cycle?.collectionRate || 0}%`}
                  sub={`${fmt(cycle?.totalCollected)} collected`}
                />
                <StatCard
                  label="MY ACTIVE LOAN"
                  value={loading ? '...' : dashboard?.myActiveLoan ? fmt(dashboard.myActiveLoan.totalDue - dashboard.myActiveLoan.totalRepaid) : 'None'}
                  sub={dashboard?.myActiveLoan ? 'Remaining balance' : 'No active loan'}
                />
              </>
            )}
          </div>

          {/* ── Main content grid ── */}
          <div className="grid grid-cols-[1fr_320px] gap-5">
            {/* Contributions feed */}
            <ContributionFeed contributions={contributions} loading={loading} />

            {/* Right column */}
            <div className="flex flex-col gap-4">
              <RotationQueue
                members={members}
                currentPosition={currentPosition}
                contributionAmount={chama?.contributionAmount}
                loading={loading}
              />
              <AuditFeed logs={auditLogs} loading={loading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}