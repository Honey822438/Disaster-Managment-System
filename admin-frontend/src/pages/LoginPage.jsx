import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const ALLOWED_ROLES = ['admin', 'operator', 'warehouse_manager', 'finance_officer'];

const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm';
const lbl = 'block text-sm text-gray-400 mb-1';

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ username: '', email: '', password: '', confirm: '', role: 'operator' });
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
      if (!ALLOWED_ROLES.includes(user.role)) {
        setError('This portal is for admin and operations staff only.');
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
      await api.post('/auth/register', {
        username: reg.username,
        email: reg.email,
        password: reg.password,
        role: reg.role,
      });
      setSuccess(`Account created! You can now sign in as ${reg.role.replace(/_/g, ' ')}.`);
      setTab('login');
      setLogin({ email: reg.email, password: '' });
      setReg({ username: '', email: '', password: '', confirm: '', role: 'operator' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Email or username may already exist.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Admin Control Center</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Disaster Response MIS</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800">
          {[['login', 'Sign In'], ['register', 'Register']].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); clearErr(); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
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

        <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-8">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={lbl}>Email</label>
                <input type="email" value={login.email} onChange={e => setLogin(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="admin@disaster.gov" />
              </div>
              <div>
                <label className={lbl}>Password</label>
                <input type="password" value={login.password} onChange={e => setLogin(f => ({ ...f, password: e.target.value }))} required
                  className={inp} placeholder="••••••••" />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="pt-1 border-t border-gray-800 mt-2">
                <p className="text-gray-600 text-xs text-center mt-3">Demo: admin@disaster.gov / admin123</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={lbl}>Username *</label>
                <input type="text" value={reg.username} onChange={e => setReg(f => ({ ...f, username: e.target.value }))} required
                  className={inp} placeholder="johndoe" />
              </div>
              <div>
                <label className={lbl}>Email *</label>
                <input type="email" value={reg.email} onChange={e => setReg(f => ({ ...f, email: e.target.value }))} required
                  className={inp} placeholder="you@disaster.gov" />
              </div>
              <div>
                <label className={lbl}>Role *</label>
                <select value={reg.role} onChange={e => setReg(f => ({ ...f, role: e.target.value }))}
                  className={inp}>
                  <option value="operator">Operator (Emergency Management)</option>
                  <option value="warehouse_manager">Warehouse Manager</option>
                  <option value="finance_officer">Finance Officer</option>
                </select>
                <p className="text-gray-600 text-xs mt-1">Admin accounts are created by existing admins only.</p>
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
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Other portals:{' '}
          <a href="http://localhost:3012" className="text-orange-400 hover:underline">Citizen</a> ·{' '}
          <a href="http://localhost:3011" className="text-blue-400 hover:underline">Hospital</a> ·{' '}
          <a href="http://localhost:3013" className="text-red-400 hover:underline">Rescue</a>
        </p>
      </div>
    </div>
  );
}

