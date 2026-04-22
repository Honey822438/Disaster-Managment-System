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
const CATEGORIES = ['Medical','Transport','Equipment','Personnel','Infrastructure','Procurement','Other'];
const STATUS_COLORS = { pending: 'bg-yellow-500/20 text-yellow-400', approved: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400' };

export default function ExpensesPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Medical', amount: '', description: '', disasterEventId: '', receiptRef: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ eventId: '', category: '', status: '' });

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const [expRes, evRes] = await Promise.all([
        api.get(`/finance/expenses?${params}`),
        api.get('/events'),
      ]);
      setExpenses(expRes.data.data || expRes.data || []);
      setEvents(evRes.data.data || evRes.data || []);
    } catch { } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance/expenses', { ...form, amount: parseFloat(form.amount) });
      showToast('success', 'Expense submitted for approval');
      setShowForm(false);
      setForm({ category: 'Medical', amount: '', description: '', disasterEventId: '', receiptRef: '' });
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to record expense');
    } finally { setSubmitting(false); }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this expense? This will deduct from the event budget.')) return;
    try {
      await api.post(`/finance/expenses/${id}/approve`);
      showToast('success', 'Expense approved and budget updated');
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to approve');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3"><span className="text-xl">💰</span><div><p className="text-white text-sm font-bold">Finance Portal</p><p className="text-emerald-400 text-xs">Disaster Response MIS</p></div></div>
          <div className="bg-gray-800 rounded-lg px-3 py-2"><p className="text-white text-sm font-medium">{user.username}</p><p className="text-emerald-400 text-xs capitalize">{user.role?.replace(/_/g, ' ')}</p></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => <Link key={item.path} to={item.path} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${item.path === '/expenses' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><span>{item.icon}</span><span>{item.label}</span></Link>)}
        </nav>
        <div className="p-3 border-t border-gray-800"><button onClick={logout} className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-500/20">Logout</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {toast && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg} <button onClick={() => setToast(null)} className="ml-3 opacity-70">✕</button></div>}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Expenses</h1>
            <p className="text-gray-400 text-sm">Record expenses — requires approval before budget deduction</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">+ Record Expense</button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
          <p className="text-blue-400 text-sm">ℹ️ Expenses require approval before they are deducted from the event budget. Pending expenses do not affect the budget until approved.</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-3 gap-3 mb-6">
          <select className={inp} value={filters.eventId} onChange={e => setFilters(f => ({ ...f, eventId: e.target.value }))}>
            <option value="">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select className={inp} value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className={inp} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>{['ID','Category','Amount','Description','Event','Status','Recorded By','Approved By','Actions'].map(h => <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 text-xs">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="text-center text-gray-400 py-12">Loading...</td></tr>
              : expenses.length === 0 ? <tr><td colSpan={9} className="text-center text-gray-500 py-12">💸 No expenses recorded</td></tr>
              : expenses.map(ex => (
                <tr key={ex.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{ex.id}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">{ex.category}</span></td>
                  <td className="px-4 py-3 text-red-400 font-bold">${Number(ex.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{ex.description}</td>
                  <td className="px-4 py-3 text-gray-300">{ex.disasterEvent?.name || '-'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[ex.status] || 'bg-gray-700 text-gray-300'}`}>{ex.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{ex.recordedBy?.username || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{ex.approvedBy?.username || '-'}</td>
                  <td className="px-4 py-3">
                    {ex.status === 'pending' && (
                      <button onClick={() => handleApprove(ex.id)}
                        className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-2 py-1 rounded border border-green-500/30 transition-colors">
                        ✅ Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Expense Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">💸 Record Expense</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">✕</button>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 text-xs">⚠️ This expense will be submitted as <strong>Pending</strong> and requires approval before budget deduction.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Category *</label>
                    <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Amount ($) *</label><input type="number" min="1" step="0.01" className={inp} required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
                </div>
                <div><label className={lbl}>Description *</label><textarea className={inp} rows={2} required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the expense..." /></div>
                <div><label className={lbl}>Disaster Event *</label>
                  <select className={inp} required value={form.disasterEventId} onChange={e => setForm(f => ({ ...f, disasterEventId: e.target.value }))}>
                    <option value="">-- Select event --</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>)}
                  </select>
                </div>
                <div><label className={lbl}>Receipt Reference (optional)</label><input className={inp} value={form.receiptRef} onChange={e => setForm(f => ({ ...f, receiptRef: e.target.value }))} placeholder="e.g. INV-2024-001" /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                    {submitting ? 'Submitting...' : '💸 Submit for Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
