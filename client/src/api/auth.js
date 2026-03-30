import api from './axios';
import axios from 'axios';

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const logoutUser = () => api.post('/auth/logout');

// tries to get a new access token using the httpOnly cookie
export const silentRefresh = () => axios.post('/api/auth/refresh', {}, { withCredentials: true });
