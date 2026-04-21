import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-sm text-gray-400 mb-1';

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ username: '', email: '', password: '', confirm: '', department: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const clearErr = () => setError('');

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true); clearErr();
    try {
      const res = await api.post('/auth/login', login);
      const { token, user } = res.data;
      if (!['operator', 'admin'].includes(user.role)) {
        setError('This portal is for hospital staff only.');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (reg.password !== reg.confirm) { setError('Passwords do not match'); return; }
    if (reg.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); clearErr();
    try {
      // Hospital staff register as 'operator' role
      await api.post('/auth/register', {
        username: reg.username,
        email: reg.email,
        password: reg.password,
        role: 'operator',
      });
      setSuccess('Account created! You can now sign in.');
      setTab('login');
      setLogin({ email: reg.email, password: '' });
      setReg({ username: '', email: '', password: '', confirm: '', department: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Email or username may already exist.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">🏥</div>
          <h1 className="text-2xl font-bold text-white">Hospital Staff Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Disaster Response MIS</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800">
          {[['login', 'Sign In'], ['register', 'Register']].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); clearErr(); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Success banner */}
        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
            ✅ {success}
          </div>
        )}

        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={lbl}>Staff Email</label>
                <input type="email" value={login.email} onChange={e => setLogin(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="staff@hospital.gov" />
              </div>
              <div>
                <label className={lbl}>Password</label>
                <input type="password" value={login.password} onChange={e => setLogin(f => ({ ...f, password: e.target.value }))} required
                  className={inp} placeholder="••••••••" />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="pt-1 border-t border-gray-800 mt-2">
                <p className="text-gray-600 text-xs text-center mt-3">Demo: hospital@disaster.gov / hospital123</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-2">
                <p className="text-blue-400 text-xs">Hospital staff accounts are created with <strong>Operator</strong> role, giving access to patient management and emergency coordination.</p>
              </div>
              <div>
                <label className={lbl}>Full Name / Username *</label>
                <input type="text" value={reg.username} onChange={e => setReg(f => ({ ...f, username: e.target.value }))} required
                  className={inp} placeholder="Dr. Jane Smith" />
              </div>
              <div>
                <label className={lbl}>Work Email *</label>
                <input type="email" value={reg.email} onChange={e => setReg(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="you@hospital.gov" />
              </div>
              <div>
                <label className={lbl}>Department (optional)</label>
                <input type="text" value={reg.department} onChange={e => setReg(f => ({ ...f, department: e.target.value }))}
                  className={inp} placeholder="e.g. Emergency, ICU, Surgery" />
              </div>
              <div>
                <label className={lbl}>Password *</label>
                <input type="password" value={reg.password} onChange={e => setReg(f => ({ ...f, password: e.target.value }))} required
                  className={inp} placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className={lbl}>Confirm Password *</label>
                <input type="password" value={reg.confirm} onChange={e => setReg(f => ({ ...f, confirm: e.target.value }))} required
                  className={inp} placeholder="••••••••" />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Creating account...' : 'Create Staff Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Other portals:{' '}
          <a href="http://localhost:3012" className="text-orange-400 hover:underline">Citizen</a> ·{' '}
          <a href="http://localhost:3013" className="text-red-400 hover:underline">Rescue</a> ·{' '}
          <a href="http://localhost:3010" className="text-purple-400 hover:underline">Admin</a>
        </p>
      </div>
    </div>
  );
}
