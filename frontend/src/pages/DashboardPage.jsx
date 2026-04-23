import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import apiClient from '../api/client';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const SEVERITY_COLORS = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
};

const ACTION_COLORS = {
  CREATE: 'bg-green-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  STATUS_CHANGE: 'bg-orange-500',
  LOGIN: 'bg-gray-500',
};

const darkTooltipStyle = {
  contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' },
  labelStyle: { color: '#9ca3af' },
};

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [incidentData, setIncidentData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [metricsRes, activityRes, incidentRes, financeRes] = await Promise.allSettled([
        apiClient.get('/analytics/dashboard'),
        apiClient.get('/audit?limit=8'),
        apiClient.get('/analytics/incidents'),
        apiClient.get('/analytics/finance'),
      ]);
      
      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data);
      }
      
      if (activityRes.status === 'fulfilled') {
        setActivity(activityRes.value.data.data || activityRes.value.data || []);
      }
      
      if (incidentRes.status === 'fulfilled') {
        setIncidentData(incidentRes.value.data);
      }
      
      if (financeRes.status === 'fulfilled') {
        setFinanceData(financeRes.value.data);
      }
      
      // Only show error if ALL calls failed
      if (metricsRes.status === 'rejected' && activityRes.status === 'rejected' && 
          incidentRes.status === 'rejected' && financeRes.status === 'rejected') {
        setError('Failed to load dashboard data. Please try logging in again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 text-center py-10">{error}</div>
      </Layout>
    );
  }

  // Build chart data
  const byTypeData = incidentData?.byType
    ? Object.entries(incidentData.byType).map(([name, value]) => ({ name, value }))
    : [];

  const bySeverityData = incidentData?.bySeverity
    ? Object.entries(incidentData.bySeverity).map(([name, value]) => ({ name, value }))
    : [];

  const byEventData = financeData?.byEvent
    ? financeData.byEvent.map((e) => ({
        name: e.eventName || e.name || `Event ${e.eventId}`,
        totalDonations: parseFloat(e.totalDonations || 0),
        totalExpenses: parseFloat(e.totalExpenses || 0),
      }))
    : [];

  const actionColor = (action) => ACTION_COLORS[action] || 'bg-gray-500';

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of disaster response operations</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Incidents"    value={metrics?.activeIncidents || 0}    color="red" />
        <MetricCard title="Available Teams"     value={metrics?.availableTeams || 0}     color="green" />
        <MetricCard title="Low Stock Resources" value={metrics?.lowStockResources || 0}  color="orange" />
        <MetricCard title="Hospital Occupancy"  value={`${metrics?.hospitalOccupancy || 0}%`} color="blue" />
        <MetricCard title="Total Donations"     value={`$${(metrics?.totalDonations || 0).toLocaleString()}`}  color="green" />
        <MetricCard title="Total Expenses"      value={`$${(metrics?.totalExpenses || 0).toLocaleString()}`}   color="red" />
        <MetricCard
          title="Net Balance"
          value={`$${((metrics?.totalDonations || 0) - (metrics?.totalExpenses || 0)).toLocaleString()}`}
          color="purple"
        />
        <MetricCard title="Pending Approvals"   value={metrics?.pendingApprovals || 0}   color="orange" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart 1: Incidents by Type */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Incidents by Type</h3>
          {byTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data</div>
          )}
        </div>

        {/* Chart 2: Incidents by Severity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Incidents by Severity</h3>
          {bySeverityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={bySeverityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#6b7280' }}>
                  {bySeverityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data</div>
          )}
        </div>

        {/* Chart 3: Donations vs Expenses by Event */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Donations vs Expenses</h3>
          {byEventData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byEventData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip {...darkTooltipStyle} formatter={(v) => `$${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar dataKey="totalDonations" name="Donations" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalExpenses"  name="Expenses"  fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No recent activity.</p>
        ) : (
          <div className="space-y-0">
            {activity.map((log, i) => (
              <div
                key={log.id || i}
                className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${actionColor(log.action)}`} />
                <span className="text-sm text-gray-300 flex-1">
                  <span className="font-medium text-white">{log.action}</span>
                  {' on '}
                  <span className="text-blue-400">{log.entityType}</span>
                  {log.entityId ? ` #${log.entityId}` : ''}
                  {log.user ? ` by ${log.user.username}` : ''}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
