import StatusBadge from '../dashboard/StatusBadge';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDt = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Capitalises first letter of any role string
const formatRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
};

function Row({ label, children }) {
    return (
        <div className="flex justify-between items-start py-3 border-b border-[#F8F6F3] last:border-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9690] flex-shrink-0 w-36">
                {label}
            </span>
            <span className="text-[13px] text-[#1C1814] text-right flex-1">{children}</span>
        </div>
    );
}

export default function ContributionDetailModal({ contribution, members = [], onClose }) {
    if (!contribution) return null;

    const c = contribution;
    const isVerified = c.status === 'verified';
    const isPending = c.status === 'pending_verification';
    const isDisputed = c.status === 'disputed';

    // Look up a user's chama role from the members list since
    // recordedBy/verifiedBy are populated from User which has no role field
    const getMemberRole = (userId) => {
        if (!userId) return '';
        const id = userId?._id || userId;
        const match = members.find(m => {
            const uid = m.userId?._id || m.userId;
            return uid?.toString() === id?.toString();
        });
        return match?.role || '';
    };

    const recorderRole = getMemberRole(c.recordedBy);
    const verifierRole = getMemberRole(c.verifiedBy);

    return (
        <div
            className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header strip */}
                <div className="bg-[#1C1814] px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">
                                Contribution Receipt
                            </div>
                            <div className="font-serif text-[32px] text-white leading-none">
                                {fmt(c.amount)}
                            </div>
                        </div>
                        <StatusBadge status={c.status} />
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4">

                    {/* Member */}
                    <div className="mb-4 pb-4 border-b border-[#F8F6F3]">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">Member</div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FEF3E2] flex items-center justify-center text-[#7A4D08] font-bold text-sm flex-shrink-0">
                                {c.memberId?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                                <div className="font-semibold text-[14px] text-[#1C1814]">{c.memberId?.name || '—'}</div>
                                {c.memberId?.rotationPosition && (
                                    <div className="text-[11px] text-[#9E9690]">Position {c.memberId.rotationPosition} in rotation</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="mb-4">
                        <Row label="M-Pesa Reference">
                            <span className="font-mono text-[12px] bg-[#F8F6F3] px-2 py-0.5 rounded">
                                {c.mpesaRef || '—'}
                            </span>
                        </Row>
                        <Row label="Payment Date">{fmtDay(c.paymentDate)}</Row>
                        <Row label="Recorded By">
                            {c.recordedBy?.name
                                ? `${c.recordedBy.name}${recorderRole ? ` (${formatRole(recorderRole)})` : ''}`
                                : '—'}
                        </Row>
                        <Row label="Recorded At">{fmtDt(c.recordedAt || c.createdAt)}</Row>

                        {isVerified && (
                            <>
                                <Row label="Verified By">
                                    {c.verifiedBy?.name
                                        ? `${c.verifiedBy.name}${verifierRole ? ` (${formatRole(verifierRole)})` : ''}`
                                        : '—'}
                                </Row>
                                <Row label="Verified At">{fmtDt(c.verifiedAt)}</Row>
                            </>
                        )}

                        {isDisputed && c.disputeNote && (
                            <Row label="Dispute Note">
                                <span className="text-[#C0392B]">{c.disputeNote}</span>
                            </Row>
                        )}
                    </div>

                    {/* Status notes */}
                    {isPending && (
                        <div className="bg-[#FEF3E2] border border-[rgba(184,101,10,0.2)] rounded-lg px-4 py-3 mb-4 text-[12px] text-[#B8650A]">
                            ⏳ This contribution is awaiting verification by a second officer.
                            It will not count toward financial totals until confirmed.
                        </div>
                    )}
                    {isVerified && (
                        <div className="bg-[#EAF5EE] border border-[rgba(42,122,75,0.2)] rounded-lg px-4 py-3 mb-4 text-[12px] text-[#2A7A4B]">
                            ✓ This contribution has been verified and is included in the group ledger.
                        </div>
                    )}
                    {isDisputed && (
                        <div className="bg-[#FFF0EF] border border-[rgba(192,57,43,0.2)] rounded-lg px-4 py-3 mb-4 text-[12px] text-[#C0392B]">
                            ⚠ This contribution has been flagged as disputed and requires officer review.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 h-10 border border-[#E8E4DF] text-[#6B6560] rounded-lg text-[13px] font-semibold hover:bg-[#F8F6F3] transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            const text = [
                                `CONTRIBUTION RECEIPT`,
                                `Member: ${c.memberId?.name}`,
                                `Amount: ${fmt(c.amount)}`,
                                `M-Pesa Ref: ${c.mpesaRef}`,
                                `Date: ${fmtDay(c.paymentDate)}`,
                                `Status: ${c.status}`,
                                `Recorded by: ${c.recordedBy?.name}${recorderRole ? ` (${formatRole(recorderRole)})` : ''}`,
                                isVerified ? `Verified by: ${c.verifiedBy?.name}${verifierRole ? ` (${formatRole(verifierRole)})` : ''}` : '',
                            ].filter(Boolean).join('\n');
                            navigator.clipboard.writeText(text);
                        }}
                        className="flex-1 h-10 bg-amber-600 text-white rounded-lg text-[13px] font-semibold hover:bg-amber-700 transition"
                    >
                        Copy Receipt
                    </button>
                </div>
            </div>
        </div>
    );
}