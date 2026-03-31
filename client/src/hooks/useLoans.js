import { useState, useEffect } from 'react';
import api from '../api/axios';
import { fetchLoans, voteOnLoan, recordRepayment as recordRepaymentAPI } from '../api/loans';

export const useLoans = (chamaId) => {
    const [pendingLoans, setPendingLoans] = useState([]);
    const [activeLoans, setActiveLoans] = useState([]);
    const [settledLoans, setSettledLoans] = useState([]);
    const [overdueLoans, setOverdueLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chamaId) return;

        const loadLoans = async () => {
            setLoading(true);
            try {
                const res = await fetchLoans(chamaId);
                const allLoans = res.data.loans || [];

                const pending = allLoans.filter(l => l.status === 'pending');
                const active = allLoans.filter(l => l.status === 'active');
                const settled = allLoans.filter(l => l.status === 'settled');
                
                const overdue = active.filter(l => new Date(l.dueDate) < new Date());

                setPendingLoans(pending);
                setActiveLoans(active);
                setSettledLoans(settled);
                setOverdueLoans(overdue);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load loans');
                setPendingLoans([]);
                setActiveLoans([]);
                setSettledLoans([]);
                setOverdueLoans([]);
            } finally {
                setLoading(false);
            }
        };

        loadLoans();
    }, [chamaId]);

    const vote = async (loanId, voteVal, reason = '') => {
        try {
            await voteOnLoan(chamaId, loanId, voteVal, reason);
            // Refetch loans after voting
            const res = await fetchLoans(chamaId);
            const allLoans = res.data.loans || [];

            const pending = allLoans.filter(l => l.status === 'pending');
            const active = allLoans.filter(l => l.status === 'active');
            const settled = allLoans.filter(l => l.status === 'settled');
            const overdue = active.filter(l => new Date(l.dueDate) < new Date());

            setPendingLoans(pending);
            setActiveLoans(active);
            setSettledLoans(settled);
            setOverdueLoans(overdue);
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to vote on loan');
        }
    };

    const recordRepayment = async (loanId, data) => {
        try {
            await recordRepaymentAPI(chamaId, loanId, data);
            // Refetch loans after recording repayment
            const res = await fetchLoans(chamaId);
            const allLoans = res.data.loans || [];

            const pending = allLoans.filter(l => l.status === 'pending');
            const active = allLoans.filter(l => l.status === 'active');
            const settled = allLoans.filter(l => l.status === 'settled');
            const overdue = active.filter(l => new Date(l.dueDate) < new Date());

            setPendingLoans(pending);
            setActiveLoans(active);
            setSettledLoans(settled);
            setOverdueLoans(overdue);
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to record repayment');
        }
    };

    return {
        pendingLoans,
        activeLoans,
        settledLoans,
        overdueLoans,
        loading,
        error,
        vote,
        recordRepayment,
    };
};
