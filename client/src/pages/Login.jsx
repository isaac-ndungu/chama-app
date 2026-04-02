import React from 'react'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex">

      <div className="hidden md:flex w-1/2 bg-[#1a140f] text-white flex-col justify-center px-16">
        <h1 className="text-3xl font-semibold text-amber-500 mb-4">ChamaLedger </h1>
        <p className="text-gray-300 mb-8">Group Financial Transparency </p>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2"> Welcome back </h2>
          <p className="text-gray-500 mb-6"> Sign in to your chama account </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Email
              </label>
              <input type="email" name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Password
              </label>
              <input type="password" name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="text-right mt-1">
                <span className="text-sm text-gray-400 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
            </div>

            <button type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 transition" >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link to="/register"
              className="text-amber-600 font-medium hover:underline" >
              Register
            </Link>
          </p>

          <div className='text-center text-gray-500 my-4'>or</div>

          <button
            onClick={handleGoogleLogin}
            className="mt-6 pointer-cursor flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
