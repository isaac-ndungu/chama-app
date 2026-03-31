import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';


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
    loan_application: { icon: '🗳️', bg: '#fef3c7', color: '#92400e' },
    loan_approved:    { icon: '✅', bg: '#dcfce7', color: '#166534' },
    loan_rejected:    { icon: '❌', bg: '#fee2e2', color: '#991b1b' },
    repayment:        { icon: '💳', bg: '#dbeafe', color: '#1e40af' },
    contribution:     { icon: '💰', bg: '#f0fdf4', color: '#166534' },
    member_joined:    { icon: '👤', bg: '#f5f3ff', color: '#5b21b6' },
    default:          { icon: '🔔', bg: '#f9fafb', color: '#374151' },
  };
  const cfg = map[type] ?? map.default;
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: cfg.bg, color: cfg.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, flexShrink: 0,
    }}>
      {cfg.icon}
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
    <div style={ps.panel}>
      {/* Header */}
      <div style={ps.header}>
        <div>
          <span style={ps.title}>Notifications</span>
          {unreadCount > 0 && (
            <span style={ps.unreadPill}>{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            style={ps.markAllBtn}
            onClick={markAllRead}
            disabled={markingAll}
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      <div style={ps.list}>
        {loading && (
          <div style={ps.emptyState}>
            <div style={ps.spinner} />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={ps.emptyState}>
            <span style={{ fontSize: 28 }}>🔔</span>
            <p style={ps.emptyText}>You're all caught up!</p>
          </div>
        )}

        {!loading && notifications.map(n => (
          <button
            key={n._id}
            style={{
              ...ps.notifRow,
              background: n.read ? 'transparent' : '#fffbeb',
            }}
            onClick={() => handleNotifClick(n)}
          >
            <NotifIcon type={n.type} />
            <div style={ps.notifBody}>
              <p style={ps.notifMessage}>{n.message}</p>
              <span style={ps.notifTime}>{timeAgo(n.createdAt)}</span>
            </div>
            {!n.read && <div style={ps.unreadDot} />}
          </button>
        ))}
      </div>
    </div>
  );
};

const ps = {
  panel: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 340, maxHeight: 480,
    background: '#fff', border: '1.5px solid #e5e7eb',
    borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', zIndex: 100,
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
  },
  title: { fontSize: 14, fontWeight: 700, color: '#111827' },
  unreadPill: {
    marginLeft: 8, fontSize: 10, fontWeight: 600,
    background: '#fef3c7', color: '#92400e',
    padding: '2px 7px', borderRadius: 99,
  },
  markAllBtn: {
    fontSize: 12, color: '#b45309', background: 'none',
    border: 'none', cursor: 'pointer', fontWeight: 500,
  },
  list: { overflowY: 'auto', flex: 1 },
  notifRow: {
    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '12px 16px', border: 'none', cursor: 'pointer',
    borderBottom: '1px solid #f9fafb', textAlign: 'left',
    transition: 'background 0.15s',
  },
  notifBody: { flex: 1, minWidth: 0 },
  notifMessage: { fontSize: 13, color: '#111827', margin: 0, lineHeight: 1.45 },
  notifTime: { fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'block' },
  unreadDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#b45309', flexShrink: 0, marginTop: 4,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px 0', gap: 10,
  },
  emptyText: { fontSize: 13, color: '#9ca3af', margin: 0 },
  spinner: {
    width: 20, height: 20, border: '2px solid #e5e7eb',
    borderTopColor: '#b45309', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// TopBAr 
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
        <div style={{ position: 'relative' }}>
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
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 2a6 6 0 00-6 6v2.5l-1.5 2.5A1 1 0 003.5 15H7a3 3 0 006 0h3.5a1 1 0 00.866-1.5L16 11V8a6 6 0 00-6-6z" />
            </svg>
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