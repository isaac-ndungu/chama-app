import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  MdDashboard,
  MdVolunteerActivism,
  MdGroup,
  MdAccountBalance,
  MdArticle,
  MdSettings,
  MdLogout,
  MdExpandMore,
} from 'react-icons/md';
import { fetchMyChamas } from '../../api/chamas';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../api/auth';
import toast from 'react-hot-toast';

const NAV = [
  { to: '', label: 'Dashboard', Icon: MdDashboard },
  { to: 'contributions', label: 'Contributions', Icon: MdVolunteerActivism },
  { to: 'members', label: 'Members', Icon: MdGroup },
  { to: 'loans', label: 'Loans', Icon: MdAccountBalance },
  { to: 'audit', label: 'Audit Log', Icon: MdArticle },
  { to: 'settings', label: 'Settings', Icon: MdSettings },
];

export default function Sidebar({ collapsed }) {
  const { chamaId } = useParams();
  const { user, logout: ctxLogout } = useAuth();
  const navigate = useNavigate();

  const [chamas, setChamas] = useState([]);
  const [currentChama, setCurrentChama] = useState(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [membership, setMembership] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchMyChamas()
      .then(res => {
        const list = res.data.chamas;
        setChamas(list);
        const found = list.find(c => c._id === chamaId);
        setCurrentChama(found);
        setMembership(found?.myRole);
      })
      .catch(() => { });
  }, [chamaId]);

  // Close switcher when sidebar collapses so it doesn't hang open
  useEffect(() => {
    if (collapsed) setShowSwitcher(false);
  }, [collapsed]);

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutUser();
      if (ctxLogout) await ctxLogout();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
      toast.error('Session ended');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className="bg-[#1C1814] flex flex-col fixed top-0 left-0 bottom-0 z-50 h-screen overflow-hidden transition-all duration-300"
      style={{ width: collapsed ? 64 : 220 }}
    >
      {/* HEADER */}
      <div className="px-4 pt-6 pb-4 border-b border-white/10 flex items-center overflow-hidden">
        {collapsed ? (
          // Single amber initial as wordmark when collapsed
          <span className="font-serif text-[20px] text-amber-500 mx-auto">C</span>
        ) : (
          <div className="min-w-0">
            <span className="font-serif text-[18px] text-amber-500 block leading-tight whitespace-nowrap">
              ChamaLedger
            </span>
            <span className="text-[9px] text-white/40 tracking-[0.12em] uppercase mt-0.5 block whitespace-nowrap">
              Financial Transparency
            </span>
          </div>
        )}
      </div>

      {/* CHAMA SWITCHER — hidden when collapsed */}
      {!collapsed && (
        <div className="px-3 py-3 relative">
          <button
            onClick={() => setShowSwitcher(v => !v)}
            className="w-full bg-white/5 hover:bg-white/10 rounded-md px-3 py-2.5 flex items-center justify-between transition"
          >
            <div className="text-left min-w-0">
              <div className="text-xs font-semibold text-white leading-tight truncate">
                {currentChama?.name || 'Loading...'}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5 capitalize">
                {membership || 'Member'}
              </div>
            </div>
            <MdExpandMore
              className={`text-white/40 text-base ml-2 shrink-0 transition-transform duration-200 ${showSwitcher ? 'rotate-180' : ''}`}
            />
          </button>

          {showSwitcher && chamas.length > 1 && (
            <div className="absolute left-3 right-3 top-full mt-2 bg-[#2A2420] border border-white/10 rounded-md overflow-hidden z-10 shadow-xl">
              {chamas.map(c => (
                <button
                  key={c._id}
                  onClick={() => { navigate(`/chamas/${c._id}`); setShowSwitcher(false); }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition ${c._id === chamaId
                    ? 'text-amber-500 bg-white/5'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-white/40 text-[10px] mt-0.5 capitalize">{c.myRole}</div>
                </button>
              ))}
              <button
                onClick={() => { navigate('/'); setShowSwitcher(false); }}
                className="w-full text-left px-3 py-2.5 text-xs text-amber-500/80 hover:bg-white/5 border-t border-white/10 transition"
              >
                + Switch chama
              </button>
            </div>
          )}
        </div>
      )}

      {/* MENU LABEL */}
      {!collapsed && (
        <div className="px-5 pt-2 pb-1">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-white/30">
            Menu
          </span>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="flex-1 mt-1">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={label}
            to={to === '' ? `/chamas/${chamaId}` : `/chamas/${chamaId}/${to}`}
            end={to === ''}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 py-2.5 text-[13px] transition border-l-[3px] group
              ${collapsed ? 'justify-center px-0' : 'px-4'}
              ${isActive
                ? 'text-amber-500 bg-amber-500/10 border-amber-500'
                : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`text-[18px] shrink-0 transition ${isActive ? 'text-amber-500' : 'text-white/50 group-hover:text-white'
                    }`}
                />
                {!collapsed && <span className="truncate">{label}</span>}

                {/* Tooltip visible only in collapsed mode */}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#2A2420] text-white text-[12px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg border border-white/10 z-50">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* USER + LOGOUT */}
      <div className="px-3 py-3 border-t border-white/10">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {initials(user?.name)}
              </div>
              <div className="min-w-0">
                <div className="text-white/90 text-xs font-semibold truncate">{user?.name}</div>
                <div className="text-white/40 text-[10px] capitalize">{membership || 'Member'}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition text-[12px] group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdLogout className="text-[16px] shrink-0 group-hover:text-red-400 transition" />
              <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </>
        ) : (
          // Collapsed: avatar + logout icon stacked and centred
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold"
              title={user?.name}
            >
              {initials(user?.name)}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
            >
              <MdLogout className="text-[16px]" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}