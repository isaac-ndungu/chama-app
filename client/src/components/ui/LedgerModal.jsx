import { useState, useEffect } from 'react';
import api from '../../api/axios';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

export default function LedgerModal({ chamaId, memberId, memberName, onClose }) {
    const [ledger, setLedger] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/chamas/${chamaId}/ledger/${memberId}`)
            .then(res => setLedger(res.data.ledger || res.data))
            .catch(() => setLedger(null))
            .finally(() => setLoading(false));
    }, [chamaId, memberId]);

    const balance = ledger?.balance || 0;
    const isArrears = balance > 0;

    return (
        <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-[#1C1814] px-6 py-5">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">Member Ledger</div>
                    <div className="font-serif text-[20px] text-white">{memberName}</div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-[#F8F6F3] rounded-lg" />)}
                        </div>
                    ) : !ledger ? (
                        <div className="text-center py-8 text-[#9E9690] text-sm">
                            No ledger data found for this member
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-[#F8F6F3] rounded-xl p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">Total Contributed</div>
                                <div className="font-serif text-[24px] text-[#2A7A4B]">{fmt(ledger.totalContributed)}</div>
                            </div>

                            <div className="bg-[#F8F6F3] rounded-xl p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">Total Owed</div>
                                <div className="font-serif text-[24px] text-[#1C1814]">{fmt(ledger.totalOwed)}</div>
                                <div className="text-[11px] text-[#9E9690] mt-0.5">Based on active cycles since joining</div>
                            </div>

                            <div className={`rounded-xl p-4 ${isArrears ? 'bg-[#FFF0EF]' : 'bg-[#EAF5EE]'}`}>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">Balance</div>
                                <div className={`font-serif text-[24px] ${isArrears ? 'text-[#C0392B]' : 'text-[#2A7A4B]'}`}>
                                    {isArrears ? fmt(balance) : 'KSh 0'}
                                </div>
                                <div className={`text-[12px] font-semibold mt-0.5 ${isArrears ? 'text-[#C0392B]' : 'text-[#2A7A4B]'}`}>
                                    {isArrears ? '⚠ In arrears' : '✓ Up to date'}
                                </div>
                            </div>

                            {ledger.potReceived > 0 && (
                                <div className="bg-[#FEF3E2] rounded-xl p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-1">Pot Received</div>
                                    <div className="font-serif text-[22px] text-[#7A4D08]">{fmt(ledger.potReceived)}</div>
                                </div>
                            )}

                            <div className="text-[11px] text-[#9E9690] text-center pt-1">
                                Last updated: {ledger.lastUpdated ? new Date(ledger.lastUpdated).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-5">
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