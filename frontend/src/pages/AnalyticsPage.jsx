import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import {
  BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const SEVERITY_COLORS = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' };

const darkTooltip = {
  contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' },
  labelStyle: { color: '#9ca3af' },
};

const AnalyticsPage = () => {
  const [incidentData, setIncidentData] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [incidentsRes, resourcesRes, financeRes] = await Promise.all([
        apiClient.get('/analytics/incidents'),
        apiClient.get('/analytics/resources'),
        apiClient.get('/analytics/finance'),
      ]);
      setIncidentData(incidentsRes.data);
      setResourceData(resourcesRes.data);
      setFinanceData(financeRes.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load analytics', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
      </Layout>
    );
  }

  // Convert plain objects { key: count } → [{ name, value }] for charts
  const byTypeData = incidentData?.byType
    ? Object.entries(incidentData.byType).map(([name, value]) => ({ name, value }))
    : [];

  const bySeverityData = incidentData?.bySeverity
    ? Object.entries(incidentData.bySeverity).map(([name, value]) => ({ name, value }))
    : [];

  // byResourceType is an array of { resourceType, totalQuantity, resourceCount }
  const byResourceTypeData = resourceData?.byResourceType || [];

  // byWarehouse is an array of { warehouseName, utilizationRate, totalQuantity }
  const byWarehouseData = resourceData?.byWarehouse || [];

  // byEvent is an array of { eventName, totalDonations, totalExpenses }
  const byEventData = financeData?.byEvent || [];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Visualize disaster response data and trends</p>
      </div>

      <div className="space-y-8">
        {/* Incidents by Type */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Incidents by Disaster Type</h2>
          {byTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip {...darkTooltip} />
                <Bar dataKey="value" name="Incidents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No incident data yet</div>
          )}
        </div>

        {/* Incidents by Severity */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Incidents by Severity</h2>
          {bySeverityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={bySeverityData}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#6b7280' }}
                >
                  {bySeverityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltip} />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No severity data yet</div>
          )}
        </div>

        {/* Resource Utilization by Type */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Resource Utilization by Type</h2>
          {byResourceTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byResourceTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="resourceType" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip {...darkTooltip} />
                <Bar dataKey="totalQuantity" name="Total Quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No resource data yet</div>
          )}
        </div>

        {/* Warehouse Utilization */}
        {byWarehouseData.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Warehouse Utilization (%)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byWarehouseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="warehouseName" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip {...darkTooltip} formatter={(v) => `${v}%`} />
                <Bar dataKey="utilizationRate" name="Utilization %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Financial Overview */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Financial Overview by Event</h2>
          {byEventData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byEventData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="eventName" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip {...darkTooltip} formatter={(v) => v.toLocaleString()} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar dataKey="totalDonations" name="Donations" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalExpenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">No financial data yet</div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </Layout>
  );
};

export default AnalyticsPage;
