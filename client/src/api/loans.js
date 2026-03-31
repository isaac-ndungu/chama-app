import api from './axios';

export const fetchLoans = (chamaId, params = {}) =>
  api.get(`/chamas/${chamaId}/loans`, { params });

export const applyForLoan = (chamaId, data) =>
  api.post(`/chamas/${chamaId}/loans`, data);

export const voteOnLoan = (chamaId, loanId, vote, reason = '') =>
  api.post(`/chamas/${chamaId}/loans/${loanId}/vote`, { vote, reason });

export const recordRepayment = (chamaId, loanId, data) =>
  api.post(`/chamas/${chamaId}/loans/${loanId}/repayments`, data);