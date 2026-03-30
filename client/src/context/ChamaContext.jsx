import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const ChamaContext = createContext(null);

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
};

export const ChamaProvider = ({ chamaId, children }) => {
    const [chama, setChama] = useState(null);
    const [membership, setMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chamaId) return;
        const fetchChama = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/chamas/${chamaId}`);
                setChama(res.data.chama);
                setMembership({ role: res.data.myRole });
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load chama');
            } finally {
                setLoading(false);
            }
        };
        fetchChama();
    }, [chamaId]);

    const can = (action) => {
        if (!membership) return false;
        return ROLE_PERMISSIONS[action]?.includes(membership.role) ?? false;
    };

    return (
        <ChamaContext.Provider value={{ chama, membership, can, loading, error }}>
            {children}
        </ChamaContext.Provider>
    );
};

export const useChamaContext = () => {
    const ctx = useContext(ChamaContext);
    if (!ctx) throw new Error('useChamaContext must be used within ChamaProvider');
    return ctx;
};