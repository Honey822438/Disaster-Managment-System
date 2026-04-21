import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import Toast from '../components/Toast';
import apiClient from '../api/client';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await apiClient.get(`/audit?${params.toString()}`);
      setLogs(response.data.data || response.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load audit logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: 'user',
      label: 'User',
      render: (value) => value?.username || 'System',
    },
    { key: 'action', label: 'Action' },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'entityId', label: 'Entity ID' },
  ];

  const filterConfig = [
    {
      name: 'entityType',
      label: 'Entity Type',
      type: 'select',
      options: [
        { value: 'EmergencyReport', label: 'Emergency Report' },
        { value: 'RescueTeam', label: 'Rescue Team' },
        { value: 'Resource', label: 'Resource' },
        { value: 'Hospital', label: 'Hospital' },
        { value: 'Donation', label: 'Donation' },
        { value: 'Expense', label: 'Expense' },
        { value: 'ApprovalWorkflow', label: 'Approval Workflow' },
      ],
    },
    {
      name: 'action',
      label: 'Action',
      type: 'text',
      placeholder: 'Filter by action',
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'date',
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: 'date',
    },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
        <p className="text-gray-400">View system activity and changes</p>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
      />

      <DataTable columns={columns} data={logs} loading={loading} />

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </Layout>
  );
};

export default AuditLogsPage;
