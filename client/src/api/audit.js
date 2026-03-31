import api from './axios';

export const fetchAuditLog = (chamaId, params = {}) =>
    api.get(`/chamas/${chamaId}/audit`, { params });

export const exportAuditPDF = async (chamaId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.action) params.append('action', filters.action);
  if (filters.member) params.append('member', filters.member);

  const response = await api.get(`/chamas/${chamaId}/audit/export-pdf?${params}`, {
    responseType: 'blob',
  });

  // Create a blob URL and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `audit-log-${chamaId}-${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};