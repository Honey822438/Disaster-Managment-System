import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const EmergencyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({});
  const [formData, setFormData] = useState({
    location: '',
    disasterType: '',
    severity: '',
    description: '',
    reportedBy: '',
    contactNumber: '',
  });

  const canCreate = ['admin', 'operator'].includes(user?.role);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await apiClient.get(`/reports?${params.toString()}`);
      setReports(response.data.data || response.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load reports', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/reports', formData);
      setToast({ message: 'Report created successfully', type: 'success' });
      setShowCreateModal(false);
      setFormData({
        location: '',
        disasterType: '',
        severity: '',
        description: '',
        reportedBy: '',
        contactNumber: '',
      });
      fetchReports();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to create report', type: 'error' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'location', label: 'Location' },
    { key: 'disasterType', label: 'Type' },
    {
      key: 'severity',
      label: 'Severity',
      render: (value) => <StatusBadge status={value} type="severity" />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} type="report" />,
    },
    {
      key: 'reportedAt',
      label: 'Reported At',
      render: (value) => new Date(value).toLocaleString(),
    },
  ];

  const filterConfig = [
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      placeholder: 'Filter by location',
    },
    {
      name: 'disasterType',
      label: 'Disaster Type',
      type: 'select',
      options: [
        { value: 'Flood', label: 'Flood' },
        { value: 'Earthquake', label: 'Earthquake' },
        { value: 'Fire', label: 'Fire' },
        { value: 'Cyclone', label: 'Cyclone' },
        { value: 'Landslide', label: 'Landslide' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      name: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
        { value: 'Critical', label: 'Critical' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Assigned', label: 'Assigned' },
        { value: 'InProgress', label: 'In Progress' },
        { value: 'Resolved', label: 'Resolved' },
        { value: 'Closed', label: 'Closed' },
      ],
    },
  ];

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Emergency Reports</h1>
          <p className="text-gray-400">Track and manage emergency incident reports</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Report
          </button>
        )}
      </div>

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
      />

      <DataTable columns={columns} data={reports} loading={loading} />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Emergency Report"
      >
        <form onSubmit={handleCreateReport}>
          <FormField
            label="Location"
            name="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <FormField
            label="Disaster Type"
            type="select"
            name="disasterType"
            value={formData.disasterType}
            onChange={(e) => setFormData({ ...formData, disasterType: e.target.value })}
            options={[
              { value: 'Flood', label: 'Flood' },
              { value: 'Earthquake', label: 'Earthquake' },
              { value: 'Fire', label: 'Fire' },
              { value: 'Cyclone', label: 'Cyclone' },
              { value: 'Landslide', label: 'Landslide' },
              { value: 'Other', label: 'Other' },
            ]}
            required
          />
          <FormField
            label="Severity"
            type="select"
            name="severity"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Critical', label: 'Critical' },
            ]}
            required
          />
          <FormField
            label="Description"
            type="textarea"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <FormField
            label="Reported By"
            name="reportedBy"
            value={formData.reportedBy}
            onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
          />
          <FormField
            label="Contact Number"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Report
          </button>
        </form>
      </Modal>

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </Layout>
  );
};

export default EmergencyReportsPage;
