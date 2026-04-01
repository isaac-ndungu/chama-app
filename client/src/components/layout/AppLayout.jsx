import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useChama } from '../../hooks/useChama';
import { useDashboard } from '../../hooks/useDashboard';

export default function AppLayout({ children }) {
  const { chamaId } = useParams();
  const { chama } = useChama(chamaId);
  const { data: dashboard } = useDashboard(chamaId);

  const cycle = dashboard?.cycle;
  const pendingCount = dashboard?.pendingVerifications || 0;

  return (
    <div className="flex min-h-screen bg-[#F8F6F3]">
      <Sidebar />
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <TopBar chama={chama} cycle={cycle} pendingCount={pendingCount} />
        <main className="flex-1 p-7 max-w-6xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}