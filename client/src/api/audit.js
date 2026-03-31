import api from './axios';
export const fetchAuditLog = (chamaId, params = {}) =>
    api.get(`/chamas/${chamaId}/audit`, { params });