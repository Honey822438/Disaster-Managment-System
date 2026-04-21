import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const PORTALS = [
  {
    id: 'citizen',
    label: '🚨 CITIZEN',
    subtitle: 'Report Emergency',
    border: 'border-orange-500',
    iconBg: 'bg-orange-500/10',
    accent: 'bg-orange-500 hover:bg-orange-600',
    text: 'text-orange-400',
  },
  {
    id: 'hospital',
    label: '🏥 HOSPITAL',
    subtitle: 'Staff Portal',
    border: 'border-blue-500',
    iconBg: 'bg-blue-500/10',
    accent: 'bg-blue-500 hover:bg-blue-600',
    text: 'text-blue-400',
  },
  {
    id: 'rescue',
    label: '🚒 RESCUE TEAM',
    subtitle: 'Field Portal',
    border: 'border-red-500',
    iconBg: 'bg-red-500/10',
    accent: 'bg-red-500 hover:bg-red-600',
    text: 'text-red-400',
  },
  {
    id: 'admin',
    label: '🛡️ ADMIN/OPS',
    subtitle: 'Control Center',
    border: 'border-purple-500',
    iconBg: 'bg-purple-500/10',
    accent: 'bg-purple-500 hover:bg-purple-600',
    text: 'text-purple-400',
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedPortal, setSelectedPortal] = useState(null);
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', username: '', confirmPassword: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const portal = PORTALS.find((p) => p.id === selectedPortal);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(form.email, form.password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Store selected portal
      localStorage.setItem('selectedPortal', selectedPortal);
      // Redirect based on portal
      if (selectedPortal === 'citizen') navigate('/citizen-portal');
      else if (selectedPortal === 'hospital') navigate('/hospital-portal');
      else if (selectedPortal === 'rescue') navigate('/rescue-portal');
      else navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/register-citizen', {
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      // Auto-login after register
      const result = await login(form.email, form.password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      localStorage.setItem('selectedPortal', 'citizen');
      navigate('/citizen-portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Portal selection screen
  if (!selectedPortal) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-4xl">🛡️</span>
            <h1 className="text-3xl font-bold text-white">Smart Disaster Response MIS</h1>
          </div>
          <p className="text-gray-400">Select your portal to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {PORTALS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPortal(p.id); setTab('login'); setError(''); }}
              className={`bg-gray-900 border-2 ${p.border} rounded-2xl p-8 flex flex-col items-center gap-3 hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className={`w-16 h-16 rounded-full ${p.iconBg} flex items-center justify-center text-3xl`}>
                {p.label.split(' ')[0]}
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${p.text}`}>{p.label.split(' ').slice(1).join(' ')}</p>
                <p className="text-gray-400 text-sm mt-1">{p.subtitle}</p>
              </div>
              <span className={`mt-2 px-4 py-1.5 rounded-lg text-white text-sm font-medium ${p.accent}`}>
                Enter Portal
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Login / Register form
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <p className={`text-2xl font-bold ${portal.text}`}>{portal.label}</p>
          <p className="text-gray-400 text-sm mt-1">{portal.subtitle}</p>
        </div>

        {/* Tabs — only citizen has register */}
        {selectedPortal === 'citizen' && (
          <div className="flex mb-6 bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'login' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'register' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>
        )}

        <div className={`bg-gray-900 border-2 ${portal.border} rounded-2xl p-8`}>
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-lg text-white font-semibold transition-colors ${portal.accent} disabled:opacity-50`}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="johndoe"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="+1234567890"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-white font-semibold bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <button
          onClick={() => { setSelectedPortal(null); setError(''); setForm({ email: '', password: '', username: '', confirmPassword: '', phone: '' }); }}
          className="mt-5 w-full text-center text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back to Portal Selection
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
