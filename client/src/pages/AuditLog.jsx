import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { fetchAuditLog, exportAuditPDF } from '../api/audit';
import toast from 'react-hot-toast';

const fmtDateTime = (d) => {
  if (!d) return { date: '—', time: '' };
  const dt = new Date(d);
  return {
    date: dt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  };
};

const fmt = (n) => n ? `KSh ${Number(n).toLocaleString('en-KE')}` : '';

function formatEntry(log) {
  const actor = log.actorId?.name || 'Someone';
  const after = log.after || {};
  const before = log.before || {};

  const map = {
    CONTRIBUTION_RECORDED: () => ({
      action: `${actor} recorded a contribution`,
      detail: `${fmt(after.amount)} · Ref: ${after.mpesaRef} · Cycle ${after.cycleId?.cycleNumber || '—'}`,
    }),
    CONTRIBUTION_VERIFIED: () => ({
      action: `${actor} verified a contribution`,
      detail: `${fmt(after.amount)} for ${after.memberId?.name || '—'} · Ref: ${after.mpesaRef} · Cycle ${after.cycleId?.cycleNumber || '—'}`,
    }),
    CONTRIBUTION_DISPUTED: () => ({
      action: `${actor} flagged a contribution as disputed`,
      detail: after.disputeNote ? `Note: "${after.disputeNote}"` : '',
    }),
    CONTRIBUTION_REJECTED: () => ({
      action: `${actor} rejected a contribution`,
      detail: `Ref: ${after.mpesaRef || '—'}`,
    }),
    LOAN_APPLIED: () => ({
      action: `${actor} submitted a loan application`,
      detail: `${fmt(after.principalAmount)} · ${((after.interestRate || 0) * 100).toFixed(0)}% flat · ${after.durationMonths} months`,
    }),
    LOAN_APPROVED: () => ({
      action: `${actor} approved a loan application`,
      detail: `${fmt(after.principalAmount)} for ${after.borrowerId?.name || '—'} · Quorum reached: ${after.approvals?.length}/${after.quorumRequired}`,
    }),
    LOAN_REJECTED: () => ({
      action: `${actor} voted to reject a loan application`,
      detail: `${fmt(after.principalAmount)} for ${after.borrowerId?.name || '—'} · Reason: "${after.rejections?.slice(-1)[0]?.reason || '—'}"`,
    }),
    LOAN_REPAYMENT_RECORDED: () => ({
      action: `${actor} recorded a loan repayment`,
      detail: `${fmt(after.repayments?.slice(-1)[0]?.amount)} · Ref: ${after.repayments?.slice(-1)[0]?.mpesaRef || '—'}`,
    }),
    MEMBER_INVITED: () => ({
      action: `${actor} invited a new member`,
      detail: `${after.email || after.userId?.email || '—'} · Role: ${after.role} · Position ${after.rotationPosition || '—'}`,
    }),
    MEMBER_ROLE_CHANGED: () => ({
      action: `${actor} changed a member's role`,
      detail: `From ${before.role} → ${after.role}`,
    }),
    CYCLE_CREATED: () => ({
      action: `${actor} started a new cycle`,
      detail: `Cycle ${after.cycleNumber} — ${fmtDateTime(after.startDate).date} to ${fmtDateTime(after.endDate).date} · Pot recipient: ${after.potRecipientId?.name || '—'} (Position ${after.potRecipientPosition || '—'})`,
    }),
    // disbursement recorded by officer
    POT_DISBURSED: () => ({
      action: `${actor} recorded pot disbursement`,
      detail: `${fmt(after.disbursedAmount || after.actualAmount)} to ${after.potRecipientId?.name || '—'} · Ref: ${after.disbursementRef || '—'} · Cycle ${after.cycleNumber || '—'}`,
    }),
    //  recipient confirmed they received
    CYCLE_CLOSED: () => ({
      action: `${actor} confirmed receipt of the pot`,
      detail: `Cycle ${after.cycleNumber || '—'} is now closed · ${fmt(after.actualAmount)} received`,
    }),
    CHAMA_CREATED: () => ({
      action: `${actor} created the chama`,
      detail: after.name || '—',
    }),
  };

  const fn = map[log.action];
  if (fn) return fn();
  // Fallback — make any unknown action readable
  return {
    action: `${actor} ${log.action.replace(/_/g, ' ').toLowerCase()}`,
    detail: '',
  };
}

export default function AuditLog() {
  const { chamaId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '', action: '', member: '' });
  const LIMIT = 8;

  const load = useCallback(async (newSkip = 0, replace = true) => {
    setLoading(true);
    try {
      const params = {
        limit: LIMIT,
        skip: newSkip,
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
        ...(filters.action && { action: filters.action }),
        ...(filters.member && { member: filters.member }),
      };
      const res = await fetchAuditLog(chamaId, params);
      const newLogs = res.data.logs;
      setLogs(prev => replace ? newLogs : [...prev, ...newLogs]);
      setHasMore(newLogs.length === LIMIT);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [chamaId, filters]);

  useEffect(() => {
    setSkip(0);
    load(0, true);
  }, [load]);

  const loadMore = () => {
    const newSkip = skip + LIMIT;
    setSkip(newSkip);
    load(newSkip, false);
  };

  const handleExportPDF = async () => {
    try {
      await exportAuditPDF(chamaId, filters);
      toast.success('Audit log exported');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to export PDF');
    }
  };

  const ACTION_OPTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'CONTRIBUTION_RECORDED', label: 'Contributions' },
    { value: 'LOAN_APPLIED', label: 'Loans' },
    { value: 'MEMBER_INVITED', label: 'Members' },
    { value: 'CYCLE_CREATED', label: 'Cycles started' },
    { value: 'POT_DISBURSED', label: 'Disbursements' },
    { value: 'CYCLE_CLOSED', label: 'Cycles closed' },
  ];

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">Audit Log</h1>
          <p className="text-[13px] text-[#9E9690] mt-0.5">
            Permanent record — cannot be changed
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="text-[13px] text-amber-600 border border-amber-400 h-10 px-5 rounded-lg hover:bg-amber-50 transition font-semibold"
        >
          Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
          className="h-9 px-3 border border-[#E8E4DF] rounded-lg text-[13px] bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
          className="h-9 px-3 border border-[#E8E4DF] rounded-lg text-[13px] bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
        <select
          value={filters.action}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          className="h-9 px-3 border border-[#E8E4DF] rounded-lg text-[13px] bg-white focus:outline-none focus:border-amber-500"
        >
          {ACTION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          value={filters.member}
          onChange={e => setFilters(f => ({ ...f, member: e.target.value }))}
          placeholder="Filter by member..."
          className="h-9 px-3 border border-[#E8E4DF] rounded-lg text-[13px] bg-white focus:outline-none focus:border-amber-500 w-45"
        />
        <span className="ml-auto text-[13px] text-[#9E9690]">{total} total entries</span>
      </div>

      {/* Log entries */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden">
        {loading && logs.length === 0 ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-5 px-6 py-4 border-b border-[#E8E4DF] last:border-0 animate-pulse">
              <div className="space-y-1.5 min-w-26">
                <div className="h-2.5 bg-[#E8E4DF] rounded w-24" />
                <div className="h-2.5 bg-[#E8E4DF] rounded w-16" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#E8E4DF] rounded w-64" />
                <div className="h-2.5 bg-[#E8E4DF] rounded w-80" />
              </div>
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-[#9E9690] text-sm">No audit entries yet</div>
        ) : (
          logs.map((log, i) => {
            const { date, time } = fmtDateTime(log.createdAt);
            const { action, detail } = formatEntry(log);
            const actorName = log.actorId?.name || 'Someone';
            const withoutActor = action.replace(actorName, '').trim();

            // Highlight ROSCA payout actions
            const isPayoutAction = log.action === 'POT_DISBURSED' || log.action === 'CYCLE_CLOSED';

            return (
              <div
                key={log._id || i}
                className={`flex gap-5 px-6 py-4 border-b border-[#E8E4DF] last:border-0 ${isPayoutAction ? 'bg-[#FEF3E2]/40' : ''
                  }`}
              >
                {/* Timestamp */}
                <div className="min-w-26 shrink-0">
                  <div className="font-mono text-[11px] text-[#9E9690] leading-tight">{date}</div>
                  <div className="font-mono text-[11px] text-[#9E9690] leading-tight">{time}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#1C1814]">
                    <span className="font-bold text-[#7A4D08]">{actorName}</span>
                    {' '}{withoutActor}
                  </div>
                  {detail && (
                    <div className="text-[12px] text-[#6B6560] mt-0.5">{detail}</div>
                  )}
                </div>

                {/* Payout badge */}
                {isPayoutAction && (
                  <div className="shrink-0 self-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {log.action === 'POT_DISBURSED' ? 'Pot Sent' : 'Confirmed'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center py-4 border-t border-[#E8E4DF]">
            <span className="text-[13px] text-[#9E9690]">
              Showing {logs.length} of {total} entries ·{' '}
            </span>
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-[13px] text-amber-600 font-medium hover:underline disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}