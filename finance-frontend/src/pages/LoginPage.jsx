import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;
      if (!['finance_officer', 'admin'].includes(user.role)) {
        setError('This portal is for Finance Officers only.');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">💰</div>
          <h1 className="text-2xl font-bold text-white">Finance Officer Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Disaster Response MIS</p>
        </div>
        <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="finance@disaster.gov" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
              {loading ? 'Signing in...' : 'Sign In to Finance Portal'}
            </button>
          </form>
          <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <p className="text-emerald-400 text-xs text-center">Demo: finance@disaster.gov / finance123</p>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">
          Other portals: <a href="http://localhost:3010" className="text-purple-400 hover:underline">Admin</a> ·{' '}
          <a href="http://localhost:3012" className="text-orange-400 hover:underline">Citizen</a>
        </p>
      </div>
    </div>
  );
}
