import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ chama, cycle, pendingCount }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const initials = (name) =>
        name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

    return (
        <header className="h-14 bg-white border-b border-[#E8E4DF] flex items-center px-7 justify-between sticky top-0 z-40">
            {/* Left */}
            <div className="flex items-center gap-3">
                <span className="font-bold text-[15px] text-[#1C1814]">
                    {chama?.name || 'Loading...'}
                </span>
                {cycle && (
                    <span className="bg-[#FEF3E2] text-[#7A4D08] text-[11px] font-semibold px-2.5 py-0.5 rounded">
                        Cycle {cycle.cycleNumber} of {chama?.totalCycles || '—'}
                    </span>
                )}
                {cycle?.potRecipientId && (
                    <span className="text-xs text-[#9E9690]">
                        Next: {cycle.potRecipientId?.name || 'TBD'}
                    </span>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                {/* Notification bell */}
                <button
                    className="relative text-[#9E9690] hover:text-[#1C1814] transition"
                    onClick={() => navigate('contributions')}
                    title={pendingCount > 0 ? `${pendingCount} pending verifications` : 'Notifications'}
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10 2a6 6 0 00-6 6v2.5l-1.5 2.5A1 1 0 003.5 15H7a3 3 0 006 0h3.5a1 1 0 00.866-1.5L16 11V8a6 6 0 00-6-6z" />
                    </svg>
                    {pendingCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#C0392B] rounded-full border-[1.5px] border-white" />
                    )}
                </button>

                {/* Avatar */}
                <button className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold">
                    {initials(user?.name)}
                </button>
            </div>
        </header>
    );
}