import React from 'react'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      console.log('Full error:', err);
      console.log('Response:', err.response);
      console.log('Message:', err.message);
      toast.error(err.response?.data?.error || 'Registration failed');

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      <div className="hidden md:flex w-1/2 bg-[#1a140f] text-white flex-col justify-center px-16">
        <h1 className="text-3xl font-semibold text-amber-500 mb-4"> ChamaLedger </h1>
        <p className="text-gray-300 mb-8">  Group Financial Transparency </p>

      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2"> Create your account </h2>
          <p className="text-gray-500 mb-6"> Get started with your chama </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Full Name
              </label>
              <input type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Email
              </label>
              <input type="email"
                name="email"
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
                Phone
              </label>
              <input type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="+254712345678"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Password
              </label>
              <input type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 transition" >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link to="/login"
              className="text-amber-600 font-medium hover:underline" >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


export default Register