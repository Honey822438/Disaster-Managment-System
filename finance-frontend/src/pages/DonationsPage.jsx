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
const DONOR_TYPES = ['Individual', 'Organization', 'Government', 'NGO'];

export default function DonationsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donorName: '', organization: '', donorType: 'Individual', amount: '', disasterEventId: '', donatedAt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ eventId: '', donorType: '', startDate: '', endDate: '' });

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const [donRes, evRes] = await Promise.all([
        api.get(`/finance/donations?${params}`),
        api.get('/events'),
      ]);
      setDonations(donRes.data.data || donRes.data || []);
      setEvents(evRes.data.data || evRes.data || []);
    } catch { } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance/donations', { ...form, amount: parseFloat(form.amount) });
      showToast('success', `Donation of $${parseFloat(form.amount).toLocaleString()} recorded successfully`);
      setShowForm(false);
      setForm({ donorName: '', organization: '', donorType: 'Individual', amount: '', disasterEventId: '', donatedAt: '' });
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to record donation');
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
          {NAV.map(item => <Link key={item.path} to={item.path} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${item.path === '/donations' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><span>{item.icon}</span><span>{item.label}</span></Link>)}
        </nav>
        <div className="p-3 border-t border-gray-800"><button onClick={logout} className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-500/20">Logout</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {toast && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg} <button onClick={() => setToast(null)} className="ml-3 opacity-70">✕</button></div>}

        <div className="mb-6 flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white">Donations</h1><p className="text-gray-400 text-sm">Record and track all incoming donations</p></div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">+ Record Donation</button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <select className={inp} value={filters.eventId} onChange={e => setFilters(f => ({ ...f, eventId: e.target.value }))}>
            <option value="">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select className={inp} value={filters.donorType} onChange={e => setFilters(f => ({ ...f, donorType: e.target.value }))}>
            <option value="">All Donor Types</option>
            {DONOR_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input type="date" className={inp} value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          <input type="date" className={inp} value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>{['ID','Donor','Organization','Type','Amount','Event','Date','Recorded By'].map(h => <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 text-xs">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center text-gray-400 py-12">Loading...</td></tr>
              : donations.length === 0 ? <tr><td colSpan={8} className="text-center text-gray-500 py-12">💚 No donations recorded</td></tr>
              : donations.map(d => (
                <tr key={d.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{d.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{d.donorName}</td>
                  <td className="px-4 py-3 text-gray-300">{d.organization || '-'}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{d.donorType}</span></td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">${Number(d.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{d.disasterEvent?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(d.donatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{d.recordedBy?.username || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Donation Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">💚 Record Donation</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className={lbl}>Donor Name *</label><input className={inp} required value={form.donorName} onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))} placeholder="Full name or organization" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Organization</label><input className={inp} value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="Optional" /></div>
                  <div><label className={lbl}>Donor Type *</label>
                    <select className={inp} value={form.donorType} onChange={e => setForm(f => ({ ...f, donorType: e.target.value }))}>
                      {DONOR_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Amount ($) *</label><input type="number" min="1" step="0.01" className={inp} required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
                  <div><label className={lbl}>Donation Date</label><input type="date" className={inp} value={form.donatedAt} onChange={e => setForm(f => ({ ...f, donatedAt: e.target.value }))} /></div>
                </div>
                <div><label className={lbl}>Disaster Event *</label>
                  <select className={inp} required value={form.disasterEventId} onChange={e => setForm(f => ({ ...f, disasterEventId: e.target.value }))}>
                    <option value="">-- Select event --</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                    {submitting ? 'Recording...' : '💚 Record Donation'}
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
