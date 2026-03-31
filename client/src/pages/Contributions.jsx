import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChamaContext } from '../context/ChamaContext';
import { fetchContributions, fetchPending } from '../api/contributions';
import ContributionForm from '../components/contributions/ContributionForm';
import PendingVerificationQueue from '../components/contributions/PendingVerificationQueue';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const config = {
    verified: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      label: 'VERIFIED',
    },
    pending: {
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      label: 'PENDING',
    },
    overdue: {
      dot: 'bg-red-500',
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'OVERDUE',
    },
  };
  const s = config[status?.toLowerCase()] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const Avatar = ({ name }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';
  const colors = [
    'bg-amber-100 text-amber-800',
    'bg-sky-100 text-sky-800',
    'bg-rose-100 text-rose-800',
    'bg-violet-100 text-violet-800',
    'bg-teal-100 text-teal-800',
    'bg-orange-100 text-orange-800',
  ];
  const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
};

const Contributions = () => {
  const { chamaId } = useParams();
  const { can, chama } = useChamaContext();
  const [contributions, setContributions] = useState([]);
  const [pending, setPending] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [contribRes, pendingRes, memberRes] = await Promise.all([
        fetchContributions(chamaId, { status: 'verified' }),
        can('verify_contribution')
          ? fetchPending(chamaId)
          : Promise.resolve({ data: { contributions: [] } }),
        import('../api/axios').then(m => m.default.get(`/chamas/${chamaId}/members`)),
      ]);
      setContributions(contribRes.data.contributions);
      setPending(pendingRes.data.contributions);
      setMembers(memberRes.data.members);
    } catch {
      toast.error('Failed to load contributions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [chamaId]);

  const filteredContributions = contributions.filter(c => {
    const matchesSearch = !searchQuery ||
      c.memberId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All Statuses' ||
      c.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading contributions…</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Contributions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {chama?.currentCycle
                  ? `Cycle ${chama.currentCycle.number} · ${format(new Date(chama.currentCycle.startDate), 'dd MMM')} – ${format(new Date(chama.currentCycle.endDate), 'dd MMM yyyy')}`
                  : chama?.name}
              </p>
            </div>
            {can('record_contribution') && (
              <button
                onClick={() => setShowForm(prev => !prev)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors duration-150"
              >
                <span className="text-lg leading-none">+</span>
                Record Contribution
              </button>
            )}
          </div>

          {/* Contribution Form (slide-in) */}
          {showForm && can('record_contribution') && (
            <div className="mt-5 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <ContributionForm
                chamaId={chamaId}
                members={members}
                cycleId={null}
                onSuccess={() => { loadData(); setShowForm(false); }}
              />
            </div>
          )}

          {/* Pending Verification Banner */}
          {can('verify_contribution') && pending.length > 0 && (
            <div className="mt-5 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    {pending.length} contribution{pending.length > 1 ? 's' : ''} awaiting verification
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">Another officer must confirm these entries</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap">
                Review Now →
              </button>
            </div>
          )}

          {/* Pending Verification Queue */}
          {can('verify_contribution') && pending.length > 0 && (
            <div className="mt-4">
              <PendingVerificationQueue
                chamaId={chamaId}
                pending={pending}
                onUpdate={loadData}
              />
            </div>
          )}

          {/* Filters Row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {['All Statuses', 'Verified', 'Pending', 'Overdue'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search member..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 w-52"
              />
            </div>

            <span className="ml-auto text-sm text-gray-500">
              Showing {filteredContributions.length} of {contributions.length}
            </span>
          </div>

          {/* Contributions Table */}
          <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {filteredContributions.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No contributions found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">Member</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">M-Pesa Ref</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">Date</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">Recorded By</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContributions.map(c => {
                    const status = c.status?.toLowerCase() ?? 'verified';
                    return (
                      <tr key={c._id} className="hover:bg-gray-50/70 transition-colors duration-100">
                        {/* Member */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.memberId?.name} />
                            <div>
                              <p className="font-medium text-gray-900 leading-tight">{c.memberId?.name}</p>
                              {c.memberId?.position && (
                                <p className="text-xs text-gray-400 mt-0.5">Position {c.memberId.position}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900">KSh {c.amount?.toLocaleString()}</span>
                        </td>

                        {/* M-Pesa Ref */}
                        <td className="px-5 py-4">
                          {c.mpesaRef ? (
                            <span className="font-mono text-xs text-gray-500 tracking-wide">{c.mpesaRef}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-gray-600">
                          {c.paymentDate
                            ? format(new Date(c.paymentDate), 'dd MMM yyyy')
                            : <span className="text-amber-600 font-medium">Overdue</span>}
                        </td>

                        {/* Recorded By */}
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          {c.verifiedBy?.name
                            ? `${c.verifiedBy.role ? c.verifiedBy.role + ' ' : ''}(${c.verifiedBy.name})`
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          {status === 'verified' && (
                            <button className="px-4 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 text-xs font-medium rounded-lg transition-colors duration-150">
                              View
                            </button>
                          )}
                          {status === 'pending' && can('verify_contribution') && (
                            <button className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors duration-150">
                              Verify
                            </button>
                          )}
                          {status === 'overdue' && (
                            <button className="px-4 py-1.5 border border-gray-200 hover:border-amber-300 text-gray-600 hover:text-amber-700 text-xs font-medium rounded-lg transition-colors duration-150">
                              Remind
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Load More */}
          {filteredContributions.length > 0 && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Showing {filteredContributions.length} of {contributions.length} ·{' '}
              <button className="text-amber-600 hover:underline font-medium">Load more</button>
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

export default Contributions;