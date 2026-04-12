import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useChama } from '../../hooks/useChama';
import { useDashboard } from '../../hooks/useDashboard';
import ChatWidget from '../ui/ChatWidget';
export default function AppLayout({ children }) {
  const { chamaId } = useParams();
  const { chama } = useChama(chamaId);
  const { data: dashboard } = useDashboard(chamaId);
  const cycle = dashboard?.cycle;
  const pendingCount = dashboard?.pendingVerifications || 0;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-[#F8F6F3]">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ml-0 ${collapsed ? 'lg:ml-16' : 'lg:ml-55'}`}
      >
        <TopBar
          chama={chama}
          cycle={cycle}
          pendingCount={pendingCount}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4  max-w-6xl w-full">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}