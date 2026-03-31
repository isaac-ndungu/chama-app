import { useState, useEffect } from 'react';
import api from '../api/axios';

const ROLE_PERMISSIONS = {
    record_contribution: ['chairperson', 'treasurer'],
    verify_contribution: ['chairperson', 'treasurer'],
    dispute_contribution: ['chairperson', 'treasurer'],
    apply_for_loan: ['chairperson', 'treasurer'],
    vote_on_loan: ['chairperson', 'treasurer', 'member'],
    record_repayment: ['chairperson', 'treasurer'],
    view_full_audit: ['chairperson', 'treasurer'],
    view_all_ledgers: ['chairperson', 'treasurer'],
    manage_members: ['chairperson'],
    generate_all_pdfs: ['chairperson', 'treasurer'],
    edit_settings: ['chairperson'],
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
