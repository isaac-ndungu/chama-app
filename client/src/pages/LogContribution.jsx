import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useContributions } from '../hooks/useContributions';
import { useDashboard } from '../hooks/useDashboard';
import ContributionReceipt from '../components/ui/ContributionReceipt';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

export default function LogContribution() {
  const { chamaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { record, contributions } = useContributions(chamaId);
  const { data: dashboard, loading: dashLoading } = useDashboard(chamaId);

  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    memberId: '',
    amount: '',
    mpesaRef: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [mpesaError, setMpesaError] = useState('');

  useEffect(() => {
    api.get(`/chamas/${chamaId}/members`)
      .then(res => setMembers(res.data.members))
      .catch(() => {});
  }, [chamaId]);

  const handleMpesaBlur = async () => {
    if (!form.mpesaRef) return;
    // Validate format
    if (!/^[A-Z0-9]{8,12}$/.test(form.mpesaRef.toUpperCase())) {
      setMpesaError('M-Pesa references are usually 10 characters, letters and numbers only');
    } else {
      setMpesaError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseInt(form.amount, 10);
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.error('Amount must be a whole number in KES');
      return;
    }
    setSubmitting(true);
    try {
      const result = await record({
        ...form,
        amount,
        mpesaRef: form.mpesaRef.toUpperCase().trim(),
        cycleId: dashboard?.cycle?._id,
      });
      setReceipt(result);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMember = members.find(m => m.userId?._id === form.memberId);
  const totalMembers = members.length || 0;
  // Count verified contributions for this cycle
  const paidThisCycle = contributions?.filter(c => c.status === 'verified').length || 0;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">Record Contribution</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">Log a contribution for {dashLoading ? 'Cycle...' : dashboard?.cycle?.cycleNumber ? `Cycle ${dashboard.cycle.cycleNumber}` : 'active cycle'}</p>
        </div>
        <button
          onClick={() => navigate(`/chamas/${chamaId}/contributions`)}
          className="text-[13px] text-[#6B6560] border border-[#E8E4DF] h-9 px-4 rounded-lg hover:bg-[#F8F6F3] transition"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        {/* Form */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-7">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-5 pb-3 border-b border-[#E8E4DF]">
            Contribution Details
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Member */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Member *</label>
              <select
                value={form.memberId}
                onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}
                required
                className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Select member...</option>
                {members.map(m => (
                  <option key={m.userId?._id} value={m.userId?._id}>
                    {m.userId?.name} (Position {m.rotationPosition})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Amount (KSh) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                  min="1"
                  step="1"
                  placeholder="5000"
                  className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <p className="text-[11px] text-[#9E9690] mt-1">Whole numbers only · No decimals</p>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Payment Date *</label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                  required
                  className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* M-Pesa ref */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">M-Pesa Reference *</label>
              <input
                value={form.mpesaRef}
                onChange={e => setForm(f => ({ ...f, mpesaRef: e.target.value.toUpperCase() }))}
                onBlur={handleMpesaBlur}
                required
                placeholder="QJK7X3AB1C"
                maxLength={12}
                className={`w-full h-10 px-3 border rounded-lg text-[13px] font-mono tracking-wide focus:outline-none focus:ring-2 ${
                  mpesaError
                    ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-red-500/20'
                    : 'border-[#E8E4DF] focus:border-amber-500 focus:ring-amber-500/20'
                }`}
              />
              {mpesaError ? (
                <p className="text-[11px] text-[#C0392B] mt-1 flex items-center gap-1">
                  <span>⚠</span> {mpesaError}
                </p>
              ) : (
                <p className="text-[11px] text-[#9E9690] mt-1">Found in your M-Pesa SMS confirmation</p>
              )}
            </div>

            {/* Cycle (read only) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Cycle</label>
              <input
                disabled
                value={dashLoading ? 'Loading...' : dashboard?.cycle ? `Cycle ${dashboard.cycle.cycleNumber} — ${new Date(dashboard.cycle.startDate).toLocaleDateString('en-KE')} to ${new Date(dashboard.cycle.endDate).toLocaleDateString('en-KE')}` : 'No active cycle'}
                className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] bg-[#F8F6F3] text-[#9E9690] cursor-not-allowed"
              />
            </div>

            {/* Info note */}
            <div className="bg-[#FEF3E2] border border-[rgba(184,101,10,0.2)] rounded-lg px-4 py-3 text-[12px] text-[#B8650A]">
              ℹ This entry will be marked <strong>Pending</strong> until verified by a second officer.
              It cannot be counted in financial calculations until verified.
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 bg-amber-600 text-white rounded-lg font-semibold text-[14px] hover:bg-amber-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Recording...' : 'Record Contribution'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/chamas/${chamaId}/contributions`)}
                className="px-6 border border-[#E8E4DF] text-[#6B6560] h-11 rounded-lg text-[13px] hover:bg-[#F8F6F3] transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Summary preview */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-4">
              Summary Preview
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-y-2.5 text-[12px]">
              <span className="text-[#9E9690]">Member</span>
              <span className="font-semibold text-[#1C1814]">{selectedMember?.userId?.name || '—'}</span>
              <span className="text-[#9E9690]">Amount</span>
              <span className="font-serif text-[16px] text-[#1C1814]">{form.amount ? fmt(parseInt(form.amount, 10)) : '—'}</span>
              <span className="text-[#9E9690]">M-Pesa Ref</span>
              <span className="font-mono text-[11px] text-[#1C1814]">{form.mpesaRef || '—'}</span>
              <span className="text-[#9E9690]">Date</span>
              <span className="text-[#1C1814]">{form.paymentDate ? new Date(form.paymentDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
              <span className="text-[#9E9690]">Cycle</span>
              <span className="text-[#1C1814]">{paidThisCycle} of {totalMembers}</span>
              <span className="text-[#9E9690]">Recorded by</span>
              <span className="text-[#1C1814]">{user?.name?.split(' ')[0]} {user?.name?.split(' ')[1]?.[0]}.</span>
            </div>
          </div>

          {/* Cycle progress */}
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-3">
              Cycle {dashboard?.cycle?.cycleNumber || '—'} Progress
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-[12px] text-[#6B6560] mb-1.5">
                <span>{fmt(paidThisCycle * 5000)} of {fmt(totalMembers * 5000)}</span>
                <span className="font-bold text-[#1C1814]">{Math.round((paidThisCycle / totalMembers) * 100)}%</span>
              </div>
              <div className="h-2 bg-[#F8F6F3] rounded-full border border-[#E8E4DF] overflow-hidden">
                <div className="h-full bg-[#2A7A4B] rounded-full" style={{ width: `${Math.round((paidThisCycle / totalMembers) * 100)}%` }} />
              </div>
            </div>
            <div className="text-[12px] text-[#9E9690]">{paidThisCycle} of {totalMembers} members paid · {totalMembers - paidThisCycle} remaining</div>
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <ContributionReceipt
          contribution={receipt}
          recorderName={user?.name}
          onRecordAnother={() => {
            setReceipt(null);
            setForm({ memberId: '', amount: '', mpesaRef: '', paymentDate: new Date().toISOString().split('T')[0] });
          }}
          onViewAll={() => { setReceipt(null); navigate(`/chamas/${chamaId}/contributions`); }}
          onClose={() => setReceipt(null)}
        />
      )}
    </AppLayout>
  );
}