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

const TX_COLORS = {
  DONATION: 'bg-emerald-500/20 text-emerald-400',
  EXPENSE_REQUEST: 'bg-yellow-500/20 text-yellow-400',
  EXPENSE_APPROVED: 'bg-green-500/20 text-green-400',
  BUDGET_SET: 'bg-blue-500/20 text-blue-400',
};

export default function TransactionsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ eventId: '', transactionType: '', startDate: '', endDate: '' });

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const [txRes, evRes] = await Promise.all([
        api.get(`/finance/transactions?${params}`),
        api.get('/events'),
      ]);
      setTransactions(txRes.data.data || txRes.data || []);
      setEvents(evRes.data.data || evRes.data || []);
    } catch { } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3"><span className="text-xl">💰</span><div><p className="text-white text-sm font-bold">Finance Portal</p><p className="text-emerald-400 text-xs">Disaster Response MIS</p></div></div>
          <div className="bg-gray-800 rounded-lg px-3 py-2"><p className="text-white text-sm font-medium">{user.username}</p><p className="text-emerald-400 text-xs capitalize">{user.role?.replace(/_/g, ' ')}</p></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => <Link key={item.path} to={item.path} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${item.path === '/transactions' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><span>{item.icon}</span><span>{item.label}</span></Link>)}
        </nav>
        <div className="p-3 border-t border-gray-800"><button onClick={logout} className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-500/20">Logout</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Transactions</h1>
            <p className="text-gray-400 text-sm">Complete audit trail of all financial activities</p>
          </div>
          <button onClick={fetchData} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <select className={inp} value={filters.eventId} onChange={e => setFilters(f => ({ ...f, eventId: e.target.value }))}>
            <option value="">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select className={inp} value={filters.transactionType} onChange={e => setFilters(f => ({ ...f, transactionType: e.target.value }))}>
            <option value="">All Types</option>
            <option value="DONATION">Donation</option>
            <option value="EXPENSE_REQUEST">Expense Request</option>
            <option value="EXPENSE_APPROVED">Expense Approved</option>
            <option value="BUDGET_SET">Budget Set</option>
          </select>
          <input type="date" className={inp} value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          <input type="date" className={inp} value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>{['ID','Type','Amount','Event','Description','Performed By','Date'].map(h => <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 text-xs">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center text-gray-400 py-12">Loading...</td></tr>
              : transactions.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-500 py-12">📋 No transactions found</td></tr>
              : transactions.map(tx => (
                <tr key={tx.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{tx.id}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${TX_COLORS[tx.transactionType] || 'bg-gray-700 text-gray-300'}`}>{tx.transactionType?.replace(/_/g, ' ')}</span></td>
                  <td className={`px-4 py-3 font-bold ${tx.transactionType === 'DONATION' ? 'text-emerald-400' : 'text-red-400'}`}>${Number(tx.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{tx.disasterEvent?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{tx.description || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{tx.performedBy?.username || 'System'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
