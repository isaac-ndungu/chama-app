import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdMenu, MdMenuOpen } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  MdAttachMoney,
  MdCheckCircle,
  MdWarningAmber,
  MdAccountBalance,
  MdClose,
  MdCreditCard,
  MdPersonAdd,
  MdAutorenew,
} from 'react-icons/md';

const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Derive a human-readable notification from an audit log entry
function auditToNotification(log) {
  const actor = log.actorId?.name || 'Someone';
  const after = log.after || {};

  const map = {
    CONTRIBUTION_RECORDED: {
      type: 'contribution',
      message: `${actor} recorded a KSh ${Number(after.amount || 0).toLocaleString('en-KE')} contribution`,
      icon: MdAttachMoney, bg: 'bg-green-50', color: 'text-green-700',
    },
    CONTRIBUTION_VERIFIED: {
      type: 'contribution',
      message: `${actor} verified a KSh ${Number(after.amount || 0).toLocaleString('en-KE')} contribution`,
      icon: MdCheckCircle, bg: 'bg-green-100', color: 'text-green-800',
    },
    CONTRIBUTION_DISPUTED: {
      type: 'contribution',
      message: `${actor} flagged a contribution as disputed`,
      icon: MdWarningAmber, bg: 'bg-red-50', color: 'text-red-700',
    },
    LOAN_APPLIED: {
      type: 'loan_application',
      message: `${actor} submitted a KSh ${Number(after.principalAmount || 0).toLocaleString('en-KE')} loan application — your vote is needed`,
      icon: MdAccountBalance, bg: 'bg-amber-50', color: 'text-amber-800',
    },
    LOAN_APPROVED: {
      type: 'loan_approved',
      message: `${actor} approved a loan application`,
      icon: MdCheckCircle, bg: 'bg-green-100', color: 'text-green-800',
    },
    LOAN_REJECTED: {
      type: 'loan_rejected',
      message: `${actor} rejected a loan application`,
      icon: MdClose, bg: 'bg-red-100', color: 'text-red-800',
    },
    LOAN_REPAYMENT_RECORDED: {
      type: 'repayment',
      message: `${actor} recorded a loan repayment`,
      icon: MdCreditCard, bg: 'bg-blue-50', color: 'text-blue-700',
    },
    MEMBER_INVITED: {
      type: 'member_joined',
      message: `${actor} added a new member to the group`,
      icon: MdPersonAdd, bg: 'bg-purple-50', color: 'text-purple-700',
    },
    CYCLE_CREATED: {
      type: 'cycle',
      message: `${actor} started a new contribution cycle`,
      icon: MdAutorenew, bg: 'bg-amber-50', color: 'text-amber-800',
    },
  };

  return map[log.action] || null;
}

function NotifIcon({ bg, color, icon }) {
  return (
    <div className={`w-8 h-8 rounded-full ${bg} ${color} flex items-center justify-center text-sm shrink-0`}>
      {icon}
    </div>
  );
}

function NotificationPanel({ chamaId, currentUserId, onClose, onMarkAllRead }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [read, setRead] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`notif_read_${chamaId}`) || '[]')); }
    catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);

  const markRead = (ids) => {
    setRead(prev => {
      const next = new Set([...prev, ...ids]);
      localStorage.setItem(`notif_read_${chamaId}`, JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chamas/${chamaId}/audit?limit=20`);
        const logs = res.data.logs || [];
        const derived = logs
          .map(log => {
            const notif = auditToNotification(log);
            if (!notif) return null;
            const actorId = log.actorId?._id || log.actorId;
            // Skip entries the current user made themselves
            if (actorId?.toString() === currentUserId?.toString()) return null;
            return { id: log._id, createdAt: log.createdAt, ...notif };
          })
          .filter(Boolean);
        setItems(derived);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chamaId, currentUserId]);

  const unread = items.filter(i => !read.has(i.id));

  const handleClick = (item) => {
    markRead([item.id]);
    if (item.type?.startsWith('loan')) navigate(`/chamas/${chamaId}/loans`);
    else if (item.type === 'contribution') navigate(`/chamas/${chamaId}/contributions`);
    else if (item.type === 'member_joined') navigate(`/chamas/${chamaId}/members`);
    onClose();
  };

  const handleMarkAll = () => {
    markRead(items.map(i => i.id));
    onMarkAllRead();
  };

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[320px] sm:w-85 max-h-120 bg-white border border-[#E8E4DF] rounded-xl shadow-xl flex flex-col overflow-hidden z-100">
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#E8E4DF]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1C1814]">Notifications</span>
          {unread.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {unread.length} new
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={handleMarkAll} className="text-[12px] text-amber-700 hover:text-amber-800 font-medium">
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-5 h-5 border-2 border-[#E8E4DF] border-t-amber-600 rounded-full animate-spin" />
            <span className="text-[12px] text-[#9E9690]">Loading...</span>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-3xl">🔔</span>
            <p className="text-sm text-[#9E9690]">You're all caught up!</p>
            <p className="text-[11px] text-[#9E9690]">No recent activity from other members</p>
          </div>
        )}

        {!loading && items.map(item => {
          const isUnread = !read.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`w-full flex items-start gap-3 px-4 py-3 border-b border-[#F8F6F3] last:border-0 text-left transition-colors hover:bg-[#F8F6F3] ${isUnread ? 'bg-amber-50/60' : 'bg-white'
                }`}
            >
              <NotifIcon bg={item.bg} color={item.color} icon={item.icon} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#1C1814] leading-snug">{item.message}</p>
                <span className="text-[11px] text-[#9E9690] mt-0.5 block">{timeAgo(item.createdAt)}</span>
              </div>
              {isUnread && (
                <div className="w-2 h-2 bg-amber-600 rounded-full shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

//    TopBar                                                                     
export default function TopBar({ chama, cycle, pendingCount, collapsed, onToggleCollapse, onMobileMenuOpen }) {
  const { user } = useAuth();
  const { chamaId } = useParams();
  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/chamas/${chamaId}/audit?limit=20`);
        const logs = res.data.logs || [];
        const saved = new Set(JSON.parse(localStorage.getItem(`notif_read_${chamaId}`) || '[]'));
        const count = logs.filter(log => {
          const actorId = log.actorId?._id || log.actorId;
          const isOther = actorId?.toString() !== user?.id?.toString();
          const hasNotif = !!auditToNotification(log);
          return isOther && hasNotif && !saved.has(log._id);
        }).length;
        setUnread(count);
      } catch { }
    };
    if (chamaId && user?.id) load();
  }, [chamaId, user?.id]);

  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  return (
    <header className="h-14 bg-white border-b border-[#E8E4DF] flex items-center px-4 justify-between sticky top-0 z-40">
      {/* Left: mobile menu + collapse toggle + chama info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile hamburger — visible only below lg breakpoint */}
        <button
          onClick={onMobileMenuOpen}
          title="Open menu"
          className="p-1.5 rounded-lg text-[#9E9690] hover:text-[#1C1814] hover:bg-[#F8F6F3] transition lg:hidden"
        >
          <MdMenu className="w-5 h-5" />
        </button>

        {/* Sidebar collapse toggle — visible only on lg+ */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-[#9E9690] hover:text-[#1C1814] hover:bg-[#F8F6F3] transition hidden lg:block"
        >
          {collapsed
            ? <MdMenu className="w-5 h-5" />
            : <MdMenuOpen className="w-5 h-5" />
          }
        </button>

        <span className="font-bold text-[15px] text-[#1C1814] truncate">
          {chama?.name || 'Loading...'}
        </span>
        {cycle && (
          <span className="bg-[#FEF3E2] text-[#7A4D08] text-[11px] font-semibold px-2.5 py-0.5 rounded whitespace-nowrap hidden sm:inline">
            Cycle {cycle.cycleNumber} of {chama?.totalCycles || '—'}
          </span>
        )}
        {cycle?.potRecipientId?.name && (
          <span className="text-xs text-[#9E9690] hidden md:inline">
            Next: {cycle.potRecipientId.name}
          </span>
        )}
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => setShowNotifs(v => !v)}
            className={`relative p-1.5 rounded-lg transition ${showNotifs ? 'bg-amber-50 text-amber-700' : 'text-[#9E9690] hover:text-[#1C1814] hover:bg-[#F8F6F3]'
              }`}
            title={unread > 0 ? `${unread} unread` : 'Notifications'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 2a6 6 0 00-6 6v2.586l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-amber-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-[1.5px] border-white px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div ref={panelRef}>
              <NotificationPanel
                chamaId={chamaId}
                currentUserId={user?.id}
                onClose={() => setShowNotifs(false)}
                onMarkAllRead={() => setUnread(0)}
              />
            </div>
          )}
        </div>

        <button className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold hover:opacity-90 transition shrink-0">
          {initials(user?.name)}
        </button>
      </div>
    </header>
  );
}