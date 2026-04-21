import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const CitizenPortalPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingResources, setLoadingResources] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const [reportForm, setReportForm] = useState({
    location: '',
    disasterType: 'Flood',
    severity: 'Medium',
    description: '',
  });

  useEffect(() => {
    fetchMyReports();
    fetchResources();
  }, []);

  const fetchMyReports = async () => {
    try {
      const res = await apiClient.get('/reports');
      setReports(res.data.data || res.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await apiClient.get('/resources');
      setResources(res.data.data || res.data || []);
    } catch {
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/reports', reportForm);
      const newReport = res.data;
      setSuccessMsg(`Your report #${newReport.id} has been submitted successfully.`);
      setShowReportModal(false);
      setReportForm({ location: '', disasterType: 'Flood', severity: 'Medium', description: '' });
      fetchMyReports();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = {
    Pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    Assigned: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    InProgress: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    Resolved: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Closed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navbar */}
      <nav className="bg-gray-900 border-b border-orange-500/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="text-white font-bold">Disaster Response</span>
          <span className="text-orange-400 text-sm ml-2">Citizen Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">👤 {user?.username}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Success message */}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 flex items-center justify-between">
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-green-300 hover:text-white">✕</button>
          </div>
        )}

        {/* Report Emergency Button */}
        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Emergency Reporting</h2>
          <p className="text-gray-400 mb-6">Report an emergency situation in your area</p>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-red-900/30"
          >
            🚨 Report Emergency
          </button>
        </div>

        {/* My Reports */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📋 My Reports</h2>
          {loadingReports ? (
            <div className="text-gray-400 text-center py-8">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No reports submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 pb-3 pr-4">Report #</th>
                    <th className="text-left text-gray-400 pb-3 pr-4">Location</th>
                    <th className="text-left text-gray-400 pb-3 pr-4">Type</th>
                    <th className="text-left text-gray-400 pb-3 pr-4">Severity</th>
                    <th className="text-left text-gray-400 pb-3 pr-4">Status</th>
                    <th className="text-left text-gray-400 pb-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 pr-4 text-orange-400 font-mono">#{r.id}</td>
                      <td className="py-3 pr-4 text-white">{r.location}</td>
                      <td className="py-3 pr-4 text-gray-300">{r.disasterType}</td>
                      <td className="py-3 pr-4 text-gray-300">{r.severity}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[r.status] || 'bg-gray-700 text-gray-300'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">{new Date(r.reportedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nearby Resources */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📦 Available Resources</h2>
          {loadingResources ? (
            <div className="text-gray-400 text-center py-8">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No resources available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.slice(0, 9).map((r) => (
                <div key={r.id} className={`bg-gray-800 rounded-xl p-4 border ${r.lowStock ? 'border-red-500/40' : 'border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{r.name}</span>
                    {r.lowStock && <span className="text-xs text-red-400">⚠️ Low</span>}
                  </div>
                  <p className="text-gray-400 text-xs">{r.resourceType}</p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-bold text-white">{r.quantity}</span> {r.unit}
                  </p>
                  {r.warehouse && (
                    <p className="text-gray-500 text-xs mt-1">📍 {r.warehouse.location}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">🚨 Report Emergency</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location *</label>
                <input
                  type="text"
                  value={reportForm.location}
                  onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Street, City, District"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Disaster Type *</label>
                <select
                  value={reportForm.disasterType}
                  onChange={(e) => setReportForm({ ...reportForm, disasterType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  {['Flood','Earthquake','Fire','Cyclone','Landslide','Other'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Severity *</label>
                <select
                  value={reportForm.severity}
                  onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  {['Low','Medium','High','Critical'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Describe the emergency situation..."
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenPortalPage;
