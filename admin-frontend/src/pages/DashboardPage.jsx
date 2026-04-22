import React, { useEffect, useState } from 'react';
import api from '../api/client.js';

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
      {message}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [incidents, setIncidents] = useState({ byType: {}, bySeverity: {} });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => setToast(msg);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, auditRes, incRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/audit?limit=8'),
          api.get('/analytics/incidents'),
        ]);
        setMetrics(dashRes.data);
        setAuditLogs(auditRes.data?.data || auditRes.data || []);
        setIncidents(incRes.data || { byType: {}, bySeverity: {} });
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  const metricCards = metrics ? [
    { label: 'Active Incidents', value: metrics.activeIncidents ?? 0, icon: '🚨', color: 'text-red-400' },
    { label: 'Available Teams', value: metrics.availableTeams ?? 0, icon: '🚒', color: 'text-green-400' },
    { label: 'Low Stock Resources', value: metrics.lowStockResources ?? 0, icon: '📦', color: 'text-orange-400' },
    { label: 'Hospital Occupancy', value: `${metrics.hospitalOccupancy ?? 0}%`, icon: '🏥', color: 'text-blue-400' },
    { label: 'Total Donations', value: `$${(metrics.totalDonations ?? 0).toLocaleString()}`, icon: '💰', color: 'text-emerald-400' },
    { label: 'Total Expenses', value: `$${(metrics.totalExpenses ?? 0).toLocaleString()}`, icon: '💸', color: 'text-yellow-400' },
    { label: 'Pending Approvals', value: metrics.pendingApprovals ?? 0, icon: '✅', color: 'text-purple-400' },
  ] : [];

  const severityColors = { Low: 'bg-green-500/20 text-green-400', Medium: 'bg-yellow-500/20 text-yellow-400', High: 'bg-orange-500/20 text-orange-400', Critical: 'bg-red-500/20 text-red-400' };
  const typeColors = ['bg-blue-500/20 text-blue-400', 'bg-purple-500/20 text-purple-400', 'bg-teal-500/20 text-teal-400', 'bg-pink-500/20 text-pink-400', 'bg-indigo-500/20 text-indigo-400'];

  if (loading) return <div className="text-gray-400 text-center py-20">Loading...</div>;

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">System overview and key metrics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs text-gray-500 bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">Admin</span>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-gray-400 text-sm mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
          {auditLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">📋 No recent activity</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log, i) => (
                <div key={log.id || i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></span>
                    <div>
                      <span className="text-white text-sm font-medium">{log.action}</span>
                      <span className="text-gray-400 text-sm"> on </span>
                      <span className="text-purple-400 text-sm">{log.entityType}</span>
                    </div>
                  </div>
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incident Stats */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Incidents by Type</h2>
            {Object.keys(incidents.byType || {}).length === 0 ? (
              <p className="text-gray-500 text-sm">No data</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(incidents.byType).map(([type, count], i) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${typeColors[i % typeColors.length]}`}>{type}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Incidents by Severity</h2>
            {Object.keys(incidents.bySeverity || {}).length === 0 ? (
              <p className="text-gray-500 text-sm">No data</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(incidents.bySeverity).map(([sev, count]) => (
                  <div key={sev} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${severityColors[sev] || 'bg-gray-700 text-gray-300'}`}>{sev}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

