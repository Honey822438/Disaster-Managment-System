import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const ResourcesPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [toast, setToast] = useState(null);
  const [allocateForm, setAllocateForm] = useState({
    quantity: '',
    disasterEventId: '',
    requestedBy: user?.username || '',
  });

  const canAllocate = ['admin', 'warehouse_manager'].includes(user?.role);

  useEffect(() => {
    fetchResources();
    fetchEvents();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/resources');
      setResources(response.data.data || response.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load resources', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get('/events');
      setEvents(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to load events', err);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/resources/${selectedResource.id}/allocate`, allocateForm);
      setToast({ message: 'Allocation request submitted for approval', type: 'success' });
      setShowAllocateModal(false);
      setSelectedResource(null);
      setAllocateForm({
        quantity: '',
        disasterEventId: '',
        requestedBy: user?.username || '',
      });
      fetchResources();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to allocate resource', type: 'error' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Resource Name' },
    { key: 'resourceType', label: 'Type' },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value, row) => (
        <span className={row.quantity < row.threshold ? 'text-red-500 font-bold' : ''}>
          {value} {row.unit}
          {row.quantity < row.threshold && ' ⚠️'}
        </span>
      ),
    },
    {
      key: 'threshold',
      label: 'Threshold',
      render: (value, row) => `${value} ${row.unit}`,
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (_, row) => row.warehouse?.name || 'N/A',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) =>
        canAllocate ? (
          <button
            onClick={() => {
              setSelectedResource(row);
              setShowAllocateModal(true);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Allocate
          </button>
        ) : null,
    },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Resources</h1>
        <p className="text-gray-400">Manage warehouse inventory and resource allocation</p>
      </div>

      <DataTable columns={columns} data={resources} loading={loading} />

      <Modal
        isOpen={showAllocateModal}
        onClose={() => {
          setShowAllocateModal(false);
          setSelectedResource(null);
        }}
        title={`Allocate ${selectedResource?.name}`}
      >
        <form onSubmit={handleAllocate}>
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <p className="text-sm text-gray-400">
              Available: <span className="text-white font-bold">{selectedResource?.quantity} {selectedResource?.unit}</span>
            </p>
          </div>
          <FormField
            label="Quantity"
            type="number"
            name="quantity"
            value={allocateForm.quantity}
            onChange={(e) => setAllocateForm({ ...allocateForm, quantity: e.target.value })}
            required
          />
          <FormField
            label="Disaster Event"
            type="select"
            name="disasterEventId"
            value={allocateForm.disasterEventId}
            onChange={(e) => setAllocateForm({ ...allocateForm, disasterEventId: e.target.value })}
            options={events.map((event) => ({
              value: event.id,
              label: event.name,
            }))}
            required
          />
          <FormField
            label="Requested By"
            name="requestedBy"
            value={allocateForm.requestedBy}
            onChange={(e) => setAllocateForm({ ...allocateForm, requestedBy: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Allocation Request
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

export default ResourcesPage;
