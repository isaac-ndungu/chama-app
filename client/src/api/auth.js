import api from './axios';

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const logoutUser = () => api.post('/auth/logout');

// tries to get a new access token using the httpOnly cookie (via API proxy)
export const silentRefresh = () => api.post('/auth/refresh');
