import { useState } from 'react';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function VerifyModal({ contribution, onConfirm, onClose, loading }) {
  if (!contribution) return null;

  return (
    <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-[17px] text-[#1C1814] mb-2">Verify this contribution?</h2>
        <p className="text-[13px] text-[#6B6560] leading-relaxed mb-4">
          You are confirming that <strong className="text-[#1C1814]">{contribution.memberId?.name}</strong> paid
          their contribution. This action will be recorded in the audit log under your name and cannot be undone.
        </p>

        {/* Amount box */}
        <div className="bg-[#FEF3E2] rounded-lg px-4 py-3 mb-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">
            Amount Being Verified
          </div>
          <div className="font-serif text-[22px] text-[#7A4D08]">{fmt(contribution.amount)}</div>
          <div className="text-[11px] text-[#9E9690] mt-1">
            M-Pesa ref: <span className="font-mono">{contribution.mpesaRef}</span>
            {' · '}{fmtDate(contribution.paymentDate)}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 h-9 border border-[#E8E4DF] text-[#6B6560] rounded-lg text-[13px] font-semibold hover:bg-[#F8F6F3] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 h-9 bg-amber-600 text-white rounded-lg text-[13px] font-semibold hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {loading ? 'Verifying...' : 'Confirm Verification'}
          </button>
        </div>
      </div>
    </div>
  );
}