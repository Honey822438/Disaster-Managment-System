import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const ApprovalsPage = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    decision: '',
    comment: '',
  });
  const [toast, setToast] = useState(null);

  const canResolve = ['admin', 'warehouse_manager', 'finance_officer', 'operator'].includes(user?.role);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/approvals');
      setApprovals(response.data.data || response.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load approvals', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/approvals/${selectedApproval.id}/resolve`, resolveForm);
      setToast({
        message: `Approval ${resolveForm.decision === 'approved' ? 'approved' : 'rejected'} successfully`,
        type: 'success',
      });
      setShowResolveModal(false);
      setSelectedApproval(null);
      setResolveForm({ decision: '', comment: '' });
      fetchApprovals();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to resolve approval', type: 'error' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} type="approval" />,
    },
    {
      key: 'resourceAllocation',
      label: 'Resource',
      render: (value) => value?.resource?.name || 'N/A',
    },
    {
      key: 'resourceAllocation',
      label: 'Quantity',
      render: (value) => value?.quantity || 'N/A',
    },
    {
      key: 'resourceAllocation',
      label: 'Requested By',
      render: (value) => value?.requestedBy || 'N/A',
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) =>
        canResolve && row.status === 'pending' ? (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSelectedApproval(row);
                setResolveForm({ decision: 'approved', comment: '' });
                setShowResolveModal(true);
              }}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedApproval(row);
                setResolveForm({ decision: 'rejected', comment: '' });
                setShowResolveModal(true);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Reject
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Approvals</h1>
        <p className="text-gray-400">Review and resolve pending approval requests</p>
      </div>

      <DataTable columns={columns} data={approvals} loading={loading} />

      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          setSelectedApproval(null);
        }}
        title={`${resolveForm.decision === 'approved' ? 'Approve' : 'Reject'} Request`}
      >
        <form onSubmit={handleResolve}>
          <div className="mb-4 p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-400 mb-2">Request Details:</p>
            <p className="text-white">
              <span className="font-bold">Resource:</span> {selectedApproval?.resourceAllocation?.resource?.name}
            </p>
            <p className="text-white">
              <span className="font-bold">Quantity:</span> {selectedApproval?.resourceAllocation?.quantity}
            </p>
            <p className="text-white">
              <span className="font-bold">Requested By:</span> {selectedApproval?.resourceAllocation?.requestedBy}
            </p>
          </div>
          <FormField
            label="Comment (Optional)"
            type="textarea"
            name="comment"
            value={resolveForm.comment}
            onChange={(e) => setResolveForm({ ...resolveForm, comment: e.target.value })}
            placeholder="Add a comment about this decision"
          />
          <button
            type="submit"
            className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
              resolveForm.decision === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {resolveForm.decision === 'approved' ? 'Approve Request' : 'Reject Request'}
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

export default ApprovalsPage;
