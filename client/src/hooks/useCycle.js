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
  const [cycle, setCycle] = useState(null);
  const [history, setHistory] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rotationComplete, setRotationComplete] = useState(false);
  const [rotationNumber, setRotationNumber] = useState(1);

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
      setMemberCount(histRes.data.memberCount || 0);

      // Derive rotation state from history
      const mc = histRes.data.memberCount || 1;
      const closed = (histRes.data.cycles || []).filter(c => c.status === 'closed');
      const lastClosed = closed[closed.length - 1];
      if (lastClosed) {
        setRotationNumber(Math.ceil(lastClosed.cycleNumber / mc));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load cycle');
    } finally {
      setLoading(false);
    }
  }, [chamaId]);

  useEffect(() => { load(); }, [load]);

  // Officers: record M-Pesa payout to the recipient
  const disburse = async (cycleId, disbursementRef, disbursedAmount) => {
    await apiDisburse(chamaId, cycleId, { disbursementRef, disbursedAmount });
    toast.success('Pot disbursement recorded — awaiting recipient confirmation');
    await load();
  };

  // Recipient: confirm they received 
  const confirmReceipt = async (cycleId) => {
    const res = await apiConfirm(chamaId, cycleId);
    const { rotationComplete: done, rotationNumber: rNum, message, nextCycle } = res.data;

    setRotationComplete(done);
    setRotationNumber(rNum);

    if (done) {
      toast.success(`🎊 Rotation ${rNum} complete! Every member has received the pot.`, {
        duration: 6000,
      });
    } else if (nextCycle) {
      toast.success(message || 'Receipt confirmed! Next round started automatically.', {
        duration: 5000,
      });
    } else {
      toast.success('Receipt confirmed!');
    }

    await load();
  };

  // Officers: manually start the first round OR restart after a full rotation
  const createNext = async (startDate, endDate) => {
    await apiCreate(chamaId, { startDate, endDate });
    setRotationComplete(false);
    toast.success('New round started!');
    await load();
  };

  const isActive = cycle?.status === 'active' || cycle?.status === 'collection';
  const isDisbursed = cycle?.status === 'disbursed';
  const isClosed = !cycle; // no active cycle means last one closed

  // Position within the current rotation 
  const positionInRotation = memberCount > 0 && cycle
    ? ((cycle.cycleNumber - 1) % memberCount) + 1
    : 0;

  // How many rounds into the current rotation are complete
  const roundsCompleteInRotation = memberCount > 0
    ? history.filter(c => {
      const rot = Math.ceil(c.cycleNumber / memberCount);
      return rot === rotationNumber && c.status === 'closed';
    }).length
    : 0;

  return {
    cycle,
    history,
    memberCount,
    loading,
    error,
    rotationComplete,
    rotationNumber,
    positionInRotation,
    roundsCompleteInRotation,
    reload: load,
    disburse,
    confirmReceipt,
    createNext,
    isActive,
    isDisbursed,
    isClosed,
  };
}