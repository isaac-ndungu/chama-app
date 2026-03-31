import MemberAvatar from './MemberAvatar';

const fmt = (n) => `KSh ${Number(n).toLocaleString('en-KE')}`;

export default function RotationQueue({ members = [], currentPosition = 1, contributionAmount = 0, loading }) {
    if (loading) {
        return (
            <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
                    Mzunguko / Rotation Queue
                </div>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-[#E8E4DF] rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const sorted = [...members].sort((a, b) => a.rotationPosition - b.rotationPosition);

    return (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
                Mzunguko / Rotation Queue
            </div>

            <div className="space-y-1">
                {sorted.map((m) => {
                    const pos = m.rotationPosition;
                    const name = m.userId?.name || 'Unknown';
                    const isDone = pos < currentPosition;
                    const isCurrent = pos === currentPosition;

                    return (
                        <div
                            key={m._id}
                            className={`flex items-center gap-2.5 px-2 py-2 rounded-md transition ${isCurrent
                                    ? 'bg-[#FEF3E2]'
                                    : isDone
                                        ? ''
                                        : ''
                                }`}
                        >
                            {/* Position number */}
                            <span
                                className={`text-sm w-5 shrink-0 font-serif ${isCurrent ? 'text-amber-600 font-bold' : 'text-[#9E9690]'
                                    }`}
                            >
                                {pos}
                            </span>

                            {/* Avatar */}
                            <MemberAvatar name={name} size="sm" />

                            {/* Name */}
                            <span
                                className={`text-xs flex-1 truncate font-medium ${isDone
                                        ? 'text-[#9E9690] line-through'
                                        : isCurrent
                                            ? 'text-[#7A4D08] font-bold'
                                            : 'text-[#1C1814]'
                                    }`}
                            >
                                {name?.split(' ')[0]} {name?.split(' ')[1]?.[0]}.
                            </span>

                            {/* Status */}
                            {isDone && (
                                <span className="text-[9px] font-bold text-[#2A7A4B] bg-[#EAF5EE] px-1.5 py-0.5 rounded">
                                    Done
                                </span>
                            )}
                            {isCurrent && (
                                <span className="text-[9px] font-bold text-[#B8650A] bg-[#FEF3E2] px-1.5 py-0.5 rounded">
                                    Current
                                </span>
                            )}
                            {!isDone && !isCurrent && (
                                <span className="text-[9px] text-[#9E9690]">
                                    {/* future date placeholder */}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pot value */}
            {contributionAmount > 0 && members.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E8E4DF] bg-[#F8F6F3] rounded-lg p-3 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-[#9E9690] mb-1">
                        Pot value this cycle
                    </div>
                    <div className="font-serif text-xl text-[#1C1814]">
                        {fmt(contributionAmount * members.length)}
                    </div>
                    <div className="text-[10px] text-[#9E9690] mt-0.5">
                        {members.length} members × {fmt(contributionAmount)}
                    </div>
                </div>
            )}
        </div>
    );
}