import axios from 'axios';

const api = axios.create({
    baseURL: '/api',       
    withCredentials: true,    // sends httpOnly cookie with every request
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach access token from memory
api.interceptors.request.use(
    (config) => {
        const token = window.__accessToken__;   // set by AuthContext after login
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle expired access tokens silently
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) c
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request until refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
                const newToken = res.data.accessToken;
                window.__accessToken__ = newToken;    // update in-memory store
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                window.__accessToken__ = null;
                window.location.href = '/login';     // session truly expired
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
