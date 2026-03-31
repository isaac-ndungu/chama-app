import { useNavigate, useParams } from 'react-router-dom';

export default function AuditFeed({ logs = [], loading }) {
    const { chamaId } = useParams();
    const navigate = useNavigate();

    const ACTION_LABELS = {
        CONTRIBUTION_RECORDED: (l) => `recorded ${fmt(l.after?.amount)} · ${l.after?.memberId?.name || 'member'}`,
        CONTRIBUTION_VERIFIED: (l) => `verified ${fmt(l.after?.amount)} · ${l.after?.memberId?.name || 'member'}`,
        CONTRIBUTION_DISPUTED: (l) => `flagged a contribution as disputed`,
        LOAN_APPLIED: (l) => `submitted KSh ${fmt(l.after?.principalAmount)} loan application`,
        LOAN_APPROVED: (l) => `approved a loan`,
        LOAN_REJECTED: (l) => `rejected a loan`,
        LOAN_REPAYMENT_RECORDED: (l) => `recorded a loan repayment`,
        MEMBER_INVITED: (l) => `added ${l.after?.email || 'a new member'}`,
        CYCLE_CREATED: (l) => `created a new cycle`,
        CHAMA_CREATED: (l) => `created the chama`,
    };

    function fmt(n) {
        if (!n) return '';
        return `KSh ${Number(n).toLocaleString('en-KE')}`;
    }

    function label(log) {
        const fn = ACTION_LABELS[log.action];
        return fn ? fn(log) : log.action?.replace(/_/g, ' ').toLowerCase();
    }

    return (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
                Recent Audit
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 bg-[#E8E4DF] rounded animate-pulse" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <p className="text-xs text-[#9E9690]">No activity yet</p>
            ) : (
                <div className="space-y-0">
                    {logs.slice(0, 4).map((log, i) => (
                        <div
                            key={log._id || i}
                            className="py-2.5 border-b border-[#E8E4DF] last:border-0 text-xs text-[#6B6560]"
                        >
                            <span className="text-[#7A4D08] font-semibold">
                                {log.actorId?.name?.split(' ')[0] || 'Someone'}{' '}
                            </span>
                            {label(log)}
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={() => navigate(`/chamas/${chamaId}/audit`)}
                className="mt-3 text-xs text-amber-600 hover:underline"
            >
                View full audit log →
            </button>
        </div>
    );
}