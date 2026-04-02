import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('token');
        const error  = params.get('error');

        if (error || !token) {
          navigate('/login?error=google');
          return;
        }

        // Store token in memory first so axios interceptor can use it
        window.__accessToken__ = token;

        // Fetch full user profile passing token explicitly (interceptor timing)
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Set token + user atomically in AuthContext
        loginWithToken(token, res.data.user);

        navigate('/');
      } catch (err) {
        console.error('[AuthCallback] error:', err);
        window.__accessToken__ = null;
        navigate('/login?error=google');
      }
    };

    run();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      fontFamily: 'sans-serif',
      color: '#6b7280',
    }}>
      <div style={{
        width: 24, height: 24,
        border: '2px solid #e5e7eb',
        borderTopColor: '#b45309',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 14 }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthCallback;