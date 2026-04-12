import { useState } from 'react';
import { recordContribution } from '../../api/contributions';
import toast from 'react-hot-toast';

const ContributionForm = ({ chamaId, members, cycleId, onSuccess }) => {
    const [form, setForm] = useState({
        memberId: '', amount: '', mpesaRef: '', paymentDate: new Date().toISOString().split('T')[0]
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    console.log('token at submit:', window.__accessToken__);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        if (!Number.isInteger(amount) || amount <= 0) {
            toast.error('Amount must be a whole number in KES');
            return;
        }
        setSubmitting(true);
        try {
            await recordContribution(chamaId, { ...form, amount, cycleId });
            toast.success('Contribution recorded — awaiting verification');
            setForm({ memberId: '', amount: '', mpesaRef: '', paymentDate: new Date().toISOString().split('T')[0] });
            onSuccess?.();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to record contribution');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border border-[#ccc] rounded-lg mb-6 w-full">
            <h3 className="font-semibold text-[16px] text-[#1C1814] mb-4">Record Contribution</h3>
            <div className="mb-3">
                <label htmlFor="memberId" className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Member</label>
                <select id="memberId" name="memberId" value={form.memberId} onChange={handleChange} required className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20">
                    <option value="">Select member</option>
                    {members.map(m => (
                        <option key={m.userId._id} value={m.userId._id}>{m.userId.name} ({m.role})</option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="amount" className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Amount (KES)</label>
                <input id="amount" type="number" name="amount" value={form.amount} onChange={handleChange} required min="1" step="1" placeholder="5000" className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" />
            </div>
            <div className="mb-3">
                <label htmlFor="mpesaRef" className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">M-Pesa Reference</label>
                <input id="mpesaRef" name="mpesaRef" value={form.mpesaRef} onChange={handleChange} required
                    placeholder="QJK7X3AB1C" maxLength={20}
                    style={{ textTransform: 'uppercase' }}
                    className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] font-mono focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <small className="text-[11px] text-[#666]">Found in M-Pesa SMS confirmation</small>
            </div>
            <div className="mb-4">
                <label htmlFor="paymentDate" className="block text-[12px] font-semibold text-[#1C1814] mb-1.5">Payment Date</label>
                <input id="paymentDate" type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} required className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-[13px] focus:outline-none focus:border-amber-500" />
            </div>
            <button type="submit" disabled={submitting} className="w-full sm:w-auto h-10 bg-amber-600 text-white px-5 rounded-lg font-semibold text-[13px] hover:bg-amber-700 disabled:opacity-50 transition">
                {submitting ? 'Recording...' : 'Record Contribution'}
            </button>
        </form>
    );
};

export default ContributionForm;