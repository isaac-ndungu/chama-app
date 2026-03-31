import { useState } from 'react';
import { verifyContribution, disputeContribution } from '../../api/contributions';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PendingVerificationQueue = ({ chamaId, pending, onUpdate }) => {
    const { user } = useAuth();
    const [processingId, setProcessingId] = useState(null);

    const handleVerify = async (contrib) => {
        if (contrib.recordedBy._id === user.id) {
            toast.error('You cannot verify your own entry');
            return;
        }
        setProcessingId(contrib._id);
        try {
            await verifyContribution(chamaId, contrib._id);
            toast.success('Contribution verified');
            onUpdate();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Verification failed');
        } finally {
            setProcessingId(null);
        }
    };

    if (pending.length === 0) return <p style={{ color: '#666' }}>No contributions pending verification.</p>;

    return (
        <div>
            <h3>Pending Verification ({pending.length})</h3>
            {pending.map(c => {
                const isSelf = c.recordedBy._id === user.id;
                return (
                    <div key={c._id} style={{ padding: 12, border: '1px solid #f90', borderRadius: 8, marginBottom: 8 }}>
                        <div><strong>{c.memberId.name}</strong> — KES {c.amount.toLocaleString()}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Ref: {c.mpesaRef} | Date: {format(new Date(c.paymentDate), 'dd MMM yyyy')}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Recorded by: {c.recordedBy.name}</div>
                        <div style={{ marginTop: 8 }}>
                            <button
                                onClick={() => handleVerify(c)}
                                disabled={isSelf || processingId === c._id}
                                title={isSelf ? 'You recorded this entry — another admin must verify it' : ''}
                                style={{ opacity: isSelf ? 0.5 : 1 }}
                            >
                                {processingId === c._id ? '...' : 'Verify'}
                            </button>
                            {isSelf && <small style={{ marginLeft: 8, color: '#999' }}>Cannot verify your own entry</small>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PendingVerificationQueue;