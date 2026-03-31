import api from './axios';

export const fetchContributions = (chamaId, params = {}) =>
    api.get(`/chamas/${chamaId}/contributions`, { params });

export const fetchPending = (chamaId) =>
    api.get(`/chamas/${chamaId}/contributions/pending`);

export const recordContribution = (chamaId, data) =>
    api.post(`/chamas/${chamaId}/contributions`, data);

export const verifyContribution = (chamaId, contributionId) =>
    api.patch(`/chamas/${chamaId}/contributions/${contributionId}/verify`);

export const disputeContribution = (chamaId, contributionId, note) =>
    api.patch(`/chamas/${chamaId}/contributions/${contributionId}/dispute`, { note });