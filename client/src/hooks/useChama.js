import { useState, useEffect } from 'react';
import api from '../api/axios';

const ROLE_PERMISSIONS = {
    record_contribution: ['chairman', 'treasurer'],
    verify_contribution: ['chairman', 'treasurer'],
    dispute_contribution: ['chairman', 'treasurer'],
    apply_for_loan: ['chairman', 'treasurer'],
    vote_on_loan: ['chairman', 'treasurer', 'member'],
    record_repayment: ['chairman', 'treasurer'],
    view_full_audit: ['chairman', 'treasurer'],
    view_all_ledgers: ['chairman', 'treasurer'],
    manage_members: ['chairman'],
    generate_all_pdfs: ['chairman', 'treasurer'],
    edit_settings: ['chairman'],
};

export const useChama = (chamaId) => {
    const [chama, setChama] = useState(null);
    const [role, setRole] = useState(null);
    const [memberCount, setMemberCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chamaId) return;

        const fetchChama = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/chamas/${chamaId}`);
                setChama(res.data.chama);
                setRole(res.data.myRole);
                setMemberCount(res.data.memberCount || 0);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load chama');
                setChama(null);
            } finally {
                setLoading(false);
            }
        };

        fetchChama();
    }, [chamaId]);

    const can = (action) => {
        if (!role) return false;
        return ROLE_PERMISSIONS[action]?.includes(role) ?? false;
    };

    return {
        chama,
        role,
        memberCount,
        loading,
        error,
        can,
    };
};
