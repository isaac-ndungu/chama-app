import { useState } from 'react';
import DisbursementModal from './DisbursementModal';
import StartCycleModal from './StartCycleModal';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDay = (d) => d
    ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

export default function CycleBanner({
    cycle,
    history = [],
    members = [],
    memberCount = 0,
    chama,
    isOfficer,
    isRecipient,
    rotationComplete,
    rotationNumber,
    roundsCompleteInRotation,
    onDisburse,
    onConfirmReceipt,
    onStartNext,        // only used for first-ever round OR restarting after a full rotation
    disbursing,
    confirming,
    starting,
}) {
    const [showDisburse, setShowDisburse] = useState(false);
    const [showStartNext, setShowStartNext] = useState(false);

    const mc = memberCount || members.length;

    //   0: Rotation just completed 
    const lastClosed = [...history]
        .filter(c => c.status === 'closed')
        .sort((a, b) => b.cycleNumber - a.cycleNumber)[0];

    const allMembersReceivedInCurrentRotation = mc > 0 &&
        lastClosed &&
        (lastClosed.potRecipientPosition === mc ||
            (lastClosed.cycleNumber % mc === 0));

    if (!cycle && allMembersReceivedInCurrentRotation) {
        const rNum = Math.ceil(lastClosed.cycleNumber / mc);
        return (
            <>
                <div className="bg-[#EAF5EE] border border-[rgba(42,122,75,0.3)] rounded-xl px-5 py-4 mb-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="font-bold text-[15px] text-[#2A7A4B]">
                                🎊 Rotation {rNum} complete — every member has received the pot
                            </div>
                            <div className="text-[12px] text-[#9E9690] mt-1">
                                All {mc} members have received {fmt(chama?.contributionAmount * mc)} over {mc} rounds.
                                {isOfficer
                                    ? ' Start Rotation ' + (rNum + 1) + ' when your group is ready.'
                                    : ' Officers will start the next rotation.'}
                            </div>

                            {/* Mini payout summary */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[...history]
                                    .filter(c => c.status === 'closed' && Math.ceil(c.cycleNumber / mc) === rNum)
                                    .sort((a, b) => a.cycleNumber - b.cycleNumber)
                                    .map(c => (
                                        <span
                                            key={c._id}
                                            className="inline-flex items-center gap-1 text-[10px] bg-white border border-[#E8E4DF] text-[#2A7A4B] px-2 py-0.5 rounded"
                                        >
                                            ✓ {c.potRecipientId?.name?.split(' ')[0]}
                                        </span>
                                    ))}
                            </div>
                        </div>

                        {isOfficer && (
                            <button
                                onClick={() => setShowStartNext(true)}
                                className="shrink-0 bg-amber-600 text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                            >
                                Start Rotation {rNum + 1}
                            </button>
                        )}
                    </div>
                </div>

                {showStartNext && (
                    <StartCycleModal
                        nextRecipient={members.find(m => m.rotationPosition === 1)?.userId?.name}
                        nextPosition={1}
                        rotationNumber={rNum + 1}
                        chama={chama}
                        memberCount={mc}
                        onConfirm={(s, e) => { onStartNext(s, e); setShowStartNext(false); }}
                        onClose={() => setShowStartNext(false)}
                        loading={starting}
                    />
                )}
            </>
        );
    }

    //  1: No rounds exist yet 
    if (!cycle && history.length === 0) {
        if (!isOfficer) {
            return (
                <div className="bg-[#F8F6F3] border border-[#E8E4DF] rounded-xl px-5 py-4 mb-5 text-[13px] text-[#9E9690]">
                    No rotation started yet. Officers will start the first round soon.
                </div>
            );
        }
        return (
            <>
                <div className="bg-[#FEF3E2] border border-amber-200 rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-[14px] text-[#7A4D08]">No rotation started yet</div>
                        <div className="text-[12px] text-[#9E9690] mt-0.5">
                            Start the first round to begin collecting contributions
                        </div>
                    </div>
                    <button
                        onClick={() => setShowStartNext(true)}
                        className="bg-amber-600 text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                    >
                        Start First Round
                    </button>
                </div>
                {showStartNext && (
                    <StartCycleModal
                        nextRecipient={members.find(m => m.rotationPosition === 1)?.userId?.name}
                        nextPosition={1}
                        rotationNumber={1}
                        chama={chama}
                        memberCount={mc}
                        onConfirm={(s, e) => { onStartNext(s, e); setShowStartNext(false); }}
                        onClose={() => setShowStartNext(false)}
                        loading={starting}
                    />
                )}
            </>
        );
    }

    //   2: No active cycle but rotation is NOT complete 
    if (!cycle && !allMembersReceivedInCurrentRotation && history.length > 0) {
        if (!isOfficer) {
            return (
                <div className="bg-[#F8F6F3] border border-[#E8E4DF] rounded-xl px-5 py-4 mb-5 text-[13px] text-[#9E9690]">
                    Waiting for the next round to start.
                </div>
            );
        }
        const nextPos = lastClosed ? lastClosed.potRecipientPosition + 1 : 1;
        const nextMember = members.find(m => m.rotationPosition === nextPos);
        return (
            <>
                <div className="bg-[#FEF3E2] border border-amber-200 rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-[14px] text-[#7A4D08]">
                            Ready for Round {lastClosed ? lastClosed.cycleNumber + 1 : 1}
                        </div>
                        <div className="text-[12px] text-[#9E9690] mt-0.5">
                            Next recipient: {nextMember?.userId?.name || '—'} (Position {nextPos})
                        </div>
                    </div>
                    <button
                        onClick={() => setShowStartNext(true)}
                        className="bg-amber-600 text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-amber-700 transition"
                    >
                        Start Round
                    </button>
                </div>
                {showStartNext && (
                    <StartCycleModal
                        nextRecipient={nextMember?.userId?.name}
                        nextPosition={nextPos}
                        rotationNumber={rotationNumber}
                        chama={chama}
                        memberCount={mc}
                        onConfirm={(s, e) => { onStartNext(s, e); setShowStartNext(false); }}
                        onClose={() => setShowStartNext(false)}
                        loading={starting}
                    />
                )}
            </>
        );
    }

    if (!cycle) return null;

    const posInRotation = mc > 0 ? ((cycle.cycleNumber - 1) % mc) + 1 : cycle.cycleNumber;
    const currentRotation = mc > 0 ? Math.ceil(cycle.cycleNumber / mc) : 1;

    //   3: Active — collecting contributions 
    if (cycle.status === 'active' || cycle.status === 'collection') {
        const pct = cycle.expectedAmount > 0
            ? Math.min(Math.round((cycle.actualAmount / cycle.expectedAmount) * 100), 100)
            : 0;
        const allPaid = pct >= 100;

        return (
            <>
                <div className={`border rounded-xl px-5 py-4 mb-5 ${allPaid && isOfficer
                        ? 'bg-[#EAF5EE] border-[rgba(42,122,75,0.25)]'
                        : 'bg-[#FEF3E2] border-[rgba(184,101,10,0.2)]'
                    }`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            {/* Title */}
                            <div className={`font-bold text-[14px] ${allPaid && isOfficer ? 'text-[#2A7A4B]' : 'text-[#7A4D08]'
                                }`}>
                                {allPaid && isOfficer
                                    ? `✓ All contributions collected — ready to disburse to ${cycle.potRecipientId?.name}`
                                    : `Round ${posInRotation} of ${mc} · Collecting contributions`
                                }
                            </div>

                            {/* Subtitle */}
                            <div className="text-[12px] text-[#9E9690] mt-0.5">
                                Rotation {currentRotation} · Pot recipient:{' '}
                                <span className="font-semibold text-[#1C1814]">
                                    {cycle.potRecipientId?.name}
                                </span>
                                {' '}(Position {cycle.potRecipientPosition}) ·{' '}
                                Pot: {fmt(cycle.expectedAmount)}
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="flex justify-between text-[11px] text-[#9E9690] mb-1.5">
                                    <span>
                                        {fmt(cycle.actualAmount)} collected of {fmt(cycle.expectedAmount)}
                                    </span>
                                    <span className="font-bold text-[#1C1814]">{pct}%</span>
                                </div>
                                <div className="h-2 bg-white/60 rounded-full border border-[#E8E4DF] overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${allPaid ? 'bg-[#2A7A4B]' : 'bg-amber-600'
                                            }`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Round progress within rotation */}
                            <div className="text-[11px] text-[#9E9690] mt-2">
                                {posInRotation - 1} of {mc} members have received this rotation ·{' '}
                                {mc - posInRotation} remaining after this round
                            </div>
                        </div>

                        {/* Disburse button — officers only, enabled only when all paid */}
                        {isOfficer && (
                            <button
                                onClick={() => setShowDisburse(true)}
                                disabled={!allPaid}
                                title={!allPaid
                                    ? `${fmt(cycle.expectedAmount - cycle.actualAmount)} still to be collected`
                                    : undefined}
                                className={`shrink-0 whitespace-nowrap text-[13px] font-semibold px-5 h-9 rounded-lg transition ${allPaid
                                        ? 'bg-[#2A7A4B] text-white hover:bg-[#236640]'
                                        : 'bg-[#E8E4DF] text-[#9E9690] cursor-not-allowed'
                                    }`}
                            >
                                Record Disbursement
                            </button>
                        )}
                    </div>
                </div>

                {showDisburse && (
                    <DisbursementModal
                        cycle={cycle}
                        posInRotation={posInRotation}
                        totalInRotation={mc}
                        onConfirm={(ref, amt) => {
                            onDisburse(cycle._id, ref, amt);
                            setShowDisburse(false);
                        }}
                        onClose={() => setShowDisburse(false)}
                        loading={disbursing}
                    />
                )}
            </>
        );
    }

    //   4: Disbursed — waiting for recipient confirmation 
    if (cycle.status === 'disbursed') {
        return (
            <div className={`border rounded-xl px-5 py-4 mb-5 ${isRecipient
                    ? 'bg-[#EAF5EE] border-[rgba(42,122,75,0.3)]'
                    : 'bg-[#F0F4FF] border-[rgba(26,62,140,0.2)]'
                }`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className={`font-bold text-[14px] ${isRecipient ? 'text-[#2A7A4B]' : 'text-[#1A3E8C]'
                            }`}>
                            {isRecipient
                                ? '🎉 Your pot has been sent — please confirm you received it'
                                : `Pot sent to ${cycle.potRecipientId?.name} — awaiting their confirmation`
                            }
                        </div>
                        <div className="text-[12px] text-[#9E9690] mt-1">
                            {fmt(cycle.disbursedAmount || cycle.actualAmount)} sent on {fmtDay(cycle.disbursedAt)} ·
                            M-Pesa ref:{' '}
                            <span className="font-mono">{cycle.disbursementRef}</span>
                        </div>
                        {!isRecipient && (
                            <div className="text-[11px] text-[#9E9690] mt-1">
                                Once {cycle.potRecipientId?.name} confirms, Round {posInRotation + 1}{' '}
                                {posInRotation < mc ? `will start automatically for the next member.` : `completes Rotation ${currentRotation}.`}
                            </div>
                        )}
                    </div>

                    {isRecipient && (
                        <button
                            onClick={onConfirmReceipt}
                            disabled={confirming}
                            className="shrink-0 bg-[#2A7A4B] text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-[#236640] disabled:opacity-50 transition whitespace-nowrap"
                        >
                            {confirming ? 'Confirming...' : '✓ I confirm receipt'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
}