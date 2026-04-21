import React, { useState, useEffect } from 'react';
import api from '../api/client.js';

const STATUS_COLOR = {
  Available: 'bg-green-500/20 text-green-400 border-green-500/30',
  Assigned: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Busy: 'bg-red-500/20 text-red-400 border-red-500/30',
};
const SEV_COLOR = { Low: 'text-green-400', Medium: 'text-yellow-400', High: 'text-orange-400', Critical: 'text-red-400' };

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [teams, setTeams] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showLocation, setShowLocation] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [tRes, rRes, resRes] = await Promise.all([
        api.get('/teams'),
        api.get('/reports?status=Pending&limit=10'),
        api.get('/resources'),
      ]);
      setTeams(tRes.data.data || tRes.data || []);
      setPendingReports(rRes.data.data || rRes.data || []);
      const all = resRes.data.data || resRes.data || [];
      setLowStock(all.filter(r => r.lowStock));
    } catch { } finally { setLoading(false); }
  };

  const handleUpdateLocation = async e => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/teams/${selectedTeam.id}`, { location: newLocation });
      showToast('success', 'Location updated');
      setShowLocation(false);
      fetchAll();
    } catch (err) { showToast('error', err.response?.data?.error || 'Failed'); }
    finally { setUpdating(false); }
  };

  const handleComplete = async teamId => {
    if (!confirm('Mark assignment as complete?')) return;
    try {
      await api.put(`/teams/${teamId}`, { status: 'Available' });
      showToast('success', 'Team marked available');
      fetchAll();
    } catch (err) { showToast('error', err.response?.data?.error || 'Failed'); }
  };

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; };

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-red-500/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚒</span>
          <div>
            <p className="text-white font-bold text-sm">Rescue Team Portal</p>
            <p className="text-red-400 text-xs">Smart Disaster Response MIS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">👤 {user.username}</span>
          <button onClick={logout} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">Logout</button>
        </div>
      </nav>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg} <button onClick={() => setToast(null)} className="ml-3 opacity-70">✕</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading rescue data...</div>
        ) : (
          <>
            {/* Team Status */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🚒 All Rescue Teams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="bg-gray-900 border border-red-500/20 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{team.name}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">{team.type} · {team.memberCount} members</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLOR[team.status] || 'bg-gray-700 text-gray-300'}`}>
                        {team.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">📍 {team.location}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedTeam(team); setNewLocation(team.location); setShowLocation(true); }}
                        className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">
                        📍 Update Location
                      </button>
                      {team.status === 'Assigned' && (
                        <button onClick={() => handleComplete(team.id)}
                          className="flex-1 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-lg border border-green-500/30 transition-colors">
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
              <h2 className="text-xl font-bold text-white mb-4">📋 Pending Emergency Reports</h2>
              {pendingReports.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No pending reports.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['#', 'Location', 'Type', 'Severity', 'Reported'].map(h => (
                          <th key={h} className="text-left text-gray-500 pb-3 pr-4 font-medium text-xs uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReports.map(r => (
                        <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 pr-4 text-red-400 font-mono font-bold">#{r.id}</td>
                          <td className="py-3 pr-4 text-white">{r.location}</td>
                          <td className="py-3 pr-4 text-gray-300">{r.disasterType}</td>
                          <td className={`py-3 pr-4 font-semibold ${SEV_COLOR[r.severity] || 'text-gray-300'}`}>{r.severity}</td>
                          <td className="py-3 text-gray-500 text-xs">{new Date(r.reportedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            {lowStock.length > 0 && (
              <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">⚠️ Low Stock Alerts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStock.map(r => (
                    <div key={r.id} className="bg-red-500/5 border border-red-500/30 rounded-xl p-4">
                      <p className="text-red-400 font-medium text-sm">⚠️ {r.name}</p>
                      <p className="text-gray-400 text-xs mt-1">{r.quantity} {r.unit} left (min: {r.threshold})</p>
                      {r.warehouse && <p className="text-gray-600 text-xs mt-1">📍 {r.warehouse.name}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Update Location Modal */}
      {showLocation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Update Location — {selectedTeam?.name}</h3>
              <button onClick={() => setShowLocation(false)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">✕</button>
            </div>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Location</label>
                <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                  placeholder="Enter current location" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLocation(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={updating}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
