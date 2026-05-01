import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const NAV = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { path: '/donations',    icon: '💚', label: 'Donations' },
  { path: '/expenses',     icon: '💸', label: 'Expenses' },
  { path: '/procurement',  icon: '🛒', label: 'Procurement' },
  { path: '/budget',       icon: '🎯', label: 'Budget' },
  { path: '/transactions', icon: '📋', label: 'Transactions' },
  { path: '/reports',      icon: '📈', label: 'Reports' },
];

const COLORS = ['#10b981','#ef4444','#3b82f6','#f59e0b','#8b5cf6'];
const darkTip = { contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' } };

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/finance/summary');
      setSummary(res.data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const chartData = summary?.breakdown?.map(b => ({
    name: b.eventName?.slice(0, 12) + (b.eventName?.length > 12 ? '...' : ''),
    Donations: b.totalDonations,
    Expenses: b.approvedExpenses,
    Budget: b.totalBudget,
  })) || [];

  const pieData = summary ? [
    { name: 'Approved Expenses', value: summary.totalApprovedExpenses || 0 },
    { name: 'Remaining', value: Math.max(0, (summary.totalDonations || 0) - (summary.totalApprovedExpenses || 0)) },
  ] : [];

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💰</span>
            <div>
              <p className="text-white text-sm font-bold">Finance Portal</p>
              <p className="text-emerald-400 text-xs">Disaster Response MIS</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-white text-sm font-medium">{user.username}</p>
            <p className="text-emerald-400 text-xs capitalize">{user.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => (
            <Link key={item.path} to={item.path}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout} className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-500/20">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
            <p className="text-gray-400 text-sm">Financial overview across all disaster events</p>
          </div>
          <button onClick={fetchSummary} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-20">Loading financial data...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Donations', value: `$${(summary?.totalDonations || 0).toLocaleString()}`, color: 'text-emerald-400', icon: '💚', bg: 'border-emerald-500/20' },
                { label: 'Approved Expenses', value: `$${(summary?.totalApprovedExpenses || 0).toLocaleString()}`, color: 'text-red-400', icon: '💸', bg: 'border-red-500/20' },
                { label: 'Net Balance', value: `$${(summary?.netBalance || 0).toLocaleString()}`, color: summary?.netBalance >= 0 ? 'text-green-400' : 'text-red-400', icon: '⚖️', bg: 'border-blue-500/20' },
                { label: 'Active Events', value: summary?.breakdown?.length || 0, color: 'text-purple-400', icon: '🌪️', bg: 'border-purple-500/20' },
              ].map(c => (
                <div key={c.label} className={`bg-gray-900 border ${c.bg} rounded-xl p-5`}>
                  <div className="flex items-center gap-2 mb-2"><span>{c.icon}</span><span className="text-gray-400 text-xs">{c.label}</span></div>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Donations vs Expenses by Event</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip {...darkTip} formatter={v => `$${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                      <Bar dataKey="Donations" fill="#10b981" radius={[4,4,0,0]} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-gray-500">No data</div>}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Fund Utilization</h3>
                {pieData[0]?.value > 0 || pieData[1]?.value > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={{ stroke: '#6b7280' }}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip {...darkTip} formatter={v => `$${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-gray-500">No data</div>}
              </div>
            </div>

            {/* Event Breakdown Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-white font-semibold">Budget Breakdown by Event</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    {['Event','Budget','Donations','Approved Exp.','Pending Exp.','Net Balance','Remaining'].map(h => (
                      <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(summary?.breakdown || []).length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-gray-500 py-8">No events found</td></tr>
                  ) : summary.breakdown.map(b => (
                    <tr key={b.eventId} className="border-t border-gray-800 hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-white font-medium">{b.eventName}</td>
                      <td className="px-4 py-3 text-blue-400">${b.totalBudget.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-400">${b.totalDonations.toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-400">${b.approvedExpenses.toLocaleString()}</td>
                      <td className="px-4 py-3 text-yellow-400">${b.pendingExpenses.toLocaleString()}</td>
                      <td className={`px-4 py-3 font-bold ${b.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${b.netBalance.toLocaleString()}</td>
                      <td className={`px-4 py-3 font-bold ${b.remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>${b.remainingBudget.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
