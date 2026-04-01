import StatusBadge from '../dashboard/StatusBadge';

const fmt    = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function TransactionHistoryModal({ contributions = [], memberName, loading, onClose }) {
  const verified = contributions.filter(c => c.status === 'verified');
  const total    = verified.reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-end" onClick={onClose}>
      {/* Slide-over panel */}
      <div
        className="bg-white h-full w-full max-w-[480px] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1C1814] px-6 py-5 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">Transaction History</div>
            <div className="font-serif text-[20px] text-white">{memberName}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition p-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        {/* Summary strip */}
        <div className="bg-[#FEF3E2] px-6 py-3 border-b border-[#E8E4DF] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">Total Verified</div>
              <div className="font-serif text-[20px] text-[#7A4D08]">{fmt(total)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">Transactions</div>
              <div className="font-serif text-[20px] text-[#1C1814]">{contributions.length}</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-[#F8F6F3] animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-3 bg-[#E8E4DF] rounded w-24" />
                    <div className="h-2.5 bg-[#E8E4DF] rounded w-36" />
                  </div>
                  <div className="h-3 bg-[#E8E4DF] rounded w-16" />
                </div>
              ))}
            </div>
          ) : contributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#9E9690]">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm">No transactions recorded yet</p>
            </div>
          ) : (
            contributions.map((c, i) => (
              <div
                key={c._id || i}
                className="flex items-center justify-between px-6 py-4 border-b border-[#F8F6F3] hover:bg-[#F8F6F3] transition"
              >
                <div className="flex items-center gap-3">
                  {/* Cycle indicator dot */}
                  <div className="w-8 h-8 rounded-full bg-[#F8F6F3] border border-[#E8E4DF] flex items-center justify-center text-[10px] font-bold text-[#9E9690] flex-shrink-0">
                    C{c.cycleId?.cycleNumber || '—'}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-[#1C1814]">{fmt(c.amount)}</div>
                    <div className="text-[11px] text-[#9E9690] mt-0.5">
                      {fmtDay(c.paymentDate)}
                      {c.mpesaRef && <span className="font-mono ml-1.5">· {c.mpesaRef}</span>}
                    </div>
                    {c.verifiedBy?.name && (
                      <div className="text-[10px] text-[#9E9690] mt-0.5">
                        Verified by {c.verifiedBy.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DF] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-10 border border-[#E8E4DF] text-[#6B6560] rounded-lg text-[13px] font-semibold hover:bg-[#F8F6F3] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}