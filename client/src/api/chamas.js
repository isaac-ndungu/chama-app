import api from './axios';

export const fetchMyChamas = () => api.get('/chamas/mine');
export const createChama = (data) => api.post('/chamas', data);
export const fetchDashboard = (chamaId) => api.get(`/chamas/${chamaId}/dashboard`);