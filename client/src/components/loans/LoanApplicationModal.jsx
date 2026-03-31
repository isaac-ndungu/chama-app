import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;

export default function LoanApplicationModal({ chamaId, chama, onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    principalAmount: '',
    interestRate: 0.1,
    durationMonths: 3,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-calculate loan amounts whenever form changes
  useEffect(() => {
    if (!form.principalAmount || !form.durationMonths) {
      setPreview(null);
      return;
    }

    const principal = parseInt(form.principalAmount, 10);
    if (principal <= 0) {
      setPreview(null);
      return;
    }

    const interest = principal * form.interestRate;
    const totalDue = principal + interest;
    const monthlyInstalment = Math.round(totalDue / form.durationMonths);

    setPreview({
      principal,
      interest,
      totalDue,
      monthlyInstalment,
    });
  }, [form.principalAmount, form.interestRate, form.durationMonths]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.principalAmount || form.principalAmount <= 0) {
      toast.error('Enter a valid principal amount');
      return;
    }
    if (!form.durationMonths || form.durationMonths < 1) {
      toast.error('Duration must be at least 1 month');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/chamas/${chamaId}/loans`, {
        borrowerId: user.id,
        principalAmount: parseInt(form.principalAmount, 10),
        interestRate: form.interestRate,
        durationMonths: parseInt(form.durationMonths, 10),
      });

      toast.success('Loan application submitted! Members will now vote.');
      onSuccess(res.data.loan);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-7 w-full max-w-[480px] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-[17px] text-[#1C1814] mb-1">Apply for Loan</h2>
        <p className="text-[13px] text-[#9E9690] mb-5">{chama?.name}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Principal Amount */}
          <div>
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">
              Principal Amount (KSh)
            </label>
            <input
              type="number"
              value={form.principalAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, principalAmount: e.target.value }))
              }
              placeholder="50000"
              min="1000"
              step="1000"
              required
              className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="text-[11px] text-[#9E9690] mt-1">
              Minimum: {chama?.minimumLoanAmount ? fmt(chama.minimumLoanAmount) : 'Not set'}
            </p>
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">
              Interest Rate (Flat) - {(form.interestRate * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={form.interestRate}
              onChange={(e) =>
                setForm((f) => ({ ...f, interestRate: parseFloat(e.target.value) }))
              }
              className="w-full h-2 bg-[#E8E4DF] rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[11px] text-[#9E9690] mt-1">Range: 5% - 50%</p>
          </div>

          {/* Duration in Months */}
          <div>
            <label className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">
              Repayment Period (Months)
            </label>
            <select
              value={form.durationMonths}
              onChange={(e) =>
                setForm((f) => ({ ...f, durationMonths: parseInt(e.target.value, 10) }))
              }
              className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
            </select>
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="bg-[#F8F6F3] border border-[#E8E4DF] rounded-xl p-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#9E9690] mb-2">
                Loan Summary
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#6B6560]">Principal</span>
                <span className="text-[13px] font-semibold text-[#1C1814]">{fmt(preview.principal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#6B6560]">Interest ({(form.interestRate * 100).toFixed(0)}%)</span>
                <span className="text-[13px] font-semibold text-[#1C1814]">{fmt(preview.interest)}</span>
              </div>
              <div className="border-t border-[#E8E4DF] pt-3 flex justify-between items-center">
                <span className="text-[13px] font-semibold text-[#1C1814]">Total Due</span>
                <span className="text-[18px] font-serif text-[#1C1814]">{fmt(preview.totalDue)}</span>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 text-center">
                <p className="text-[11px] text-[#9E9690]">Monthly Installment</p>
                <p className="text-[15px] font-semibold text-[#1C1814] mt-0.5">{fmt(preview.monthlyInstalment)}</p>
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="bg-[#EEF2FF] border border-[rgba(26,62,140,0.15)] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#1A3E8C] leading-relaxed">
              Your loan application will be submitted to members for voting. It requires{' '}
              <span className="font-semibold">more than half of active members</span> to approve before
              disbursement. All votes are recorded in the audit log.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !preview}
              className="flex-1 h-10 bg-amber-600 text-white rounded-lg font-semibold text-[13px] hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 border border-[#E8E4DF] text-[#6B6560] h-10 rounded-lg text-[13px] hover:bg-[#F8F6F3] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
