import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const NAV = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/donations', icon: '💚', label: 'Donations' },
  { path: '/expenses', icon: '💸', label: 'Expenses' },
  { path: '/budget', icon: '🎯', label: 'Budget' },
  { path: '/transactions', icon: '📋', label: 'Transactions' },
  { path: '/reports', icon: '📈', label: 'Reports' },
];

const COLORS = ['#10b981','#ef4444','#3b82f6','#f59e0b','#8b5cf6','#ec4899'];
const darkTip = { contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' } };

export default function ReportsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [summary, setSummary] = useState(null);
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, donRes, expRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/finance/donations?limit=100'),
        api.get('/finance/expenses?limit=100'),
      ]);
      setSummary(sumRes.data);
      setDonations(donRes.data.data || donRes.data || []);
      setExpenses(expRes.data.data || expRes.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Chart data
  const eventBarData = summary?.breakdown?.map(b => ({
    name: b.eventName?.slice(0, 10) + (b.eventName?.length > 10 ? '...' : ''),
    Donations: b.totalDonations,
    'Approved Exp': b.approvedExpenses,
    'Pending Exp': b.pendingExpenses,
    Budget: b.totalBudget,
  })) || [];

  // Expense by category
  const categoryMap = {};
  expenses.forEach(e => { categoryMap[e.category] = (categoryMap[e.category] || 0) + parseFloat(e.amount); });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Donor type breakdown
  const donorTypeMap = {};
  donations.forEach(d => { donorTypeMap[d.donorType] = (donorTypeMap[d.donorType] || 0) + parseFloat(d.amount); });
  const donorTypeData = Object.entries(donorTypeMap).map(([name, value]) => ({ name, value }));

  // Fund utilization pie
  const utilizationData = summary ? [
    { name: 'Approved Expenses', value: summary.totalApprovedExpenses || 0 },
    { name: 'Available Funds', value: Math.max(0, (summary.totalDonations || 0) - (summary.totalApprovedExpenses || 0)) },
  ] : [];

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3"><span className="text-xl">💰</span><div><p className="text-white text-sm font-bold">Finance Portal</p><p className="text-emerald-400 text-xs">Disaster Response MIS</p></div></div>
          <div className="bg-gray-800 rounded-lg px-3 py-2"><p className="text-white text-sm font-medium">{user.username}</p><p className="text-emerald-400 text-xs capitalize">{user.role?.replace(/_/g, ' ')}</p></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => <Link key={item.path} to={item.path} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${item.path === '/reports' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><span>{item.icon}</span><span>{item.label}</span></Link>)}
        </nav>
        <div className="p-3 border-t border-gray-800"><button onClick={logout} className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-500/20">Logout</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white">Financial Reports</h1><p className="text-gray-400 text-sm">Visual analytics and financial summaries</p></div>
          <button onClick={fetchData} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
        </div>

        {loading ? <div className="text-gray-400 text-center py-20">Loading reports...</div> : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Donations', value: `$${(summary?.totalDonations || 0).toLocaleString()}`, color: 'text-emerald-400' },
                { label: 'Total Expenses', value: `$${(summary?.totalExpenses || 0).toLocaleString()}`, color: 'text-red-400' },
                { label: 'Approved Expenses', value: `$${(summary?.totalApprovedExpenses || 0).toLocaleString()}`, color: 'text-orange-400' },
                { label: 'Net Balance', value: `$${(summary?.netBalance || 0).toLocaleString()}`, color: summary?.netBalance >= 0 ? 'text-green-400' : 'text-red-400' },
              ].map(c => (
                <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-gray-400 text-xs mb-1">{c.label}</p>
                  <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Chart 1: Event comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Financial Overview by Disaster Event</h3>
              {eventBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={eventBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip {...darkTip} formatter={v => `$${Number(v).toLocaleString()}`} />
                    <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                    <Bar dataKey="Donations" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="Approved Exp" fill="#ef4444" radius={[4,4,0,0]} />
                    <Bar dataKey="Budget" fill="#3b82f6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-gray-500">No data</div>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 2: Expense by category */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Expenses by Category</h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={{ stroke: '#6b7280' }}>
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...darkTip} formatter={v => `$${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-gray-500">No expense data</div>}
              </div>

              {/* Chart 3: Donor type breakdown */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Donations by Donor Type</h3>
                {donorTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={donorTypeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip {...darkTip} formatter={v => `$${Number(v).toLocaleString()}`} />
                      <Bar dataKey="value" name="Amount" radius={[4,4,0,0]}>
                        {donorTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-gray-500">No donation data</div>}
              </div>
            </div>

            {/* Chart 4: Fund utilization */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Overall Fund Utilization</h3>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="40%" height={200}>
                  <PieChart>
                    <Pie data={utilizationData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                      {utilizationData.map((_, i) => <Cell key={i} fill={i === 0 ? '#ef4444' : '#10b981'} />)}
                    </Pie>
                    <Tooltip {...darkTip} formatter={v => `$${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-gray-300">Total Donations</span></div>
                    <span className="text-emerald-400 font-bold">${(summary?.totalDonations || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-gray-300">Approved Expenses</span></div>
                    <span className="text-red-400 font-bold">${(summary?.totalApprovedExpenses || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-gray-300">Net Balance</span></div>
                    <span className={`font-bold ${summary?.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${(summary?.netBalance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
