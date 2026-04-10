import { useState } from 'react';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

// Shows who will receive next and lets officers set dates
export default function StartCycleModal({ nextRecipient, nextPosition, chama, memberCount, onConfirm, onClose, loading }) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(thirtyDaysLater);

    const potValue = (chama?.contributionAmount || 0) * (memberCount || 0);

    return (
        <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-105 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                <div className="bg-[#1C1814] px-6 py-5">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">
                        Start New Cycle
                    </div>
                    <div className="font-serif text-[20px] text-white">
                        {nextRecipient ? `${nextRecipient}'s turn` : 'Next cycle'}
                    </div>
                    <div className="text-[12px] text-white/50 mt-0.5">
                        Position {nextPosition} in rotation
                    </div>
                </div>

                <div className="px-6 py-5">
                    <div className="bg-[#FEF3E2] rounded-xl px-4 py-3 mb-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">
                            Pot Recipient
                        </div>
                        <div className="font-semibold text-[15px] text-[#1C1814]">
                            {nextRecipient || '—'}
                        </div>
                        <div className="text-[12px] text-[#9E9690] mt-0.5">
                            Will receive {fmt(potValue)} when all {memberCount} members contribute
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                min={startDate}
                                className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => onConfirm(startDate, endDate)}
                            disabled={loading}
                            className="flex-1 h-10 bg-amber-600 text-white rounded-lg font-semibold text-[13px] hover:bg-amber-700 disabled:opacity-50 transition"
                        >
                            {loading ? 'Starting...' : 'Start Cycle'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 border border-[#E8E4DF] text-[#6B6560] h-10 rounded-lg text-[13px] hover:bg-[#F8F6F3] transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}