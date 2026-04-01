import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api`
        : '/api',
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
let refreshFailed = false;

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        refreshFailed = false;
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If refresh itself failed, do not re-enter refresh loop
        const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');
        if (isRefreshCall) {
            refreshFailed = true;
            window.__accessToken__ = null;
            return Promise.reject(error);
        }

        if (refreshFailed) {
            return Promise.reject(error);
        }

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
                const res = await api.post('/auth/refresh');
                const newToken = res.data.accessToken;
                refreshFailed = false;
                window.__accessToken__ = newToken;    // update in-memory store
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                refreshFailed = true;
                processQueue(refreshError, null);
                window.__accessToken__ = null;
                // Let AuthContext handle redirect from 401 / no user state
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
