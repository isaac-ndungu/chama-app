import React from 'react'
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChamaContext } from '../context/ChamaContext';
import { fetchAuditLog } from '../api/audit';
import { formatAuditEntry } from '../utils/auditMessages';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AuditLog = () => {
  const { chamaId } = useParams();
  const { chama } = useChamaContext();
  const [logs, setLogs] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const LIMIT = 25;

  const loadLogs = async (newSkip = 0) => {
    setLoading(true);
    try {
      const res = await fetchAuditLog(chamaId, { limit: LIMIT, skip: newSkip });
      const newLogs = res.data.logs;
      setLogs(prev => newSkip === 0 ? newLogs : [...prev, ...newLogs]);
      setHasMore(newLogs.length === LIMIT);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(0); }, [chamaId]);

  const loadMore = () => {
    const newSkip = skip + LIMIT;
    setSkip(newSkip);
    loadLogs(newSkip);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h2>Audit Log — {chama?.name}</h2>
      <p style={{ fontSize: 13, color: '#666' }}>All financial actions are recorded and cannot be edited or deleted.</p>

      {logs.map(log => (
        <div key={log._id} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#999', minWidth: 120 }}>
            {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}
          </div>
          <div style={{ fontSize: 14 }}>{formatAuditEntry(log)}</div>
        </div>
      ))}

      {loading && <p>Loading...</p>}
      {!loading && hasMore && (
        <button onClick={loadMore} style={{ marginTop: 16 }}>Load more</button>
      )}
      {!loading && logs.length === 0 && <p>No audit entries yet.</p>}
    </div>
  );
};

export default AuditLog;