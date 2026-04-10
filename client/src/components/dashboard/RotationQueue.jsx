import MemberAvatar from './MemberAvatar';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDay = (d) => d
    ? new Date(d).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
    : '—';

export default function RotationQueue({
    members = [],
    history = [],
    cycle,
    contributionAmount = 0,
    memberCount = 0,
    rotationNumber = 1,
    loading,
    compact = true,
}) {
    if (loading) {
        return (
            <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
                    Rotation Queue
                </div>
                <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-9 bg-[#E8E4DF] rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const sorted = [...members].sort((a, b) => (a.rotationPosition || 99) - (b.rotationPosition || 99));
    const mc = memberCount || sorted.length;
    const potValue = contributionAmount * mc;

    // Build position → closed round map for the CURRENT rotation only
    const firstRoundInRotation = (rotationNumber - 1) * mc + 1;
    const lastRoundInRotation = rotationNumber * mc;

    const positionToRound = {};
    history
        .filter(c => c.status === 'closed' &&
            c.cycleNumber >= firstRoundInRotation &&
            c.cycleNumber <= lastRoundInRotation)
        .forEach(c => {
            positionToRound[c.potRecipientPosition] = c;
        });

    const currentPosition = cycle?.potRecipientPosition || null;
    const displayList = compact ? sorted.slice(0, 6) : sorted;

    return (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690]">
                        Rotation Queue
                    </div>
                    <div className="text-[10px] text-[#9E9690] mt-0.5">
                        Rotation {rotationNumber} ·{' '}
                        {Object.keys(positionToRound).length} of {mc} received
                    </div>
                </div>
            </div>

            {/* Rows */}
            <div className="space-y-1">
                {displayList.map((m) => {
                    const pos = m.rotationPosition;
                    const name = m.userId?.name || 'Unknown';
                    const round = positionToRound[pos];
                    const isDone = !!round;
                    const isCurrent = pos === currentPosition;
                    const isNext = !isDone && !isCurrent &&
                        pos === (currentPosition || 0) + 1;

                    return (
                        <div
                            key={m._id}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${isCurrent ? 'bg-[#FEF3E2]' : ''
                                }`}
                        >
                            {/* Position number */}
                            <span className={`text-[13px] w-6 shrink-0 font-serif text-center ${isCurrent ? 'text-amber-600 font-bold' :
                                    isDone ? 'text-[#9E9690]' :
                                        'text-[#C8C4BE]'
                                }`}>
                                {pos}
                            </span>

                            {/* Avatar */}
                            <MemberAvatar name={name} size="sm" />

                            {/* Name + detail */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-[12px] font-medium truncate ${isDone ? 'text-[#9E9690] line-through' :
                                        isCurrent ? 'text-[#7A4D08] font-bold' :
                                            'text-[#1C1814]'
                                    }`}>
                                    {name.split(' ')[0]} {name.split(' ')[1]?.[0]}.
                                </div>
                                {isDone && !compact && (
                                    <div className="text-[10px] text-[#9E9690]">
                                        Received {fmt(round.actualAmount)} · {fmtDay(round.recipientConfirmedAt)}
                                    </div>
                                )}
                                {isNext && !compact && (
                                    <div className="text-[10px] text-amber-600">Next up</div>
                                )}
                            </div>

                            {/* Badge */}
                            {isDone && (
                                <span className="text-[9px] font-bold text-[#2A7A4B] bg-[#EAF5EE] px-1.5 py-0.5 rounded shrink-0">
                                    ✓
                                </span>
                            )}
                            {isCurrent && (
                                <span className="text-[9px] font-bold text-[#B8650A] bg-[#FEF3E2] px-1.5 py-0.5 rounded shrink-0">
                                    Now
                                </span>
                            )}
                        </div>
                    );
                })}

                {compact && sorted.length > 6 && (
                    <div className="text-center pt-1 text-[11px] text-[#9E9690]">
                        + {sorted.length - 6} more members
                    </div>
                )}
            </div>

            {/* Pot value */}
            {contributionAmount > 0 && mc > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E8E4DF] bg-[#F8F6F3] rounded-lg p-3 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-[#9E9690] mb-0.5">
                        Pot value per round
                    </div>
                    <div className="font-serif text-[20px] text-[#1C1814]">{fmt(potValue)}</div>
                    <div className="text-[10px] text-[#9E9690] mt-0.5">
                        {mc} members × {fmt(contributionAmount)}
                    </div>
                </div>
            )}
        </div>
    );
}