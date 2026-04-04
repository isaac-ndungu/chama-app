import { useState, useEffect, useCallback } from 'react';
import {
  fetchContributions,
  fetchPending,
  recordContribution,
  verifyContribution,
} from '../api/contributions';

export const useContributions = (chamaId, isOfficer = false) => {
  const [contributions, setContributions] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!chamaId) return;
    setLoading(true);
    try {
      const requests = [
        fetchContributions(chamaId),
        
        isOfficer
          ? fetchPending(chamaId)
          : Promise.resolve({ data: { contributions: [] } }),
      ];

      const [contribRes, pendingRes] = await Promise.all(requests);

      setContributions(contribRes.data.contributions || []);
      setPending(pendingRes.data.contributions || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load contributions');
      setContributions([]);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [chamaId, isOfficer]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const verify = async (contributionId) => {
    await verifyContribution(chamaId, contributionId);
    await loadAll();
  };

  const record = async (data) => {
    // Return the full contribution object so the receipt modal can use it
    const res = await recordContribution(chamaId, data);
    await loadAll();
    return res.data.contribution;
  };

  return {
    contributions,
    pending,
    loading,
    error,
    reload: loadAll,
    verify,
    record,
  };
};