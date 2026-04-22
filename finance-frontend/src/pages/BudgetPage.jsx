import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const NAV = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/donations', icon: '💚', label: 'Donations' },
  { path: '/expenses', icon: '💸', label: 'Expenses' },
  { path: '/budget', icon: '🎯', label: 'Budget' },
  { path: '/transactions', icon: '📋', label: 'Transactions' },
  { path: '/reports', icon: '📈', label: 'Reports' },
];

const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm';
const lbl = 'block text-gray-400 text-sm mb-1';

export default function BudgetPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, evRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/events'),
      ]);
      setSummary(sumRes.data);
      setEvents(evRes.data.data || evRes.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

  const handleSetBudget = async e => {
    e.preventDefault();
    if (!selectedEvent || !budgetAmount) return;
    setSubmitting(true);
    try {
      await api.post(`/finance/budget/${selectedEvent}`, { totalBudget: parseFloat(budgetAmount) });
      showToast('success', `Budget set to $${parseFloat(budgetAmount).toLocaleString()}`);
      setBudgetAmount('');
      setSelectedEvent('');
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to set budget');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3"><span className="text-xl">💰</span><div><p className="text-white text-sm font-bold">Finance Portal</p><p className="text-emerald-400 text-xs">Disaster Response MIS</p></div></div>
          <div className="bg-gray-800 rounded-lg px-3 py-2"><p className="text-white text-sm font-medium">{user.username}</p><p className="text-emerald-400 text-xs capitalize">{user.role?.replace(/_/g, ' ')}</p></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => <Link key={item.path} to={item.path} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${item.path === '/budget' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><span>{item.icon}</span><span>{item.label}</span></Link>)}
        </nav>
        <div className="p-3 border-t border-gray-800"><button onClick={logout} className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-500/20">Logout</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {toast && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg} <button onClick={() => setToast(null)} className="ml-3 opacity-70">✕</button></div>}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Budget Management</h1>
          <p className="text-gray-400 text-sm">Set and track budgets per disaster event</p>
        </div>

        {/* Set Budget Form */}
        <div className="bg-gray-900 border border-emerald-500/20 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">🎯 Set Event Budget</h2>
          <form onSubmit={handleSetBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Disaster Event *</label>
              <select className={inp} required value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                <option value="">-- Select event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Total Budget ($) *</label>
              <input type="number" min="1" step="0.01" className={inp} required value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} placeholder="e.g. 1000000" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {submitting ? 'Setting...' : '🎯 Set Budget'}
              </button>
            </div>
          </form>
        </div>

        {/* Budget Status per Event */}
        {loading ? (
          <div className="text-gray-400 text-center py-12">Loading budget data...</div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Budget Status by Event</h2>
            {(summary?.breakdown || []).length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">No events found</div>
            ) : summary.breakdown.map(b => {
              const pct = b.totalBudget > 0 ? Math.round((b.approvedExpenses / b.totalBudget) * 100) : 0;
              const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-500' : 'bg-emerald-500';
              return (
                <div key={b.eventId} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold">{b.eventName}</h3>
                      <p className="text-gray-500 text-xs">{b.eventType}</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${pct >= 90 ? 'bg-red-500/20 text-red-400' : pct >= 70 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                      {pct}% used
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                    <div className={`h-3 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-blue-400 font-bold">${b.totalBudget.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">Total Budget</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-emerald-400 font-bold">${b.totalDonations.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">Donations</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-red-400 font-bold">${b.approvedExpenses.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">Approved Expenses</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className={`font-bold ${b.remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>${b.remainingBudget.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">Remaining</p>
                    </div>
                  </div>
                  {b.pendingExpenses > 0 && (
                    <div className="mt-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-yellow-400 text-xs">⏳ ${b.pendingExpenses.toLocaleString()} in pending expenses awaiting approval</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
