import React from 'react'
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyChamas, createChama } from '../api/chamas';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chamas, setChamas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', contributionAmount: '', meetingFrequency: 'monthly' });

  useEffect(() => {
    fetchMyChamas()
      .then(res => setChamas(res.data.chamas))
      .catch(() => toast.error('Failed to load chamas'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createChama({
        ...form,
        contributionAmount: parseInt(form.contributionAmount, 10)
      });
      toast.success('Chama created!');
      navigate(`/chamas/${res.data.chama._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create chama');
    }
  };

  if (loading) return <div>Loading your chamas...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, {user?.name}</h1>
        <button onClick={logout}>Sign Out</button>
      </div>

      <h2>Your Chamas</h2>

      {chamas.length === 0 ? (
        <div>
          <p>You're not a member of any chama yet.</p>
          <button onClick={() => setShowCreateForm(true)}>Create a Chama</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 16 }}>
            {chamas.map(chama => (
              <Link
                key={chama._id}
                to={`/chamas/${chama._id}`}
                style={{ display: 'block', padding: 16, border: '1px solid #ccc', borderRadius: 8, textDecoration: 'none', color: 'inherit' }}
              >
                <strong>{chama.name}</strong>
                <span style={{ marginLeft: 12, color: '#666' }}>Your role: {chama.myRole}</span>
                <span style={{ marginLeft: 12, color: '#666' }}>KES {chama.contributionAmount.toLocaleString()}/month</span>
              </Link>
            ))}
          </div>
          <button onClick={() => setShowCreateForm(true)} style={{ marginTop: 16 }}>
            + Create Another Chama
          </button>
        </>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreate} style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Create New Chama</h3>
          <div><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div>
            <label>Monthly Contribution (KES)</label>
            <input type="number" value={form.contributionAmount} onChange={e => setForm(f => ({ ...f, contributionAmount: e.target.value }))} required min="1" step="1" />
          </div>
          <div>
            <label>Meeting Frequency</label>
            <select value={form.meetingFrequency} onChange={e => setForm(f => ({ ...f, meetingFrequency: e.target.value }))}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button type="submit">Create Chama</button>
          <button type="button" onClick={() => setShowCreateForm(false)} style={{ marginLeft: 8 }}>Cancel</button>
        </form>
      )}
    </div>
  );
};

export default Dashboard;