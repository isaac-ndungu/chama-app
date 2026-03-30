import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, silentRefresh } from '../api/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);  // true until silent refresh completes

    //  try to restore session via refresh token cookie on app mount
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const res = await silentRefresh();
                window.__accessToken__ = res.data.accessToken;
                // Fetch user profile using the new access token
                const { default: api } = await import('../api/axios');
                const profileRes = await api.get('/auth/me');  
                setUser(profileRes.data.user);
            } catch {
                // No valid refresh token, user must log in
                setUser(null);
            } finally {
                setLoading(false);  // unblock ProtectedRoute regardless of outcome
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

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            window.__accessToken__ = null;
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
