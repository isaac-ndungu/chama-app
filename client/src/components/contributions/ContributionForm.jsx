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
        const amount = parseInt(form.amount, 10);
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
        <form onSubmit={handleSubmit} style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8, marginBottom: 24 }}>
            <h3>Record Contribution</h3>
            <div>
                <label>Member</label>
                <select name="memberId" value={form.memberId} onChange={handleChange} required>
                    <option value="">Select member</option>
                    {members.map(m => (
                        <option key={m.userId._id} value={m.userId._id}>{m.userId.name} ({m.role})</option>
                    ))}
                </select>
            </div>
            <div>
                <label>Amount (KES)</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} required min="1" step="1" placeholder="5000" />
            </div>
            <div>
                <label>M-Pesa Reference</label>
                <input name="mpesaRef" value={form.mpesaRef} onChange={handleChange} required
                    placeholder="QJK7X3AB1C" maxLength={20}
                    style={{ textTransform: 'uppercase' }}
                />
                <small style={{ color: '#666' }}>Found in M-Pesa SMS confirmation</small>
            </div>
            <div>
                <label>Payment Date</label>
                <input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} required />
            </div>
            <button type="submit" disabled={submitting}>
                {submitting ? 'Recording...' : 'Record Contribution'}
            </button>
        </form>
    );
};

export default ContributionForm;