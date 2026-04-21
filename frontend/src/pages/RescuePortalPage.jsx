import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const RescuePortalPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [lowStockResources, setLowStockResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, reportsRes, resourcesRes] = await Promise.all([
        apiClient.get('/teams'),
        apiClient.get('/reports?status=Pending&limit=10'),
        apiClient.get('/resources'),
      ]);
      const teamList = teamsRes.data.data || teamsRes.data || [];
      setTeams(teamList);
      setPendingReports(reportsRes.data.data || reportsRes.data || []);
      const allResources = resourcesRes.data.data || resourcesRes.data || [];
      setLowStockResources(allResources.filter((r) => r.lowStock));
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await apiClient.put(`/teams/${selectedTeam.id}`, { location: newLocation });
      setToast({ type: 'success', msg: 'Location updated' });
      setShowLocationModal(false);
      setNewLocation('');
      fetchData();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to update location' });
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkComplete = async (teamId) => {
    if (!window.confirm('Mark this assignment as complete?')) return;
    try {
      await apiClient.put(`/teams/${teamId}`, { status: 'Available' });
      setToast({ type: 'success', msg: 'Assignment marked complete' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to update' });
    }
  };

  const statusColor = {
    Available: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Assigned: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    Busy: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const severityColor = {
    Low: 'text-green-400',
    Medium: 'text-yellow-400',
    High: 'text-orange-400',
    Critical: 'text-red-400',
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-red-500/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚒</span>
          <span className="text-white font-bold">Rescue Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">👤 {user?.username}</span>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm">Logout</button>
        </div>
      </nav>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-3 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="text-gray-400 text-center py-20">Loading rescue data...</div>
        ) : (
          <>
            {/* Team Status */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🚒 Team Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="bg-gray-900 border border-red-500/20 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">{team.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[team.status] || 'bg-gray-700 text-gray-300'}`}>
                        {team.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">🏷️ {team.type}</p>
                    <p className="text-gray-400 text-sm mb-3">📍 {team.location}</p>
                    <p className="text-gray-500 text-xs mb-3">👥 {team.memberCount} members</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedTeam(team); setNewLocation(team.location); setShowLocationModal(true); }}
                        className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                      >
                        📍 Update Location
                      </button>
                      {team.status === 'Assigned' && (
                        <button
                          onClick={() => handleMarkComplete(team.id)}
                          className="flex-1 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-lg transition-colors border border-green-500/30"
                        >
                          ✅ Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Reports */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📋 Pending Reports</h2>
              {pendingReports.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No pending reports.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-400 pb-3 pr-4">#</th>
                        <th className="text-left text-gray-400 pb-3 pr-4">Location</th>
                        <th className="text-left text-gray-400 pb-3 pr-4">Type</th>
                        <th className="text-left text-gray-400 pb-3 pr-4">Severity</th>
                        <th className="text-left text-gray-400 pb-3">Reported</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReports.map((r) => (
                        <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 pr-4 text-red-400 font-mono">#{r.id}</td>
                          <td className="py-3 pr-4 text-white">{r.location}</td>
                          <td className="py-3 pr-4 text-gray-300">{r.disasterType}</td>
                          <td className={`py-3 pr-4 font-semibold ${severityColor[r.severity] || 'text-gray-300'}`}>{r.severity}</td>
                          <td className="py-3 text-gray-400 text-xs">{new Date(r.reportedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            {lowStockResources.length > 0 && (
              <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">⚠️ Low Stock Alerts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStockResources.map((r) => (
                    <div key={r.id} className="bg-red-500/5 border border-red-500/30 rounded-xl p-4">
                      <p className="text-red-400 font-medium text-sm">⚠️ {r.name} low</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {r.quantity} {r.unit} remaining (threshold: {r.threshold})
                      </p>
                      {r.warehouse && (
                        <p className="text-gray-500 text-xs mt-1">📍 {r.warehouse.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Update Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Update Location</h3>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                  placeholder="Enter current location"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={updating}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescuePortalPage;
