import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchMyChamas } from '../../api/chamas';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '', label: 'Dashboard' },
  { to: 'contributions', label: 'Contributions' },
  { to: 'members', label: 'Members' },
  { to: 'loans', label: 'Loans' },
  { to: 'audit', label: 'Audit Log' },
  { to: 'settings', label: 'Settings' },
];

export default function Sidebar() {
  const { chamaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chamas, setChamas] = useState([]);
  const [currentChama, setCurrentChama] = useState(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    fetchMyChamas()
      .then(res => {
        const list = res.data.chamas;
        setChamas(list);
        const found = list.find(c => c._id === chamaId);
        setCurrentChama(found);
        setMembership(found?.myRole);
      })
      .catch(() => {});
  }, [chamaId]);

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <aside className="w-56 bg-[#1C1814] flex flex-col fixed top-0 left-0 bottom-0 z-50 overflow-y-auto h-screen justify-between">
      
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 border-b border-white/10">
        <span className="font-serif text-[18px] text-amber-500 block">
          ChamaLedger
        </span>
        <span className="text-[9px] text-white/40 tracking-[0.12em] uppercase mt-0.5 block">
          Financial Transparency
        </span>
      </div>

      {/* CHAMA SWITCHER */}
      <div className="px-3 py-3 relative">
        <button
          onClick={() => setShowSwitcher(v => !v)}
          className="w-full bg-white/5 hover:bg-white/10 rounded-md px-3 py-2.5 flex items-center justify-between transition"
        >
          <div className="text-left">
            <div className="text-xs font-semibold text-white leading-tight">
              {currentChama?.name || 'Loading...'}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">
              {currentChama?.memberCount || '—'} members · Cycle {currentChama?.currentCycle || '—'}
            </div>
          </div>
          <span className="text-white/40 text-xs ml-2">⌄</span>
        </button>

        {showSwitcher && chamas.length > 1 && (
          <div className="absolute left-3 right-3 top-full mt-2 bg-[#2A2420] border border-white/10 rounded-md overflow-hidden z-10 shadow-xl">
            {chamas.map(c => (
              <button
                key={c._id}
                onClick={() => {
                  navigate(`/chamas/${c._id}`);
                  setShowSwitcher(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs transition ${
                  c._id === chamaId
                    ? 'text-amber-500 bg-white/5'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-white/40 text-[10px] mt-0.5">{c.myRole}</div>
              </button>
            ))}

            <button
              onClick={() => {
                navigate('/');
                setShowSwitcher(false);
              }}
              className="w-full text-left px-3 py-2.5 text-xs text-amber-500/80 hover:bg-white/5 border-t border-white/10 transition"
            >
              + Switch chama
            </button>
          </div>
        )}
      </div>

      {/* MENU LABEL */}
      <div className="px-5 pt-2 pb-2">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/30">
          Menu
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={label}
            to={to === '' ? `/chamas/${chamaId}` : `/chamas/${chamaId}/${to}`}
            end={to === ''}
            className={({ isActive }) =>
              `flex items-center px-5 py-2.5 text-[13px] transition border-l-[3px] ${
                isActive
                  ? 'text-amber-500 bg-amber-500/10 border-amber-500'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
              }`
            }
          >
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* USER */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold">
          {initials(user?.name)}
        </div>
        <div className="min-w-0">
          <div className="text-white/90 text-xs font-semibold truncate">
            {user?.name}
          </div>
          <div className="text-white/40 text-[10px] capitalize">
            {membership || 'Member'}
          </div>
        </div>
      </div>
    </aside>
  );
}