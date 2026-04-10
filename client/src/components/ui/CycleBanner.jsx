import { useState } from 'react';
import DisbursementModal from './DisbursementModal';
import StartCycleModal from './StartCycleModal';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

// shows current cycle state and the action needed
export default function CycleBanner({
    cycle,
    history = [],
    members = [],
    chama,
    isOfficer,
    isRecipient,
    onDisburse,
    onConfirmReceipt,
    onStartNext,
    disbursing,
    confirming,
    starting,
}) {
    const [showDisburse, setShowDisburse] = useState(false);
    const [showStartNext, setShowStartNext] = useState(false);

    if (!cycle && history.length === 0) {
        
        if (!isOfficer) {
            return (
                <div className="bg-[#F8F6F3] border border-[#E8E4DF] rounded-xl px-5 py-4 mb-5 text-[13px] text-[#9E9690]">
                    No active cycle. Officers will start the first cycle soon.
                </div>
            );
        }
        return (
            <>
                <div className="bg-[#FEF3E2] border border-amber-200 rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-[14px] text-[#7A4D08]">No cycle has started yet</div>
                        <div className="text-[12px] text-[#9E9690] mt-0.5">
                            Start the first cycle to begin collecting contributions
                        </div>
                    </div>
                    <button
                        onClick={() => setShowStartNext(true)}
                        className="bg-amber-600 text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                    >
                        Start First Cycle
                    </button>
                </div>
                {showStartNext && (
                    <StartCycleModal
                        nextRecipient={members.find(m => m.rotationPosition === 1)?.userId?.name}
                        nextPosition={1}
                        chama={chama}
                        memberCount={members.length}
                        onConfirm={(s, e) => { onStartNext(s, e); setShowStartNext(false); }}
                        onClose={() => setShowStartNext(false)}
                        loading={starting}
                    />
                )}
            </>
        );
    }

    // Cycle is active - collection phase
    if (cycle?.status === 'active' || cycle?.status === 'collection') {
        const paidCount = cycle.actualAmount > 0
            ? Math.round(cycle.actualAmount / (chama?.contributionAmount || 1))
            : 0;
        const totalMembers = members.length;
        const allPaid = paidCount >= totalMembers;
        const pct = totalMembers > 0 ? Math.min(Math.round((paidCount / totalMembers) * 100), 100) : 0;

        return (
            <>
                <div className={`border rounded-xl px-5 py-4 mb-5 ${allPaid && isOfficer
                        ? 'bg-[#EAF5EE] border-[rgba(42,122,75,0.25)]'
                        : 'bg-[#FEF3E2] border-[rgba(184,101,10,0.2)]'
                    }`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className={`font-bold text-[14px] ${allPaid ? 'text-[#2A7A4B]' : 'text-[#7A4D08]'}`}>
                                {allPaid && isOfficer
                                    ? `✓ All contributions collected - ready to disburse to ${cycle.potRecipientId?.name}`
                                    : `Cycle ${cycle.cycleNumber} - collecting contributions`
                                }
                            </div>
                            <div className="text-[12px] text-[#9E9690] mt-1">
                                Pot recipient: <span className="font-semibold text-[#1C1814]">
                                    {cycle.potRecipientId?.name}
                                </span>
                                {' '}(Position {cycle.potRecipientPosition}) · Pot value: {fmt(cycle.expectedAmount)}
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="flex justify-between text-[11px] text-[#9E9690] mb-1">
                                    <span>{fmt(cycle.actualAmount)} collected of {fmt(cycle.expectedAmount)}</span>
                                    <span className="font-bold">{pct}%</span>
                                </div>
                                <div className="h-2 bg-white/60 rounded-full border border-[#E8E4DF] overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${allPaid ? 'bg-[#2A7A4B]' : 'bg-amber-600'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Officer action */}
                        {isOfficer && (
                            <button
                                onClick={() => setShowDisburse(true)}
                                disabled={!allPaid}
                                title={!allPaid ? 'Wait until all contributions are collected' : undefined}
                                className={`whitespace-nowrap text-[13px] font-semibold px-5 h-9 rounded-lg transition ${allPaid
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

    // Pot has been disbursed - waiting for recipient confirmation
    if (cycle?.status === 'disbursed') {
        return (
            <div className={`border rounded-xl px-5 py-4 mb-5 ${isRecipient
                    ? 'bg-[#EAF5EE] border-[rgba(42,122,75,0.3)]'
                    : 'bg-[#F0F4FF] border-[rgba(26,62,140,0.2)]'
                }`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className={`font-bold text-[14px] ${isRecipient ? 'text-[#2A7A4B]' : 'text-[#1A3E8C]'}`}>
                            {isRecipient
                                ? '🎉 Your pot has been sent - please confirm you received it'
                                : `Pot disbursed to ${cycle.potRecipientId?.name} - awaiting their confirmation`
                            }
                        </div>
                        <div className="text-[12px] text-[#9E9690] mt-1">
                            {fmt(cycle.disbursedAmount || cycle.actualAmount)} sent on {fmtDay(cycle.disbursedAt)} ·
                            M-Pesa ref: <span className="font-mono">{cycle.disbursementRef}</span>
                        </div>
                        {!isRecipient && (
                            <div className="text-[11px] text-[#9E9690] mt-1">
                                The cycle will close once {cycle.potRecipientId?.name} confirms receipt
                            </div>
                        )}
                    </div>

                    {isRecipient && (
                        <button
                            onClick={onConfirmReceipt}
                            disabled={confirming}
                            className="whitespace-nowrap bg-[#2A7A4B] text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-[#236640] disabled:opacity-50 transition"
                        >
                            {confirming ? 'Confirming...' : '✓ I confirm receipt'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Cycle is closed - officers can start the next one
    if (cycle?.status === 'closed') {
        // Find next recipient from members
        const closedCount = history.filter(c => c.status === 'closed').length;
        const nextPosition = closedCount + 1;
        const totalMembers = members.length;
        const allDone = nextPosition > totalMembers;
        const nextMember = members.find(m => m.rotationPosition === nextPosition);

        return (
            <>
                <div className="bg-[#EAF5EE] border border-[rgba(42,122,75,0.25)] rounded-xl px-5 py-4 mb-5 flex items-start justify-between gap-4">
                    <div>
                        <div className="font-bold text-[14px] text-[#2A7A4B]">
                            ✓ Cycle {cycle.cycleNumber} complete - {cycle.potRecipientId?.name} confirmed receipt
                        </div>
                        <div className="text-[12px] text-[#9E9690] mt-1">
                            {allDone
                                ? '🎊 All members have received the pot - the full rotation is complete!'
                                : `Next: ${nextMember?.userId?.name || '-'} (Position ${nextPosition}) will receive the pot`
                            }
                        </div>
                    </div>
                    {isOfficer && !allDone && (
                        <button
                            onClick={() => setShowStartNext(true)}
                            className="whitespace-nowrap bg-amber-600 text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-amber-700 transition"
                        >
                            Start Next Cycle
                        </button>
                    )}
                    {isOfficer && allDone && (
                        <button
                            onClick={() => setShowStartNext(true)}
                            className="whitespace-nowrap bg-[#1A3E8C] text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-[#163281] transition"
                        >
                            Restart Rotation
                        </button>
                    )}
                </div>

                {showStartNext && (
                    <StartCycleModal
                        nextRecipient={nextMember?.userId?.name}
                        nextPosition={nextPosition}
                        chama={chama}
                        memberCount={totalMembers}
                        onConfirm={(s, e) => { onStartNext(s, e); setShowStartNext(false); }}
                        onClose={() => setShowStartNext(false)}
                        loading={starting}
                    />
                )}
            </>
        );
    }

    return null;
}