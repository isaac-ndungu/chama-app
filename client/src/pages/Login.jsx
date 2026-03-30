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
        </div>
      </div>
    </div>
  );
};

export default Login;
