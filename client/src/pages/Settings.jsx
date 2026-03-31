import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useChama } from '../hooks/useChama';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import { updateChamaSettings, closeCycle, startCycle } from '../api/chamas';
import toast from 'react-hot-toast';

export default function Settings() {
  const { chamaId } = useParams();
  const { chama, role, loading, can } = useChama(chamaId);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const { data: dashboard, loading: dashLoading } = useDashboard(chamaId, dashboardRefresh);
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    meetingFrequency: 'monthly',
    defaultLoanInterestRate: '',
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Populate form when chama loads
  useEffect(() => {
    if (chama) {
      setForm({
        name: chama.name || '',
        description: chama.description || '',
        contributionAmount: chama.contributionAmount || '',
        meetingFrequency: chama.meetingFrequency || 'monthly',
        defaultLoanInterestRate: (chama.defaultLoanInterestRate * 100).toFixed(1) || '10',
      });
      setHasChanges(false);
    }
  }, [chama]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!can('edit_settings')) {
      toast.error('Only Chairperson can edit settings');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Chama name is required');
      return;
    }

    if (!form.contributionAmount || parseInt(form.contributionAmount) < 1) {
      toast.error('Contribution amount must be at least KES 1');
      return;
    }

    const loanRate = parseFloat(form.defaultLoanInterestRate) / 100;
    if (isNaN(loanRate) || loanRate < 0 || loanRate > 1) {
      toast.error('Loan interest rate must be between 0% and 100%');
      return;
    }

    setSaving(true);
    try {
      await updateChamaSettings(chamaId, {
        name: form.name,
        description: form.description,
        contributionAmount: parseInt(form.contributionAmount),
        meetingFrequency: form.meetingFrequency,
        defaultLoanInterestRate: loanRate,
      });

      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCycle = async () => {
    if (!isChairperson) return;
    try {
      await closeCycle(chamaId);
      toast.success('Current cycle closed.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close current cycle');
    } finally {
      setDashboardRefresh((v) => v + 1);
    }
  };

  const handleStartCycle = async () => {
    if (!isChairperson) return;
    try {
      await startCycle(chamaId);
      toast.success('New cycle started.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start new cycle');
    } finally {
      setDashboardRefresh((v) => v + 1);
    }
  };

  const isChairperson = role === 'chairperson';
  const isSaving = saving || loading;

  // Interest rate for read-only display
  const currentInterestRate = chama ? (chama.defaultLoanInterestRate * 100).toFixed(1) : '—';

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[26px] text-[#1C1814]">Mipangilio / Settings</h1>
          <p className="text-sm text-[#9E9690] mt-0.5">
            {isChairperson ? 'Chama configuration · Chairperson access required for changes' : 'Chama configuration · View only'}
          </p>
        </div>
        {hasChanges && isChairperson && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-600 text-white h-10 px-5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Main settings card */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 space-y-6">
        {/* Chama Details section */}
        <div>
          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#9E9690] mb-4">
            Maelezo ya Kikundi / Chama Details
          </h2>

          <div className="space-y-5">
            {/* Chama Name */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Jina la Kikundi / Chama Name
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

            {/* Description */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Maelezo / Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={!isChairperson || loading}
                placeholder="Brief description of your group"
                rows="3"
                className="w-full px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
              <div className="text-[11px] text-[#9E9690] mt-1">
                {form.description.length}/500 characters
              </div>
            </div>
          </div>
        </div>

        {/* Contribution section */}
        <div className="pt-6 border-t border-[#E8E4DF]">
          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#9E9690] mb-4">
            Mchango wa Kila Kila Mwezi / Monthly Contribution
          </h2>

          <div className="grid grid-cols-2 gap-5">
            {/* Contribution Amount */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Mchango wa Kila Kila Mwezi / Monthly Contribution
              </label>
              <div className="flex items-center">
                <span className="text-[#9E9690] text-[13px] mr-2">KSh</span>
                <input
                  type="number"
                  name="contributionAmount"
                  value={form.contributionAmount}
                  onChange={handleChange}
                  disabled={!isChairperson || loading}
                  placeholder="5000"
                  min="1"
                  step="100"
                  className="flex-1 px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div className="text-[11px] text-[#9E9690] mt-1">
                Whole numbers only. Cannot change mid-cycle
              </div>
            </div>

            {/* Meeting Frequency */}
            <div>
              <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
                Mkutano / Meeting Frequency
              </label>
              <select
                name="meetingFrequency"
                value={form.meetingFrequency}
                onChange={handleChange}
                disabled={!isChairperson || loading}
                className="w-full px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loan section */}
        <div className="pt-6 border-t border-[#E8E4DF]">
          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#9E9690] mb-4">
            Riba ya Mkopo / Default Loan Rate
          </h2>

          <div>
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-2">
              Riba ya Mkopo (%) / Default Loan Interest Rate
            </label>
            <div className="flex items-center max-w-sm">
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
                className="flex-1 px-4 py-2.5 border border-[#E8E4DF] rounded-lg text-[13px] text-[#1C1814] bg-white disabled:bg-[#F8F6F3] disabled:text-[#9E9690] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <span className="text-[#9E9690] text-[13px] ml-2">%</span>
            </div>
            <div className="text-[11px] text-[#9E9690] mt-1">
              Flat rate · Pre-fills loan application form · {isChairperson ? 'Current' : 'Default'}: {currentInterestRate}%
            </div>
          </div>
        </div>

        {/* Current Cycle section */}
        <div className="pt-6 border-t border-[#E8E4DF]">
          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#9E9690] mb-4">
            Mzunguko wa Sasa / Current Cycle
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-[#9E9690] uppercase tracking-[0.08em]">Mzunguko</div>
              <div className="text-[18px] font-serif text-[#1C1814] mt-2">
                {dashLoading ? 'Loading...' : dashboard?.cycle?.cycleNumber ? `Cycle ${dashboard.cycle.cycleNumber}` : 'No active cycle'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#9E9690] uppercase tracking-[0.08em]">Ilianza</div>
              <div className="text-[14px] text-[#1C1814] mt-2">
                {dashboard?.cycle?.startDate ? new Date(dashboard.cycle.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#9E9690] uppercase tracking-[0.08em]">Inaisha</div>
              <div className="text-[14px] text-[#1C1814] mt-2">
                {dashboard?.cycle?.endDate ? new Date(dashboard.cycle.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              disabled={!isChairperson}
              onClick={handleCloseCycle}
              className="border border-amber-600 text-amber-600 text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-amber-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close Current Cycle
            </button>
            <button
              disabled={!isChairperson}
              onClick={handleStartCycle}
              className="bg-amber-600 text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start New Cycle (close current first)
              </button>
            </div>

            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
              ⚠️ Closing a cycle calculates final balances and marks all unpaid contributions as overdue. This cannot be undone.
            </div>
          </div>

        {/* Access section */}
        {!isChairperson && (
          <div className="pt-6 border-t border-[#E8E4DF]">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="text-[12px] text-blue-900">
                <strong>View Only Mode:</strong> You are viewing this page as {role}. Only the Chairperson can edit these settings.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
