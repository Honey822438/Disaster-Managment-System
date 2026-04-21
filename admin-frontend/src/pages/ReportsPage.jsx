import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const user = JSON.parse(localStorage.getItem('user') || '{}');

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
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500';
const labelCls = 'block text-gray-400 text-sm mb-1';

const SEVERITY_COLORS = { Low: 'bg-green-500/20 text-green-400', Medium: 'bg-yellow-500/20 text-yellow-400', High: 'bg-orange-500/20 text-orange-400', Critical: 'bg-red-500/20 text-red-400' };
const STATUS_COLORS = { Pending: 'bg-yellow-500/20 text-yellow-400', Assigned: 'bg-blue-500/20 text-blue-400', InProgress: 'bg-purple-500/20 text-purple-400', Resolved: 'bg-green-500/20 text-green-400', Closed: 'bg-gray-500/20 text-gray-400' };

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ location: '', disasterType: '', severity: '', status: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [showStatus, setShowStatus] = useState(null);
  const [form, setForm] = useState({ location: '', disasterType: 'Flood', severity: 'Medium', description: '', reportedBy: '', contactNumber: '' });
  const [statusVal, setStatusVal] = useState('Pending');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 20 });
      if (filters.location) params.set('location', filters.location);
      if (filters.disasterType) params.set('disasterType', filters.disasterType);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.status) params.set('status', filters.status);
      const res = await api.get(`/reports?${params}`);
      setReports(res.data?.data || res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reports', form);
      showToast('Report created successfully', 'success');
      setShowCreate(false);
      setForm({ location: '', disasterType: 'Flood', severity: 'Medium', description: '', reportedBy: '', contactNumber: '' });
      fetchReports();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/reports/${showStatus.id}`, { status: statusVal });
      showToast('Status updated', 'success');
      setShowStatus(null);
      fetchReports();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      showToast('Report deleted', 'success');
      fetchReports();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete report', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Reports</h1>
          <p className="text-gray-400 text-sm">Manage disaster reports and incidents</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Create Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input className={inputCls} placeholder="Filter by location..." value={filters.location}
          onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} />
        <select className={inputCls} value={filters.disasterType} onChange={e => setFilters(f => ({ ...f, disasterType: e.target.value }))}>
          <option value="">All Types</option>
          {['Flood','Earthquake','Fire','Cyclone','Landslide','Other'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select className={inputCls} value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
          <option value="">All Severities</option>
          {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className={inputCls} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['Pending','Assigned','InProgress','Resolved','Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','Location','Type','Severity','Status','Reported At','Actions'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-12">📋 No reports found</td></tr>
            ) : reports.map(r => (
              <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}...</td>
                <td className="px-4 py-3 text-white">{r.location}</td>
                <td className="px-4 py-3 text-gray-300">{r.disasterType}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_COLORS[r.severity] || 'bg-gray-700 text-gray-300'}`}>{r.severity}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[r.status] || 'bg-gray-700 text-gray-300'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{r.reportedAt ? new Date(r.reportedAt).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setShowStatus(r); setStatusVal(r.status); }}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded transition-colors">
                      Update Status
                    </button>
                    {user.role === 'admin' && (
                      <button onClick={() => handleDelete(r.id)}
                        className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Report" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><label className={labelCls}>Location</label><input className={inputCls} required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><label className={labelCls}>Disaster Type</label>
              <select className={inputCls} value={form.disasterType} onChange={e => setForm(f => ({ ...f, disasterType: e.target.value }))}>
                {['Flood','Earthquake','Fire','Cyclone','Landslide','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Severity</label>
              <select className={inputCls} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label className={labelCls}>Reported By</label><input className={inputCls} value={form.reportedBy} onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))} /></div>
            <div><label className={labelCls}>Contact Number</label><input className={inputCls} value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Creating...' : 'Create Report'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Status Modal */}
      {showStatus && (
        <Modal title="Update Status" onClose={() => setShowStatus(null)}>
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <p className="text-gray-400 text-sm">Report: <span className="text-white">{showStatus.location}</span></p>
            <div><label className={labelCls}>New Status</label>
              <select className={inputCls} value={statusVal} onChange={e => setStatusVal(e.target.value)}>
                {['Pending','Assigned','InProgress','Resolved','Closed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowStatus(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

