import React, { useEffect, useState, useCallback } from 'react';
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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">x</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500';
const labelCls = 'block text-gray-400 text-sm mb-1';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { approval, decision }
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data?.data || res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load approvals', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const openConfirm = (approval, decision) => {
    setConfirmModal({ approval, decision });
    setComment('');
  };

  const handleResolve = async () => {
    if (!confirmModal) return;
    setSubmitting(true);
    try {
      await api.post(`/approvals/${confirmModal.approval.id}/resolve`, {
        decision: confirmModal.decision,
        comment,
      });
      showToast(`Approval ${confirmModal.decision}`, 'success');
      setConfirmModal(null);
      fetchApprovals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve approval', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-white">Approvals</h1>
        <p className="text-gray-400 text-sm">Review and resolve pending approval requests</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','Type','Status','Resource','Quantity','Requested By','Created At','Actions'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : approvals.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-12">✅ No approvals found</td></tr>
            ) : approvals.map(a => (
              <tr key={a.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{a.id}...</td>
                <td className="px-4 py-3 text-gray-300">{a.type || a.requestType || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[a.status?.toLowerCase()] || 'bg-gray-700 text-gray-300'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{a.resource?.name || a.resourceId || '-'}</td>
                <td className="px-4 py-3 text-gray-300">{a.quantity ?? '-'}</td>
                <td className="px-4 py-3 text-gray-300">{a.requestedBy || a.requester?.username || '-'}</td>
                <td className="px-4 py-3 text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-3">
                  {a.status?.toLowerCase() === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openConfirm(a, 'approved')}
                        className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-2 py-1 rounded transition-colors">
                        Approve
                      </button>
                      <button onClick={() => openConfirm(a, 'rejected')}
                        className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <Modal
          title={confirmModal.decision === 'approved' ? '✅ Approve Request' : '❌ Reject Request'}
          onClose={() => setConfirmModal(null)}
        >
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Are you sure you want to <span className={confirmModal.decision === 'approved' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{confirmModal.decision}</span> this request?
            </p>
            <div>
              <label className={labelCls}>Comment (optional)</label>
              <textarea className={inputCls} rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleResolve} disabled={submitting}
                className={`flex-1 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors ${confirmModal.decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {submitting ? 'Processing...' : confirmModal.decision === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

