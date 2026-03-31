import api from './axios';

export const fetchMyChamas = () => api.get('/chamas/mine');
export const createChama = (data) => api.post('/chamas', data);
export const fetchDashboard = (chamaId) => api.get(`/chamas/${chamaId}/dashboard`);
export const updateChamaSettings = (chamaId, data) => api.put(`/chamas/${chamaId}`, data);
export const closeCycle = (chamaId) => api.post(`/chamas/${chamaId}/cycle/close`);
export const startCycle = (chamaId) => api.post(`/chamas/${chamaId}/cycle/start`);