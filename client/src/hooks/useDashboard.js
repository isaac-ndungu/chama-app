import { useState, useEffect } from 'react';
import api from '../api/axios';

export const useDashboard = (chamaId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chamaId) return;

        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/chamas/${chamaId}/dashboard`);
                setData(res.data);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load dashboard');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [chamaId]);

    return {
        data,
        loading,
        error,
        cycle: data?.cycle,
        currentPosition: data?.cycle?.currentPosition || 0,
    };
};
