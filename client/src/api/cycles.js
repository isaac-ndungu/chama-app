import api from './axios';

export const fetchCurrentCycle = (chamaId) =>
  api.get(`/chamas/${chamaId}/cycles/current`);

export const fetchCycleHistory = (chamaId) =>
  api.get(`/chamas/${chamaId}/cycles`);

export const createNextCycle = (chamaId, data) =>
  api.post(`/chamas/${chamaId}/cycles`, data);

export const recordDisbursement = (chamaId, cycleId, data) =>
  api.patch(`/chamas/${chamaId}/cycles/${cycleId}/disburse`, data);

export const confirmReceipt = (chamaId, cycleId) =>
  api.patch(`/chamas/${chamaId}/cycles/${cycleId}/confirm-receipt`);