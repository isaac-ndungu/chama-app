import { useState } from 'react';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

export default function DisbursementModal({ cycle, onConfirm, onClose, loading }) {
    const [ref, setRef] = useState('');
    const [amount, setAmount] = useState(cycle?.actualAmount || cycle?.expectedAmount || '');
    const [refError, setRefError] = useState('');

    if (!cycle) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!/^[A-Z0-9]{8,12}$/.test(ref.trim())) {
            setRefError('Enter a valid M-Pesa reference (8–12 characters)');
            return;
        }
        const parsed = parseInt(amount, 10);
        if (!parsed || parsed <= 0) return;
        onConfirm(ref.trim(), parsed);
    };

    return (
        <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-110 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-[#1C1814] px-6 py-5">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">
                        Record Pot Disbursement
                    </div>
                    <div className="font-serif text-[20px] text-white">
                        Cycle {cycle.cycleNumber} — {cycle.potRecipientId?.name}
                    </div>
                    <div className="text-[12px] text-white/50 mt-0.5">
                        Position {cycle.potRecipientPosition} in rotation
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <div className="bg-[#FEF3E2] rounded-xl px-4 py-3 mb-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">
                            Pot being disbursed to
                        </div>
                        <div className="font-semibold text-[15px] text-[#1C1814]">
                            {cycle.potRecipientId?.name}
                        </div>
                        <div className="text-[12px] text-[#9E9690] mt-0.5">
                            Expected: {fmt(cycle.expectedAmount)} · Actual collected: {fmt(cycle.actualAmount)}
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-[12px] text-[#B8650A]">
                        ℹ After you record this, <strong>{cycle.potRecipientId?.name}</strong> will need to
                        confirm they received the money. The cycle will not close until they confirm.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">
                                Amount Disbursed (KSh) *
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                min="1"
                                step="1"
                                required
                                className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                            <p className="text-[11px] text-[#9E9690] mt-1">
                                Pre-filled with total collected — adjust if partial disbursement
                            </p>
                        </div>

                        <div>
                            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">
                                M-Pesa Reference *
                            </label>
                            <input
                                value={ref}
                                onChange={e => { setRef(e.target.value.toUpperCase()); setRefError(''); }}
                                placeholder="QJK7X3AB1C"
                                maxLength={12}
                                required
                                className={`w-full h-10 px-3 border rounded-lg text-[13px] font-mono tracking-wide focus:outline-none focus:ring-2 ${refError
                                        ? 'border-[#C0392B] focus:ring-red-500/20'
                                        : 'border-[#E8E4DF] focus:border-amber-500 focus:ring-amber-500/20'
                                    }`}
                            />
                            {refError && (
                                <p className="text-[11px] text-[#C0392B] mt-1">⚠ {refError}</p>
                            )}
                            <p className="text-[11px] text-[#9E9690] mt-1">
                                The M-Pesa confirmation code from the transfer to {cycle.potRecipientId?.name}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-10 bg-amber-600 text-white rounded-lg font-semibold text-[13px] hover:bg-amber-700 disabled:opacity-50 transition"
                            >
                                {loading ? 'Recording...' : 'Record Disbursement'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 border border-[#E8E4DF] text-[#6B6560] h-10 rounded-lg text-[13px] hover:bg-[#F8F6F3] transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}