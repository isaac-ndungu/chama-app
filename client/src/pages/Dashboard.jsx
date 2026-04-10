import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import CycleBanner from '../components/ui/CycleBanner';
import StatCard from '../components/dashboard/StatCard';
import ContributionFeed from '../components/dashboard/ContributionFeed';
import RotationQueue from '../components/dashboard/RotationQueue';
import AuditFeed from '../components/dashboard/AuditFeed';
import { useCycle } from '../hooks/useCycle';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

//  Role helpers 
const isOfficerRole = (role) => role === 'chairperson' || role === 'treasurer';

export default function Dashboard() {
  const { chamaId } = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [dashboard,  setDashboard]  = useState(null);
  const [contributions, setContribs] = useState([]);
  const [members,    setMembers]    = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [chama,      setChama]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [role,       setRole]       = useState('member');

  const {
    cycle, history,
    disburse, confirmReceipt, createNext,
    reload: reloadCycle,
  } = useCycle(chamaId);

  const [disbursing, setDisbursing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [starting,   setStarting]   = useState(false);

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
      setContribs(contribRes.data.contributions);
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

  // Poll contributions every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/chamas/${chamaId}/contributions`)
        .then(res => setContribs(res.data.contributions))
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [chamaId]);

  const isOfficer   = isOfficerRole(role);
  const isRecipient = cycle?.potRecipientId?._id === user?.id ||
                      cycle?.potRecipientId        === user?.id;

  const handleDisburse = async (cycleId, ref, amount) => {
    setDisbursing(true);
    try {
      await disburse(cycleId, ref, amount);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record disbursement');
    } finally {
      setDisbursing(false);
    }
  };

  const handleConfirmReceipt = async () => {
    setConfirming(true);
    try {
      await confirmReceipt(cycle._id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm receipt');
    } finally {
      setConfirming(false);
    }
  };

  const handleStartNext = async (startDate, endDate) => {
    setStarting(true);
    try {
      await createNext(startDate, endDate);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start cycle');
    } finally {
      setStarting(false);
    }
  };

  const dashCycle    = dashboard?.cycle;
  const pendingCount = dashboard?.pendingVerifications || 0;

  // Find current user's rotation position for the member stats card
  const myMembership = members.find(
    m => (m.userId?._id || m.userId) === user?.id
  );

  return (
    <AppLayout>
      {/* Page title */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814] leading-tight">Dashboard</h1>
          {cycle && (
            <p className="text-sm text-[#9E9690] mt-0.5">
              Cycle {cycle.cycleNumber} —{' '}
              {cycle.startDate
                ? new Date(cycle.startDate).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                : '—'}{' '}
              to{' '}
              {cycle.endDate
                ? new Date(cycle.endDate).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                : '—'}
            </p>
          )}
        </div>
        {isOfficer && (
          <button
            onClick={() => navigate(`/chamas/${chamaId}/contributions/new`)}
            className="bg-amber-600 text-white px-5 h-10 rounded-lg font-semibold text-sm hover:bg-amber-700 transition flex items-center gap-2"
          >
            + Record Contribution
          </button>
        )}
      </div>

      {/*  ROSCA Cycle Banner  */}
      <CycleBanner
        cycle={cycle}
        history={history}
        members={members}
        chama={chama}
        isOfficer={isOfficer}
        isRecipient={isRecipient}
        onDisburse={handleDisburse}
        onConfirmReceipt={handleConfirmReceipt}
        onStartNext={handleStartNext}
        disbursing={disbursing}
        confirming={confirming}
        starting={starting}
      />

      {/*  Stat cards  */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {isOfficer ? (
          <>
            <StatCard
              label="Contributions"
              value={loading ? '...' : fmt(dashCycle?.totalCollected)}
              sub={loading ? '' : `Cycle ${cycle?.cycleNumber} · ${dashCycle?.paidCount || 0} of ${chama?.memberCount || 0} paid`}
              trend={`↑ ${contributions.filter(c => c.status === 'verified').length} verified`}
              trendType="up"
            />
            <StatCard
              label="Pending Verify"
              value={loading ? '...' : pendingCount}
              sub="Awaiting second signature"
              trend={pendingCount > 0 ? 'Action required' : 'All clear ✓'}
              trendType={pendingCount > 0 ? 'down' : 'up'}
              valueColor={pendingCount > 0 ? 'text-[#B8650A]' : undefined}
            />
            <StatCard
              label="Active Loans"
              value={loading ? '...' : dashboard?.activeLoansCount || 0}
              sub={dashboard?.totalOutstandingLoans
                ? `${fmt(dashboard.totalOutstandingLoans)} outstanding`
                : 'No outstanding loans'}
              trend={dashboard?.overdueLoans > 0
                ? `${dashboard.overdueLoans} overdue`
                : undefined}
              trendType="down"
            />
            <StatCard
              label="In Arrears"
              value={loading ? '...' : dashboard?.membersInArrears || 0}
              sub={dashboard?.membersInArrears > 0
                ? 'Members behind on payments'
                : 'All members up to date'}
              valueColor={dashboard?.membersInArrears > 0 ? 'text-[#C0392B]' : undefined}
              trend={dashboard?.membersInArrears > 0 ? '↑ Action needed' : undefined}
              trendType="bad"
            />
          </>
        ) : (
          <>
            <StatCard
              label="My Contributions"
              value={loading ? '...' : fmt(dashboard?.myLedger?.totalContributed)}
              sub="Total paid to date"
              trendType="up"
            />
            <StatCard
              label="My Balance"
              value={loading ? '...' : fmt(Math.abs(dashboard?.myLedger?.balance || 0))}
              sub={dashboard?.myLedger?.balance > 0 ? 'In arrears' : 'Up to date ✓'}
              valueColor={dashboard?.myLedger?.balance > 0 ? 'text-[#C0392B]' : 'text-[#2A7A4B]'}
            />
            <StatCard
              label="Cycle Progress"
              value={loading ? '...' : `${dashCycle?.collectionRate || 0}%`}
              sub={`${fmt(dashCycle?.totalCollected)} collected`}
            />
            <StatCard
              label="My Pot Status"
              value={loading ? '...' : dashboard?.myLedger?.potReceived > 0
                ? '✓ Received'
                : 'Not yet'}
              sub={dashboard?.myLedger?.potReceived > 0
                ? fmt(dashboard.myLedger.potReceived)
                : myMembership?.rotationPosition
                  ? `Position ${myMembership.rotationPosition} in queue`
                  : 'In queue'}
              valueColor={dashboard?.myLedger?.potReceived > 0 ? 'text-[#2A7A4B]' : undefined}
            />
          </>
        )}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-[1fr_320px] gap-5">
        <ContributionFeed contributions={contributions} loading={loading} />
        <div className="flex flex-col gap-4">
          <RotationQueue
            members={members}
            history={history}
            cycle={cycle}
            contributionAmount={chama?.contributionAmount}
            loading={loading}
            compact={true}
          />
          <AuditFeed logs={auditLogs} loading={loading} />
        </div>
      </div>
    </AppLayout>
  );
}