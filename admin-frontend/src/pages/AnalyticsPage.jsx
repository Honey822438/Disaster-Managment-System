import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../api/client.js';

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { info: 'border-gray-700', success: 'border-green-500/50', error: 'border-red-500/50' };
  return (
    <div className={`fixed top-4 right-4 z-50 bg-gray-800 border ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm`}>
      {message}
    </div>
  );
}

const SEVERITY_COLORS = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' };
const CHART_COLORS = ['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444'];

const darkTooltipStyle = {
  contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' },
  labelStyle: { color: '#d1d5db' },
  itemStyle: { color: '#e5e7eb' },
};

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState({ byType: {}, bySeverity: {} });
  const [resources, setResources] = useState({ byWarehouse: [], byResourceType: [] });
  const [finance, setFinance] = useState({ byEvent: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, resRes, finRes] = await Promise.all([
        api.get('/analytics/incidents'),
        api.get('/analytics/resources'),
        api.get('/analytics/finance'),
      ]);
      setIncidents(incRes.data || { byType: {}, bySeverity: {} });
      setResources(resRes.data || { byWarehouse: [], byResourceType: [] });
      setFinance(finRes.data || { byEvent: [] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Transform data for charts
  const incidentsByType = Object.entries(incidents.byType || {}).map(([name, value]) => ({ name, value }));
  const incidentsBySeverity = Object.entries(incidents.bySeverity || {}).map(([name, value]) => ({ name, value }));
  const resourcesByType = (resources.byResourceType || []).map(r => ({
    name: r.resourceType || r.name,
    value: r.totalQuantity || r.quantity || 0,
  }));
  const financeByEvent = (finance.byEvent || []).map(e => ({
    name: e.eventName || e.name,
    donations: Number(e.totalDonations || 0),
    expenses: Number(e.totalExpenses || 0),
  }));

  if (loading) return <div className="text-gray-400 text-center py-20">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm">Visual insights across all system data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Incidents by Type */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Incidents by Type</h2>
          {incidentsByType.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">📊 No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incidentsByType} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]}>
                  {incidentsByType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: Incidents by Severity (Pie) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Incidents by Severity</h2>
          {incidentsBySeverity.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">📊 No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incidentsBySeverity}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#6b7280' }}
                >
                  {incidentsBySeverity.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
                <Legend
                  formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 3: Resource Utilization by Type */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Resource Utilization by Type</h2>
          {resourcesByType.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">📊 No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resourcesByType} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="value" name="Total Quantity" radius={[4, 4, 0, 0]}>
                  {resourcesByType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 4: Finance by Event (grouped bar) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Finance by Event</h2>
          {financeByEvent.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">📊 No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={financeByEvent} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip {...darkTooltipStyle} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Legend formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>} />
                <Bar dataKey="donations" name="Donations" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}

