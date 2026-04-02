import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, silentRefresh } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Try to restore session via refresh token cookie on app mount
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const res = await silentRefresh();
                window.__accessToken__ = res.data.accessToken;
                const { default: api } = await import('../api/axios');
                const profileRes = await api.get('/auth/me');
                setUser(profileRes.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async (email, password) => {
        const res = await loginUser({ email, password });
        window.__accessToken__ = res.data.accessToken;
        setUser(res.data.user);
        return res.data;
    };

    const register = async (data) => {
        const res = await registerUser(data);
        window.__accessToken__ = res.data.accessToken;
        setUser(res.data.user);
        return res.data;
    };

    // Used by AuthCallback after Google OAuth — sets token + user atomically
    const loginWithToken = (accessToken, userData) => {
        window.__accessToken__ = accessToken;
        setUser(userData);
    };

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            window.__accessToken__ = null;
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};