import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChamaContext } from '../context/ChamaContext';
import { fetchLoans, applyForLoan } from '../api/loans';
import LoanCard from '../components/loans/LoanCard';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Loans = () => {
  const { chamaId } = useParams();
  const { can, chama } = useChamaContext();
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ borrowerId: '', principalAmount: '', interestRate: '', durationMonths: '' });
  const [preview, setPreview] = useState(null);

  const loadData = async () => {
    try {
      const [loanRes, memberRes] = await Promise.all([
        fetchLoans(chamaId),
        api.get(`/chamas/${chamaId}/members`)
      ]);
      setLoans(loanRes.data.loans);
      setMembers(memberRes.data.members);
    } catch {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [chamaId]);

  // Live calculation preview
  useEffect(() => {
    const { principalAmount, interestRate, durationMonths } = form;
    const p = parseInt(principalAmount, 10);
    const r = parseFloat(interestRate);
    const d = parseInt(durationMonths, 10);
    if (p > 0 && r > 0 && d > 0) {
      const totalInterest = Math.round(p * (r / 100) * d);
      const totalDue = p + totalInterest;
      setPreview({ totalInterest, totalDue, monthly: Math.ceil(totalDue / d) });
    } else {
      setPreview(null);
    }
  }, [form.principalAmount, form.interestRate, form.durationMonths]);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await applyForLoan(chamaId, {
        borrowerId: form.borrowerId,
        principalAmount: parseInt(form.principalAmount, 10),
        interestRate: parseFloat(form.interestRate) / 100,
        durationMonths: parseInt(form.durationMonths, 10)
      });
      toast.success('Loan application submitted — members will be notified');
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Application failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h2>Loans — {chama?.name}</h2>

      {can('apply_for_loan') && (
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Loan Application'}
        </button>
      )}

      {showForm && (
        <form onSubmit={handleApply} style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8, margin: '16px 0' }}>
          <h3>Loan Application</h3>
          <div>
            <label>Borrower</label>
            <select value={form.borrowerId} onChange={e => setForm(f => ({ ...f, borrowerId: e.target.value }))} required>
              <option value="">Select member</option>
              {members.map(m => <option key={m.userId._id} value={m.userId._id}>{m.userId.name}</option>)}
            </select>
          </div>
          <div>
            <label>Principal Amount (KES)</label>
            <input type="number" value={form.principalAmount} onChange={e => setForm(f => ({ ...f, principalAmount: e.target.value }))} required min="1" step="1" />
          </div>
          <div>
            <label>Interest Rate (% flat, e.g. 10)</label>
            <input type="number" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} required min="0" max="100" step="0.5" />
          </div>
          <div>
            <label>Duration (months)</label>
            <input type="number" value={form.durationMonths} onChange={e => setForm(f => ({ ...f, durationMonths: e.target.value }))} required min="1" step="1" />
          </div>

          {preview && (
            <div style={{ padding: 12, background: '#f0f8f0', borderRadius: 8, marginTop: 12, fontSize: 14 }}>
              <strong>Preview:</strong><br />
              Total interest: KES {preview.totalInterest.toLocaleString()}<br />
              Total due: KES {preview.totalDue.toLocaleString()}<br />
              Monthly instalment: KES {preview.monthly.toLocaleString()}<br />
              <small>Quorum needed: majority of active members</small>
            </div>
          )}

          <button type="submit" style={{ marginTop: 12 }}>Submit Application</button>
        </form>
      )}

      {loans.length === 0 ? (
        <p>No loans recorded.</p>
      ) : (
        loans.map(loan => (
          <LoanCard
            key={loan._id}
            loan={loan}
            chamaId={chamaId}
            members={members}
            onUpdate={loadData}
          />
        ))
      )}
    </div>
  );
};

export default Loans;