import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 text-sm';
const lbl = 'block text-sm text-gray-400 mb-1';

const TEAM_TYPES = ['Medical', 'Fire', 'Rescue', 'Relief'];

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ username: '', email: '', password: '', confirm: '', teamType: 'Rescue', badgeNumber: '' });
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
      if (!['field_officer', 'operator', 'admin'].includes(user.role)) {
        setError('This portal is for rescue team members only.');
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
      // Rescue officers register as 'field_officer' role
      await api.post('/auth/register', {
        username: reg.username,
        email: reg.email,
        password: reg.password,
        role: 'field_officer',
      });
      setSuccess('Account created! You can now sign in.');
      setTab('login');
      setLogin({ email: reg.email, password: '' });
      setReg({ username: '', email: '', password: '', confirm: '', teamType: 'Rescue', badgeNumber: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Email or username may already exist.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">🚒</div>
          <h1 className="text-2xl font-bold text-white">Rescue Team Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Disaster Response MIS</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800">
          {[['login', 'Sign In'], ['register', 'Register']].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); clearErr(); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
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

        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-8">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={lbl}>Officer Email</label>
                <input type="email" value={login.email} onChange={e => setLogin(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="officer@rescue.gov" />
              </div>
              <div>
                <label className={lbl}>Password</label>
                <input type="password" value={login.password} onChange={e => setLogin(f => ({ ...f, password: e.target.value }))} required
                  className={inp} placeholder="••••••••" />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="pt-1 border-t border-gray-800 mt-2">
                <p className="text-gray-600 text-xs text-center mt-3">Demo: rescue@disaster.gov / rescue123</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-2">
                <p className="text-red-400 text-xs">Rescue officer accounts are created with <strong>Field Officer</strong> role, giving access to team status, assignments, and emergency reports.</p>
              </div>
              <div>
                <label className={lbl}>Officer Name / Username *</label>
                <input type="text" value={reg.username} onChange={e => setReg(f => ({ ...f, username: e.target.value }))} required
                  className={inp} placeholder="Officer John Doe" />
              </div>
              <div>
                <label className={lbl}>Official Email *</label>
                <input type="email" value={reg.email} onChange={e => setReg(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="you@rescue.gov" />
              </div>
              <div>
                <label className={lbl}>Team Type</label>
                <select value={reg.teamType} onChange={e => setReg(f => ({ ...f, teamType: e.target.value }))}
                  className={inp}>
                  {TEAM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Badge / ID Number (optional)</label>
                <input type="text" value={reg.badgeNumber} onChange={e => setReg(f => ({ ...f, badgeNumber: e.target.value }))}
                  className={inp} placeholder="e.g. RF-2024-001" />
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
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Creating account...' : 'Create Officer Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Other portals:{' '}
          <a href="http://localhost:3012" className="text-orange-400 hover:underline">Citizen</a> ·{' '}
          <a href="http://localhost:3011" className="text-blue-400 hover:underline">Hospital</a> ·{' '}
          <a href="http://localhost:3010" className="text-purple-400 hover:underline">Admin</a>
        </p>
      </div>
    </div>
  );
}
