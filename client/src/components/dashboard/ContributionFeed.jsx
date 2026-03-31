import { useNavigate, useParams } from 'react-router-dom';
import MemberAvatar from './MemberAvatar';
import StatusBadge from './StatusBadge';

const fmt = (n) => `KSh ${Number(n).toLocaleString('en-KE')}`;

export default function ContributionFeed({ contributions = [], loading }) {
    const { chamaId } = useParams();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E8E4DF]">
                    <span className="font-bold text-sm text-[#1C1814]">Recents Contributions</span>
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="px-5 py-4 border-b border-[#E8E4DF] last:border-0 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E8E4DF]" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-[#E8E4DF] rounded w-32" />
                                <div className="h-2.5 bg-[#E8E4DF] rounded w-24" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E8E4DF] flex items-center justify-between">
                <span className="font-bold text-sm text-[#1C1814]">Recent Contributions</span>
                <button
                    onClick={() => navigate(`/chamas/${chamaId}/contributions`)}
                    className="text-xs text-amber-600 border border-amber-400 px-3 py-1 rounded hover:bg-amber-50 transition"
                >
                    View All →
                </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_120px_90px_100px_80px] px-4 pb-2 pt-3">
                {['Member', 'Amount', 'M-Pesa Ref', 'Date', 'Status', ''].map(h => (
                    <div key={h} className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9E9690]">
                        {h}
                    </div>
                ))}
            </div>

            {/* Rows */}
            {contributions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-sm text-[#9E9690]">No contributions recorded this cycle</p>
                </div>
            ) : (
                contributions.slice(0, 6).map(c => {
                    const name = c.memberId?.name || 'Unknown';
                    const isPending = c.status === 'pending_verification';
                    return (
                        <div
                            key={c._id}
                            className="grid grid-cols-[1fr_100px_120px_90px_100px_80px] items-center px-4 py-3.5 border-t border-[#E8E4DF] hover:bg-[#F8F6F3] transition"
                        >
                            {/* Member */}
                            <div className="flex items-center gap-2.5">
                                <MemberAvatar name={name} />
                                <div>
                                    <div className="font-semibold text-[13px] text-[#1C1814]">{name}</div>
                                    <div className="text-[11px] text-[#9E9690]">
                                        Pos. {c.memberId?.rotationPosition || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="font-bold text-[13px] font-serif">{fmt(c.amount)}</div>

                            {/* M-Pesa ref */}
                            <div className="font-mono text-[11px] text-[#9E9690]">{c.mpesaRef}</div>

                            {/* Date */}
                            <div className="text-[12px] text-[#6B6560]">
                                {c.paymentDate
                                    ? new Date(c.paymentDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '—'}
                            </div>

                            {/* Status */}
                            <div><StatusBadge status={c.status} /></div>

                            {/* Action */}
                            <div>
                                {isPending ? (
                                    <button
                                        onClick={() => navigate(`/chamas/${chamaId}/contributions`)}
                                        className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded font-semibold hover:bg-amber-700 transition"
                                    >
                                        Verify
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/chamas/${chamaId}/contributions`)}
                                        className="text-xs text-amber-600 border border-amber-400 px-3 py-1.5 rounded hover:bg-amber-50 transition"
                                    >
                                        View
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}