import { useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentCycle,
  fetchCycleHistory,
  recordDisbursement as apiDisburse,
  confirmReceipt as apiConfirm,
  createNextCycle as apiCreate,
} from '../api/cycles';
import toast from 'react-hot-toast';

export function useCycle(chamaId) {
  const [cycle, setCycle]     = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!chamaId) return;
    setLoading(true);
    setError(null);
    try {
      const [currRes, histRes] = await Promise.all([
        fetchCurrentCycle(chamaId),
        fetchCycleHistory(chamaId),
      ]);
      setCycle(currRes.data.cycle);
      setHistory(histRes.data.cycles || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load cycle');
    } finally {
      setLoading(false);
    }
  }, [chamaId]);

  useEffect(() => { load(); }, [load]);

  // Officers: record that the pot was paid out via M-Pesa
  const disburse = async (cycleId, disbursementRef, disbursedAmount) => {
    await apiDisburse(chamaId, cycleId, { disbursementRef, disbursedAmount });
    toast.success('Pot disbursement recorded - awaiting recipient confirmation');
    await load();
  };

  // Recipient: confirm they received the pot
  const confirmReceipt = async (cycleId) => {
    await apiConfirm(chamaId, cycleId);
    toast.success('Receipt confirmed! This cycle is now closed.');
    await load();
  };

  const createNext = async (startDate, endDate) => {
    await apiCreate(chamaId, { startDate, endDate });
    toast.success('New cycle started!');
    await load();
  };

  const isActive    = cycle?.status === 'active' || cycle?.status === 'collection';
  const isDisbursed = cycle?.status === 'disbursed';
  const isClosed    = cycle?.status === 'closed';

  //  determine currentPosition in rotation
  const closedCount = history.filter(c => c.status === 'closed').length;
  // The next position to receive 
  const currentPosition = closedCount + 1;

  return {
    cycle,
    history,
    loading,
    error,
    reload: load,
    disburse,
    confirmReceipt,
    createNext,
    isActive,
    isDisbursed,
    isClosed,
    currentPosition,
  };
}