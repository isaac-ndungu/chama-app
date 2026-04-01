import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faVoteYea,
  faCheck,
  faTimes,
  faCreditCard,
  faMoneyBillWave,
  faUserPlus,
  faBell as faBellDefault
} from '@fortawesome/free-solid-svg-icons';


const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/* Icon per notification type */
const NotifIcon = ({ type }) => {
  const map = {
    loan_application: { icon: faVoteYea, bg: 'bg-amber-100', color: 'text-amber-800' },
    loan_approved:    { icon: faCheck, bg: 'bg-green-100', color: 'text-green-800' },
    loan_rejected:    { icon: faTimes, bg: 'bg-red-100', color: 'text-red-800' },
    repayment:        { icon: faCreditCard, bg: 'bg-blue-100', color: 'text-blue-800' },
    contribution:     { icon: faMoneyBillWave, bg: 'bg-green-50', color: 'text-green-800' },
    member_joined:    { icon: faUserPlus, bg: 'bg-purple-100', color: 'text-purple-800' },
    default:          { icon: faBellDefault, bg: 'bg-gray-50', color: 'text-gray-700' },
  };
  const cfg = map[type] ?? map.default;
  return (
    <div className={`w-8 h-8 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center text-sm flex-shrink-0`}>
      <FontAwesomeIcon icon={cfg.icon} />
    </div>
  );
};

// Notifications panel
const NotificationPanel = ({ chamaId, onClose, onAllRead }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/chamas/${chamaId}/notifications`);
      setNotifications(res.data.notifications ?? []);
    } catch {
      // fail silently — panel will show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [chamaId]);

  const markRead = async (id) => {
    try {
      await api.patch(`/chamas/${chamaId}/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      onAllRead?.();
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch(`/chamas/${chamaId}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onAllRead?.();
    } catch {}
    setMarkingAll(false);
  };

  const handleNotifClick = (n) => {
    markRead(n._id);
    // Route to relevant page based on type
    if (n.type?.startsWith('loan'))     navigate(`/chamas/${chamaId}/loans`);
    if (n.type === 'contribution')      navigate(`/chamas/${chamaId}/contributions`);
    if (n.type === 'member_joined')     navigate(`/chamas/${chamaId}/members`);
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[340px] max-h-[480px] bg-white border border-gray-300 rounded-xl shadow-lg flex flex-col overflow-hidden z-[100] font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-center p-[14px_16px] border-b border-gray-100">
        <div>
          <span className="text-sm font-bold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="text-xs text-amber-700 bg-none border-none cursor-pointer font-medium hover:text-amber-800 disabled:opacity-50"
            onClick={markAllRead}
            disabled={markingAll}
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2.5">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-amber-700 rounded-full animate-spin" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2.5">
            <FontAwesomeIcon icon={faBell} className="text-2xl text-gray-400" />
            <p className="text-sm text-gray-400 m-0">You're all caught up!</p>
          </div>
        )}

        {!loading && notifications.map(n => (
          <button
            key={n._id}
            className={`w-full flex items-start gap-3 p-[12px_16px] border-none cursor-pointer border-b border-gray-50 text-left transition-colors hover:bg-gray-50 ${
              n.read ? 'bg-transparent' : 'bg-amber-50'
            }`}
            onClick={() => handleNotifClick(n)}
          >
            <NotifIcon type={n.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 m-0 leading-[1.45]">{n.message}</p>
              <span className="text-xs text-gray-400 mt-0.5 block">{timeAgo(n.createdAt)}</span>
            </div>
            {!n.read && <div className="w-1.5 h-1.5 bg-amber-700 rounded-full shrink-0 mt-1" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// TopBar
export default function TopBar({ chama, cycle, pendingCount }) {
  const { user } = useAuth();
  const { chamaId } = useParams();
  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread] = useState(pendingCount ?? 0);
  const panelRef = useRef(null);
  const bellRef  = useRef(null);

  /* Keep unread in sync when pendingCount prop updates */
  useEffect(() => {
    setUnread(pendingCount ?? 0);
  }, [pendingCount]);

  /* Close panel on outside click */
  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current  && !bellRef.current.contains(e.target)
      ) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

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
        <div className="relative">
          <button
            ref={bellRef}
            className={`relative transition p-1 rounded-md ${
              showNotifs
                ? 'text-[#b45309] bg-amber-50'
                : 'text-[#9E9690] hover:text-[#1C1814] hover:bg-gray-50'
            }`}
            onClick={() => setShowNotifs(v => !v)}
            title={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
          >
            <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#b45309] text-white rounded-full text-[9px] font-bold flex items-center justify-center border-[1.5px] border-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div ref={panelRef}>
              <NotificationPanel
                chamaId={chamaId}
                onClose={() => setShowNotifs(false)}
                onAllRead={() => setUnread(0)}
              />
            </div>
          )}
        </div>

        {/* Avatar */}
        <button className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold hover:opacity-90 transition">
          {initials(user?.name)}
        </button>
      </div>
    </header>
  );
}