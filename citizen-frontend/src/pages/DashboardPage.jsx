import React, { useState, useEffect } from 'react';
import api from '../api/client.js';

const STATUS_COLOR = {
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  InProgress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
  Closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const SEV_COLOR = { Low: 'text-green-400', Medium: 'text-yellow-400', High: 'text-orange-400', Critical: 'text-red-400' };

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ location: '', disasterType: 'Flood', severity: 'Medium', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { 
    fetchReports(); 
    fetchResources(); 
    const interval = setInterval(() => { fetchReports(); fetchResources(); }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.data || []);
    } catch { setReports([]); }
  };

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources((res.data.data || []).slice(0, 6));
    } catch { setResources([]); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await api.post('/reports', form);
      setSuccess(`✅ Report #${res.data.id} submitted! Authorities have been notified.`);
      setShowModal(false);
      setForm({ location: '', disasterType: 'Flood', severity: 'Medium', description: '' });
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-orange-500/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-white font-bold text-sm">Citizen Emergency Portal</p>
            <p className="text-orange-400 text-xs">Smart Disaster Response MIS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">👤 {user.username}</span>
          <button onClick={logout} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Success banner */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
            <span className="text-green-400 text-sm">{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-300 hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* Report Emergency CTA */}
        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Need Emergency Help?</h2>
          <p className="text-gray-400 mb-6 text-sm">Report an emergency and get immediate assistance from response teams</p>
          <button onClick={() => setShowModal(true)}
            className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/40">
            🚨 Report Emergency Now
          </button>
        </div>

        {/* My Reports */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">📋 My Reports</h2>
            <span className="text-gray-500 text-sm">{reports.length} total</span>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500">No reports yet. Submit your first emergency report above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['#', 'Location', 'Type', 'Severity', 'Status', 'Submitted'].map(h => (
                      <th key={h} className="text-left text-gray-500 pb-3 pr-4 font-medium text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4 text-orange-400 font-mono font-bold">#{r.id}</td>
                      <td className="py-3 pr-4 text-white">{r.location}</td>
                      <td className="py-3 pr-4 text-gray-300">{r.disasterType}</td>
                      <td className={`py-3 pr-4 font-semibold ${SEV_COLOR[r.severity] || 'text-gray-300'}`}>{r.severity}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLOR[r.status] || 'bg-gray-700 text-gray-300'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">{new Date(r.reportedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Available Resources */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-5">📦 Available Resources Near You</h2>
          {resources.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No resources available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map(r => (
                <div key={r.id} className={`bg-gray-800 rounded-xl p-4 border ${r.lowStock ? 'border-red-500/40' : 'border-gray-700'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-white font-medium text-sm">{r.name}</span>
                    {r.lowStock && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">⚠️ Low</span>}
                  </div>
                  <p className="text-gray-500 text-xs mb-1">{r.resourceType}</p>
                  <p className="text-gray-300 text-sm">
                    <span className="font-bold text-white text-lg">{r.quantity}</span> {r.unit}
                  </p>
                  {r.warehouse && <p className="text-gray-600 text-xs mt-2">📍 {r.warehouse.name} — {r.warehouse.location}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">🚨 Report Emergency</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location *</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Street, Area, City" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Disaster Type *</label>
                  <select value={form.disasterType} onChange={e => setForm(f => ({ ...f, disasterType: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500">
                    {['Flood','Earthquake','Fire','Cyclone','Landslide','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Severity *</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500">
                    {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Describe the situation..." />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
