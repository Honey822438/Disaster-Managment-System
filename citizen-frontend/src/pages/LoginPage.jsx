import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm';
const lbl = 'block text-sm text-gray-400 mb-1';

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ username: '', email: '', password: '', confirm: '', phone: '' });
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
      if (!['field_officer', 'admin'].includes(user.role)) {
        setError('This portal is for citizens only. Use the correct portal.');
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
      // Citizens register as 'field_officer' role via the citizen endpoint
      await api.post('/auth/register-citizen', {
        username: reg.username,
        email: reg.email,
        password: reg.password,
        phone: reg.phone || undefined,
      });
      // Auto-login after register
      const res = await api.post('/auth/login', { email: reg.email, password: reg.password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Email or username may already exist.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">🚨</div>
          <h1 className="text-2xl font-bold text-white">Citizen Emergency Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Disaster Response MIS</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800">
          {[['login', 'Sign In'], ['register', 'Register']].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); clearErr(); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
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

        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-8">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={lbl}>Email</label>
                <input type="email" value={login.email} onChange={e => setLogin(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="you@example.com" />
              </div>
              <div>
                <label className={lbl}>Password</label>
                <input type="password" value={login.password} onChange={e => setLogin(f => ({ ...f, password: e.target.value }))} required
                  className={inp} placeholder="••••••••" />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-gray-600 text-xs pt-1">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setTab('register'); clearErr(); }}
                  className="text-orange-400 hover:underline">Register here</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-2">
                <p className="text-orange-400 text-xs">Register to report emergencies and track response in your area. Free and takes 30 seconds.</p>
              </div>
              <div>
                <label className={lbl}>Username *</label>
                <input type="text" value={reg.username} onChange={e => setReg(f => ({ ...f, username: e.target.value }))} required
                  className={inp} placeholder="johndoe" />
              </div>
              <div>
                <label className={lbl}>Email *</label>
                <input type="email" value={reg.email} onChange={e => setReg(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="you@example.com" />
              </div>
              <div>
                <label className={lbl}>Phone Number (optional)</label>
                <input type="tel" value={reg.phone} onChange={e => setReg(f => ({ ...f, phone: e.target.value }))}
                  className={inp} placeholder="+1 234 567 8900" />
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
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Creating account...' : 'Create Account & Sign In'}
              </button>
              <p className="text-center text-gray-600 text-xs pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab('login'); clearErr(); }}
                  className="text-orange-400 hover:underline">Sign in</button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Other portals:{' '}
          <a href="http://localhost:3011" className="text-blue-400 hover:underline">Hospital</a> ·{' '}
          <a href="http://localhost:3013" className="text-red-400 hover:underline">Rescue</a> ·{' '}
          <a href="http://localhost:3010" className="text-purple-400 hover:underline">Admin</a>
        </p>
      </div>
    </div>
  );
}
