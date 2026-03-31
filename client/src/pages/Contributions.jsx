import React from 'react'
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChamaContext } from '../context/ChamaContext';
import { fetchContributions, fetchPending } from '../api/contributions';
import ContributionForm from '../components/contributions/ContributionForm';
import PendingVerificationQueue from '../components/contributions/PendingVerificationQueue';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Contributions = () => {
  const { chamaId } = useParams();
  const { can, chama } = useChamaContext();
  const [contributions, setContributions] = useState([]);
  const [pending, setPending] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [contribRes, pendingRes, memberRes] = await Promise.all([
        fetchContributions(chamaId, { status: 'verified' }),
        can('verify_contribution') ? fetchPending(chamaId) : Promise.resolve({ data: { contributions: [] } }),
        import('../api/axios').then(m => m.default.get(`/chamas/${chamaId}/members`))
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

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h2>Contributions — {chama?.name}</h2>

      {can('record_contribution') && (
        <ContributionForm
          chamaId={chamaId}
          members={members}
          cycleId={null}   // TODO: pass active cycle ID in Step 35
          onSuccess={loadData}
        />
      )}

      {can('verify_contribution') && (
        <PendingVerificationQueue
          chamaId={chamaId}
          pending={pending}
          onUpdate={loadData}
        />
      )}

      <h3>Verified Contributions</h3>
      {contributions.length === 0 ? (
        <p>No verified contributions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Member</th>
              <th style={{ textAlign: 'right', padding: '8px 4px' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>M-Pesa Ref</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Verified By</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map(c => (
              <tr key={c._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 4px' }}>{c.memberId?.name}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>KES {c.amount.toLocaleString()}</td>
                <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{c.mpesaRef}</td>
                <td style={{ padding: '8px 4px' }}>{format(new Date(c.paymentDate), 'dd MMM yyyy')}</td>
                <td style={{ padding: '8px 4px', color: '#666' }}>{c.verifiedBy?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Contributions;