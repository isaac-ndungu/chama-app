import StatusBadge from '../dashboard/StatusBadge';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Capitalises any role string rather than hardcoding specific values
const roleLabel = (role) => {
  if (!role) return 'Officer';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export default function ContributionReceipt({ contribution, recorderName, recorderRole, onRecordAnother, onViewAll, onClose }) {
  if (!contribution) return null;

  return (
    <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-100 shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-[#EAF5EE] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M5 10l3.5 3.5L15 7" stroke="#2A7A4B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-bold text-[17px] text-[#1C1814]">Contribution Recorded</h2>
        </div>

        {/* Receipt card */}
        <div className="bg-[#FEF3E2] border border-[rgba(193,123,15,0.25)] rounded-xl px-5 py-4 mb-5">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#7A4D08] mb-1">
            Contribution Recorded
          </div>
          <div className="font-serif text-[28px] text-[#1C1814] mb-3">
            {fmt(contribution.amount)}
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-y-1.5 text-[12px]">
            <span className="text-[#9E9690]">Member</span>
            <span className="font-semibold text-[#1C1814]">{contribution.memberId?.name || '—'}</span>

            <span className="text-[#9E9690]">M-Pesa Ref</span>
            <span className="font-mono text-[11px] text-[#1C1814]">{contribution.mpesaRef}</span>

            <span className="text-[#9E9690]">Date</span>
            <span className="text-[#1C1814]">{fmtDate(contribution.paymentDate)}</span>

            <span className="text-[#9E9690]">Recorded by</span>
            {/* recorderRole is passed from the parent which has access to the members list */}
            <span className="text-[#1C1814]">
              {recorderName}{recorderRole ? ` (${roleLabel(recorderRole)})` : ''}
            </span>

            <span className="text-[#9E9690]">Status</span>
            <span><StatusBadge status="pending_verification" /></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={onRecordAnother}
            className="flex-1 h-9 bg-amber-600 text-white rounded-lg text-[13px] font-semibold hover:bg-amber-700 transition"
          >
            Record Another
          </button>
          <button
            onClick={() => { }}
            className="h-9 px-4 border border-[#E8E4DF] text-[#6B6560] rounded-lg text-[13px] font-semibold hover:bg-[#F8F6F3] transition"
          >
            Share Receipt
          </button>
          <button
            onClick={onViewAll}
            className="h-9 px-4 border border-[#E8E4DF] text-[#6B6560] rounded-lg text-[13px] font-semibold hover:bg-[#F8F6F3] transition"
          >
            View All
          </button>
        </div>
      </div>
    </div>
  );
}