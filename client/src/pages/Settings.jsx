import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useChama } from '../hooks/useChama';
import { useCycle } from '../hooks/useCycle';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { chamaId } = useParams();
  const { chama, role, loading } = useChama(chamaId);
  const { cycle, history, loading: cycleLoading, createNext } = useCycle(chamaId);

  const [form, setForm] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    meetingFrequency: 'monthly',
    defaultLoanInterestRate: '',
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [startingCycle, setStartingCycle] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [nextStart, setNextStart] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [nextEnd, setNextEnd] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // ── Role check — must match Membership model: 'chairperson' ──────────────
  const isChairperson = role === 'chairperson';

  useEffect(() => {
    if (!chama) return;
    setForm({
      name: chama.name || '',
      description: chama.description || '',
      contributionAmount: chama.contributionAmount || '',
      meetingFrequency: chama.meetingFrequency || 'monthly',
      defaultLoanInterestRate: chama.defaultLoanInterestRate
        ? (chama.defaultLoanInterestRate * 100).toFixed(1)
        : '10',
    });
    setHasChanges(false);
  }, [chama]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!isChairperson) {
      toast.error('Only the Chairperson can edit settings');
      return;
    }
    if (!form.name.trim()) { toast.error('Chama name is required'); return; }

    const amount = parseInt(form.contributionAmount, 10);
    const loanRate = parseFloat(form.defaultLoanInterestRate) / 100;

    if (!Number.isInteger(amount) || amount < 1) {
      toast.error('Contribution amount must be a whole number of at least KES 1');
      return;
    }
    if (isNaN(loanRate) || loanRate < 0 || loanRate > 1) {
      toast.error('Loan interest rate must be between 0% and 100%');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/chamas/${chamaId}`, {
        name: form.name,
        description: form.description,
        contributionAmount: amount,
        meetingFrequency: form.meetingFrequency,
        defaultLoanInterestRate: loanRate,
      });
      setHasChanges(false);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStartNextCycle = async () => {
    if (!isChairperson) return;
    setStartingCycle(true);
    try {
      await createNext(nextStart, nextEnd);
      setShowStartForm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start cycle');
    } finally {
      setStartingCycle(false);
    }
  };

  const currentInterestRate = chama
    ? (chama.defaultLoanInterestRate * 100).toFixed(1)
    : '—';

  const closedCycles = history.filter(c => c.status === 'closed').length;
  const hasActiveCycle = cycle && ['active', 'collection', 'disbursed'].includes(cycle.status);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">Settings</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">
            {isChairperson
              ? 'Chama configuration · Chairperson access'
              : 'Chama configuration · View only'}
          </p>
        </div>
        {hasChanges && isChairperson && (
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-amber-600 text-white h-10 px-5 rounded-lg font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="space-y-5">

        {/* ── Chama Details ─────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9E9690] mb-5">
            Chama Details
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Chama Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={!isChairperson || loading}
                placeholder="e.g. Kilimani Savings Group"
                className="w-full px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={!isChairperson || loading}
                placeholder="Brief description of your group"
                rows={3}
                className="w-full px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
              <div className="text-[11px] text-[#9E9690] mt-1">
                {form.description.length}/500 characters
              </div>
            </div>
          </div>
        </div>

        {/* ── Contribution & Loan Settings ──────────────────────────────── */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9E9690] mb-5">
            Contribution & Loan Settings
          </h2>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Monthly Contribution (KSh)
              </label>
              <input
                type="number"
                name="contributionAmount"
                value={form.contributionAmount}
                onChange={handleChange}
                disabled={!isChairperson || loading}
                placeholder="5000"
                min="1"
                step="100"
                className="w-full px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-[#9E9690] mt-1">Whole numbers only</p>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Meeting Frequency
              </label>
              <select
                name="meetingFrequency"
                value={form.meetingFrequency}
                onChange={handleChange}
                disabled={!isChairperson || loading}
                className="w-full px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
              Default Loan Interest Rate (%)
            </label>
            <input
              type="number"
              name="defaultLoanInterestRate"
              value={form.defaultLoanInterestRate}
              onChange={handleChange}
              disabled={!isChairperson || loading}
              placeholder="10"
              min="0"
              max="100"
              step="0.1"
              className="w-full px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-[#9E9690] mt-1">
              Flat rate · Current: {currentInterestRate}%
            </p>
          </div>
        </div>

        {/* ── ROSCA Cycle Status ────────────────────────────────────────── */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9E9690] mb-5">
            Rotation Cycle Status
          </h2>

          {cycleLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-[#E8E4DF] rounded w-48" />
              <div className="h-4 bg-[#E8E4DF] rounded w-64" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5 mb-5">
              <div>
                <div className="text-[11px] font-semibold text-[#9E9690] uppercase tracking-[0.08em] mb-1">
                  Active Cycle
                </div>
                <div className="text-[18px] font-serif text-[#1C1814]">
                  {hasActiveCycle ? `Cycle ${cycle.cycleNumber}` : 'No active cycle'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9E9690] uppercase tracking-[0.08em] mb-1">
                  Cycles Complete
                </div>
                <div className="text-[18px] font-serif text-[#1C1814]">{closedCycles}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9E9690] uppercase tracking-[0.08em] mb-1">
                  Cycle Status
                </div>
                <div className="text-[14px] text-[#1C1814] capitalize">
                  {cycle?.status || '—'}
                </div>
              </div>
            </div>
          )}

          {hasActiveCycle && (
            <div className="bg-[#F8F6F3] border border-[#E8E4DF] rounded-xl px-4 py-3 mb-4">
              <div className="grid grid-cols-3 gap-4 text-[12px]">
                <div>
                  <span className="text-[#9E9690]">Pot recipient</span>
                  <div className="font-semibold text-[#1C1814] mt-0.5">
                    {cycle.potRecipientId?.name || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-[#9E9690]">Started</span>
                  <div className="font-semibold text-[#1C1814] mt-0.5">
                    {cycle.startDate
                      ? new Date(cycle.startDate).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                      : '—'}
                  </div>
                </div>
                <div>
                  <span className="text-[#9E9690]">Ends</span>
                  <div className="font-semibold text-[#1C1814] mt-0.5">
                    {cycle.endDate
                      ? new Date(cycle.endDate).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#FEF3E2] border border-[rgba(184,101,10,0.2)] rounded-lg px-4 py-3 mb-4 text-[12px] text-[#B8650A]">
            ℹ Cycle lifecycle is managed from the <strong>Dashboard</strong> and <strong>Members</strong> pages.
            The next cycle starts automatically once the pot recipient confirms receipt.
          </div>

          {isChairperson && !hasActiveCycle && (
            <div>
              {!showStartForm ? (
                <button
                  onClick={() => setShowStartForm(true)}
                  className="bg-amber-600 text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-amber-700 transition"
                >
                  Start {closedCycles === 0 ? 'First' : 'Next'} Cycle
                </button>
              ) : (
                <div className="border border-[#E8E4DF] rounded-xl p-4 space-y-4">
                  <div className="font-semibold text-[13px] text-[#1C1814]">
                    Start Cycle {closedCycles + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={nextStart}
                        onChange={e => setNextStart(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={nextEnd}
                        min={nextStart}
                        onChange={e => setNextEnd(e.target.value)}
                        className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleStartNextCycle}
                      disabled={startingCycle}
                      className="bg-amber-600 text-white text-[13px] font-semibold px-5 h-9 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition"
                    >
                      {startingCycle ? 'Starting...' : 'Confirm & Start'}
                    </button>
                    <button
                      onClick={() => setShowStartForm(false)}
                      className="border border-[#E8E4DF] text-[#6B6560] text-[13px] px-4 h-9 rounded-lg hover:bg-[#F8F6F3] transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isChairperson && hasActiveCycle && (
            <p className="text-[12px] text-[#9E9690]">
              A cycle is currently active. The next cycle will be available once the current pot
              recipient confirms receipt.
            </p>
          )}
        </div>

        {/* View-only notice for non-chairpersons */}
        {!isChairperson && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-[13px] text-blue-800">
            <strong>View only:</strong> You are logged in as {role}. Only the Chairperson can
            edit these settings.
          </div>
        )}
      </div>
    </AppLayout>
  );
}