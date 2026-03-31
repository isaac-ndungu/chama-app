import { useState, useEffect } from 'react';
import { fetchContributions, fetchPending, recordContribution, verifyContribution } from '../api/contributions';

export const useContributions = (chamaId) => {
    const [contributions, setContributions] = useState([]);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chamaId) return;

        const loadContributions = async () => {
            setLoading(true);
            try {
                const [contribRes, pendingRes] = await Promise.all([
                    fetchContributions(chamaId),
                    fetchPending(chamaId),
                ]);

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
        };

        loadContributions();
    }, [chamaId]);

    const verify = async (contributionId) => {
        try {
            await verifyContribution(chamaId, contributionId);
            // Refetch contributions after verification
            const [contribRes, pendingRes] = await Promise.all([
                fetchContributions(chamaId),
                fetchPending(chamaId),
            ]);

            setContributions(contribRes.data.contributions || []);
            setPending(pendingRes.data.contributions || []);
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to verify contribution');
        }
    };

    const record = async (data) => {
        try {
            await recordContribution(chamaId, data);
            // Refetch contributions after recording
            const [contribRes, pendingRes] = await Promise.all([
                fetchContributions(chamaId),
                fetchPending(chamaId),
            ]);

            setContributions(contribRes.data.contributions || []);
            setPending(pendingRes.data.contributions || []);
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to record contribution');
        }
    };

    return {
        contributions,
        pending,
        loading,
        error,
        verify,
        record,
    };
};
