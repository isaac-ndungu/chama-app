import { useAuth } from '../../context/AuthContext';

const LoanVoterRoll = ({ approvals, rejections, members, borrowerId }) => {
    const { user } = useAuth();

    return (
        <div style={{ marginTop: 12 }}>
            <strong>Votes:</strong>
            {members
                .filter(m => m.userId._id !== borrowerId)
                .map(m => {
                    const approved = approvals.find(a => a.memberId === m.userId._id || a.memberId?._id === m.userId._id);
                    const rejected = rejections.find(r => r.memberId === m.userId._id || r.memberId?._id === m.userId._id);
                    const isMe = m.userId._id === user.id;

                    return (
                        <div key={m.userId._id} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13 }}>
                            <span style={{ fontWeight: isMe ? 'bold' : 'normal' }}>{m.userId.name}</span>
                            <span style={{ color: '#999' }}>({m.role})</span>
                            {approved && <span style={{ color: 'green' }}>✓ Approved{approved.note ? ` — "${approved.note}"` : ''}</span>}
                            {rejected && <span style={{ color: 'red' }}>✗ Rejected — "{rejected.reason}"</span>}
                            {!approved && !rejected && <span style={{ color: '#999' }}>— Not voted yet</span>}
                        </div>
                    );
                })}
        </div>
    );
};

export default LoanVoterRoll;
