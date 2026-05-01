import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';

const SEV_COLOR = { Low: 'text-green-400', Medium: 'text-yellow-400', High: 'text-orange-400', Critical: 'text-red-400' };
const SEV_BG = { Low: 'bg-green-500/10 border-green-500/30', Medium: 'bg-yellow-500/10 border-yellow-500/30', High: 'bg-orange-500/10 border-orange-500/30', Critical: 'bg-red-500/10 border-red-500/30' };
const TEAM_STATUS = { Available: 'bg-green-500/20 text-green-400 border-green-500/30', Assigned: 'bg-orange-500/20 text-orange-400 border-orange-500/30', Busy: 'bg-red-500/20 text-red-400 border-red-500/30' };
const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 text-sm';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-xl flex items-center gap-3 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-red-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-xl">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [assignModal, setAssignModal] = useState(null); // report to assign
  const [resourceModal, setResourceModal] = useState(null); // resource to allocate
  const [locationModal, setLocationModal] = useState(null); // team to update location
  const [newLocation, setNewLocation] = useState('');
  const [allocForm, setAllocForm] = useState({ quantity: '', disasterEventId: '', requestedBy: '' });
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, tRes, resRes, evRes] = await Promise.all([
        api.get('/reports?limit=50'),
        api.get('/teams'),
        api.get('/resources'),
        api.get('/events'),
      ]);
      setReports(rRes.data.data || rRes.data || []);
      setTeams(tRes.data.data || tRes.data || []);
      setResources(resRes.data.data || resRes.data || []);
      setEvents(evRes.data.data || evRes.data || []);
    } catch (err) {
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const [selectedReportId, setSelectedReportId] = useState('');

  const handleAssignTeam = async () => {
    if (!selectedTeamId) { showToast('error', 'Select a team first'); return; }
    // reportId comes from the modal's report (assignModal.id) or from the dropdown (selectedReportId)
    const reportId = assignModal?.id || selectedReportId;
    if (!reportId) { showToast('error', 'Select a report first'); return; }
    setSubmitting(true);
    try {
      await api.post(`/teams/${selectedTeamId}/assign`, { emergencyReportId: parseInt(reportId) });
      showToast('success', `Team assigned to report #${reportId}`);
      setAssignModal(null);
      setSelectedTeamId('');
      setSelectedReportId('');
      fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Assignment failed');
    } finally { setSubmitting(false); }
  };

  const handleMarkComplete = async (teamId, teamName) => {
    if (!window.confirm(`Mark ${teamName} as Available (complete assignment)?`)) return;
    try {
      await api.put(`/teams/${teamId}`, { status: 'Available' });
      showToast('success', `${teamName} is now Available`);
      fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed');
    }
  };

  const handleRequestAllocation = async () => {
    if (!allocForm.quantity || !allocForm.disasterEventId) {
      showToast('error', 'Fill quantity and disaster event');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/resources/${resourceModal.id}/allocate`, {
        quantity: parseInt(allocForm.quantity),
        disasterEventId: parseInt(allocForm.disasterEventId),
        requestedBy: allocForm.requestedBy || user.username,
      });
      showToast('success', 'Allocation request submitted — pending approval');
      setResourceModal(null);
      setAllocForm({ quantity: '', disasterEventId: '', requestedBy: '' });
      fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Request failed');
    } finally { setSubmitting(false); }
  };

  const handleUpdateLocation = async () => {
    if (!newLocation.trim()) return;
    setSubmitting(true);
    try {
      await api.put(`/teams/${locationModal.id}`, { location: newLocation });
      showToast('success', 'Location updated');
      setLocationModal(null);
      setNewLocation('');
      fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed');
    } finally { setSubmitting(false); }
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; };

  const pendingReports = reports.filter(r => r.status === 'Pending');
  const activeReports = reports.filter(r => ['Assigned', 'InProgress'].includes(r.status));
  const assignedTeams = teams.filter(t => t.status === 'Assigned');
  const availableTeams = teams.filter(t => t.status === 'Available');
  const lowStockResources = resources.filter(r => r.lowStock);

  const TABS = [
    { id: 'reports', label: '🚨 Pending Reports', count: pendingReports.length },
    { id: 'active', label: '⚡ Active Missions', count: assignedTeams.length },
    { id: 'teams', label: '🚒 All Teams', count: teams.length },
    { id: 'resources', label: '📦 Resources', count: resources.length },
    { id: 'history', label: '📜 History Log', count: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-red-500/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚒</span>
          <div>
            <p className="text-white font-bold text-sm">Rescue Team Portal</p>
            <p className="text-red-400 text-xs">Smart Disaster Response MIS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lowStockResources.length > 0 && (
            <span className="bg-red-600/20 border border-red-500/30 text-red-400 text-xs px-3 py-1 rounded-full">
              ⚠️ {lowStockResources.length} Low Stock
            </span>
          )}
          <span className="text-gray-300 text-sm">👤 {user.username}</span>
          <button onClick={logout} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">Logout</button>
        </div>
      </nav>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending Reports', value: pendingReports.length, color: 'text-red-400', icon: '🚨' },
            { label: 'Active Missions', value: assignedTeams.length, color: 'text-orange-400', icon: '⚡' },
            { label: 'Available Teams', value: availableTeams.length, color: 'text-green-400', icon: '✅' },
            { label: 'Low Stock Items', value: lowStockResources.length, color: 'text-yellow-400', icon: '⚠️' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>{s.icon}</span>
                <span className="text-gray-400 text-xs">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === t.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              {t.label}
              {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-red-700' : 'bg-gray-700'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading rescue data...</div>
        ) : (
          <>
            {/* TAB: Pending Reports */}
            {tab === 'reports' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">🚨 Pending Emergency Reports</h2>
                  <button onClick={fetchAll} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
                </div>
                {pendingReports.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="text-gray-400">No pending reports right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReports.map(r => (
                      <div key={r.id} className={`bg-gray-900 border rounded-2xl p-5 ${SEV_BG[r.severity] || 'border-gray-800'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-red-400 font-mono font-bold text-sm">#{r.id}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${SEV_BG[r.severity]} ${SEV_COLOR[r.severity]}`}>{r.severity}</span>
                              <span className="text-gray-400 text-xs">{r.disasterType}</span>
                            </div>
                            <p className="text-white font-semibold">📍 {r.location}</p>
                            {r.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{r.description}</p>}
                            <p className="text-gray-600 text-xs mt-2">Reported: {new Date(r.reportedAt).toLocaleString()}</p>
                            {r.reportedBy && <p className="text-gray-600 text-xs">By: {r.reportedBy} {r.contactNumber && `· ${r.contactNumber}`}</p>}
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => { setAssignModal(r); setSelectedTeamId(''); }}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap">
                              🚒 Assign Team
                            </button>
                            {r.disasterEvent && (
                              <span className="text-xs text-center text-gray-500 bg-gray-800 px-2 py-1 rounded-lg">{r.disasterEvent.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Active Missions */}
            {tab === 'active' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">⚡ Active Missions</h2>
                {assignedTeams.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                    <p className="text-4xl mb-3">🚒</p>
                    <p className="text-gray-400">No teams currently assigned.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedTeams.map(team => {
                      const assignment = team.teamAssignments?.[0];
                      const report = assignment?.emergencyReport;
                      return (
                        <div key={team.id} className="bg-gray-900 border border-orange-500/30 rounded-2xl p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-white font-bold">{team.name}</h3>
                              <p className="text-gray-500 text-xs">{team.type} · {team.memberCount} members</p>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium border bg-orange-500/20 text-orange-400 border-orange-500/30">Assigned</span>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">📍 {team.location}</p>
                          {report && (
                            <div className="bg-gray-800 rounded-xl p-3 mb-3">
                              <p className="text-xs text-gray-500 mb-1">Assigned to Report:</p>
                              <p className="text-white text-sm font-medium">#{report.id} — {report.location}</p>
                              <p className={`text-xs font-semibold mt-1 ${SEV_COLOR[report.severity]}`}>{report.severity} · {report.disasterType}</p>
                            </div>
                          )}
                          {assignment && (
                            <p className="text-gray-600 text-xs mb-3">Assigned: {new Date(assignment.assignedAt).toLocaleString()}</p>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => { setLocationModal(team); setNewLocation(team.location); }}
                              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl transition-colors">
                              📍 Update Location
                            </button>
                            <button onClick={() => handleMarkComplete(team.id, team.name)}
                              className="flex-1 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-xl border border-green-500/30 transition-colors">
                              ✅ Mark Complete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Also show active reports */}
                {activeReports.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-white mb-3">📋 Reports In Progress</h3>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800/50">
                          <tr>
                            {['#', 'Location', 'Type', 'Severity', 'Status', 'Updated'].map(h => (
                              <th key={h} className="text-left text-gray-500 px-4 py-3 text-xs uppercase font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeReports.map(r => (
                            <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                              <td className="px-4 py-3 text-orange-400 font-mono font-bold">#{r.id}</td>
                              <td className="px-4 py-3 text-white">{r.location}</td>
                              <td className="px-4 py-3 text-gray-300">{r.disasterType}</td>
                              <td className={`px-4 py-3 font-semibold ${SEV_COLOR[r.severity]}`}>{r.severity}</td>
                              <td className="px-4 py-3"><span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{r.status}</span></td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.updatedAt || r.reportedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: All Teams */}
            {tab === 'teams' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">🚒 All Rescue Teams</h2>
                  <button onClick={fetchAll} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map(team => (
                    <div key={team.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{team.name}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">{team.type} · {team.memberCount} members</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${TEAM_STATUS[team.status] || 'bg-gray-700 text-gray-300'}`}>{team.status}</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">📍 {team.location}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setLocationModal(team); setNewLocation(team.location); }}
                          className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">
                          📍 Update Location
                        </button>
                        {team.status === 'Available' && (
                          <button onClick={() => { setAssignModal({ _teamPreselect: team.id }); setSelectedTeamId(String(team.id)); }}
                            className="flex-1 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors">
                            Assign
                          </button>
                        )}
                        {team.status === 'Assigned' && (
                          <button onClick={() => handleMarkComplete(team.id, team.name)}
                            className="flex-1 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-lg border border-green-500/30 transition-colors">
                            ✅ Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Resources */}
            {tab === 'resources' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">📦 Resource Inventory</h2>
                  <button onClick={fetchAll} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
                </div>

                {lowStockResources.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-5">
                    <h3 className="text-red-400 font-bold mb-3">⚠️ Low Stock Alerts — Action Required</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lowStockResources.map(r => (
                        <div key={r.id} className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
                          <p className="text-red-400 font-medium text-sm">⚠️ {r.name}</p>
                          <p className="text-gray-400 text-xs mt-1">{r.quantity} {r.unit} left (min: {r.threshold})</p>
                          {r.warehouse && <p className="text-gray-600 text-xs mt-1">📍 {r.warehouse.name}</p>}
                          <button onClick={() => { setResourceModal(r); setAllocForm({ quantity: '', disasterEventId: '', requestedBy: user.username || '' }); }}
                            className="mt-3 w-full py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors">
                            Request More Stock
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50">
                      <tr>
                        {['Resource', 'Type', 'Quantity', 'Unit', 'Warehouse', 'Status', 'Action'].map(h => (
                          <th key={h} className="text-left text-gray-500 px-4 py-3 text-xs uppercase font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resources.length === 0 ? (
                        <tr><td colSpan={7} className="text-center text-gray-500 py-10">No resources found</td></tr>
                      ) : resources.map(r => (
                        <tr key={r.id} className={`border-t border-gray-800 hover:bg-gray-800/30 ${r.lowStock ? 'bg-red-500/5' : ''}`}>
                          <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                          <td className="px-4 py-3 text-gray-300">{r.resourceType}</td>
                          <td className={`px-4 py-3 font-bold ${r.lowStock ? 'text-red-400' : 'text-white'}`}>{r.quantity}</td>
                          <td className="px-4 py-3 text-gray-400">{r.unit}</td>
                          <td className="px-4 py-3 text-gray-300">{r.warehouse?.name || '-'}</td>
                          <td className="px-4 py-3">
                            {r.lowStock
                              ? <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">⚠️ Low</span>
                              : <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">OK</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setResourceModal(r); setAllocForm({ quantity: '', disasterEventId: '', requestedBy: user.username || '' }); }}
                              className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/30 transition-colors">
                              Request
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* TAB: History Log */}
            {tab === 'history' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">📜 History Log</h2>
                  <button onClick={fetchAll} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
                </div>

                {/* Team Assignment History */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">🚒 Team Assignment History</h3>
                  {teams.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">No teams found</div>
                  ) : (
                    <div className="space-y-4">
                      {teams.map(team => {
                        const allAssignments = team.teamAssignments || [];
                        return (
                          <div key={team.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-800/30">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">🚒</span>
                                <div>
                                  <p className="text-white font-bold">{team.name}</p>
                                  <p className="text-gray-500 text-xs">{team.type} · {team.memberCount} members · 📍 {team.location}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${TEAM_STATUS[team.status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>{team.status}</span>
                                <span className="text-gray-500 text-xs">{allAssignments.length} mission{allAssignments.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            {allAssignments.length === 0 ? (
                              <div className="px-5 py-4 text-gray-600 text-sm">No assignments yet</div>
                            ) : (
                              <table className="w-full text-sm">
                                <thead className="bg-gray-800/20">
                                  <tr>
                                    {['Report #', 'Location', 'Type', 'Severity', 'Assigned At', 'Completed At', 'Status'].map(h => (
                                      <th key={h} className="text-left text-gray-500 px-4 py-2 text-xs font-medium">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allAssignments.map(a => (
                                    <tr key={a.id} className="border-t border-gray-800/50 hover:bg-gray-800/20">
                                      <td className="px-4 py-2.5 text-orange-400 font-mono font-bold text-xs">#{a.emergencyReport?.id || a.emergencyReportId}</td>
                                      <td className="px-4 py-2.5 text-white text-xs">{a.emergencyReport?.location || '-'}</td>
                                      <td className="px-4 py-2.5 text-gray-300 text-xs">{a.emergencyReport?.disasterType || '-'}</td>
                                      <td className={`px-4 py-2.5 text-xs font-semibold ${SEV_COLOR[a.emergencyReport?.severity] || 'text-gray-400'}`}>{a.emergencyReport?.severity || '-'}</td>
                                      <td className="px-4 py-2.5 text-gray-400 text-xs">{new Date(a.assignedAt).toLocaleString()}</td>
                                      <td className="px-4 py-2.5 text-gray-400 text-xs">{a.completedAt ? new Date(a.completedAt).toLocaleString() : <span className="text-orange-400">In Progress</span>}</td>
                                      <td className="px-4 py-2.5">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          ['Resolved','Closed'].includes(a.status) ? 'bg-green-500/20 text-green-400' :
                                          a.status === 'Assigned' ? 'bg-orange-500/20 text-orange-400' :
                                          'bg-blue-500/20 text-blue-400'
                                        }`}>{a.status}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resource Dispatch & Consumption Log */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">📦 Resource Dispatch & Consumption Log</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800/50">
                        <tr>
                          {['Resource', 'Type', 'Qty Requested', 'Unit', 'Disaster Event', 'Requested By', 'Status', 'Date'].map(h => (
                            <th key={h} className="text-left text-gray-500 px-4 py-3 text-xs font-medium uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resources.length === 0 ? (
                          <tr><td colSpan={8} className="text-center text-gray-500 py-8">No resource data</td></tr>
                        ) : resources.flatMap(r =>
                            (r.resourceAllocations || []).map(alloc => ({ ...alloc, resource: r }))
                          ).length === 0 ? (
                          <tr><td colSpan={8} className="text-center text-gray-500 py-8">No dispatch/allocation records yet</td></tr>
                        ) : (
                          resources.flatMap(r =>
                            (r.resourceAllocations || []).map(alloc => (
                              <tr key={alloc.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                                <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                                <td className="px-4 py-3 text-gray-300">{r.resourceType}</td>
                                <td className={`px-4 py-3 font-bold ${alloc.status === 'approved' ? 'text-red-400' : 'text-yellow-400'}`}>{alloc.quantity}</td>
                                <td className="px-4 py-3 text-gray-400">{r.unit}</td>
                                <td className="px-4 py-3 text-gray-300">{alloc.disasterEvent?.name || '-'}</td>
                                <td className="px-4 py-3 text-gray-400 text-xs">{alloc.requestedBy || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    alloc.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    alloc.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                  }`}>{alloc.status === 'approved' ? '✅ Dispatched' : alloc.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(alloc.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-gray-600 text-xs mt-2 px-1">✅ Dispatched = approved and deducted from warehouse · ⏳ Pending = awaiting approval</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: Assign Team to Report */}
      {assignModal && (
        <Modal title={assignModal.id ? `Assign Team to Report #${assignModal.id}` : 'Assign Team'} onClose={() => { setAssignModal(null); setSelectedTeamId(''); setSelectedReportId(''); }}>
          {assignModal.id && (
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-xs mb-1">Report Details:</p>
              <p className="text-white font-semibold">📍 {assignModal.location}</p>
              <p className={`text-sm font-bold mt-1 ${SEV_COLOR[assignModal.severity]}`}>{assignModal.severity} · {assignModal.disasterType}</p>
              {assignModal.description && <p className="text-gray-400 text-xs mt-2">{assignModal.description}</p>}
            </div>
          )}
          {!assignModal.id && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Select Report to Assign</label>
              <select className={inp} value={selectedReportId} onChange={e => setSelectedReportId(e.target.value)}>
                <option value="">-- Select pending report --</option>
                {pendingReports.map(r => (
                  <option key={r.id} value={r.id}>#{r.id} — {r.location} ({r.severity})</option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Select Available Team *</label>
            {availableTeams.length === 0 ? (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">No teams available right now.</p>
            ) : (
              <select className={inp} value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}>
                <option value="">-- Select a team --</option>
                {availableTeams.map(t => (
                  
                  <option key={t.id} value={t.id}>{t.name} ({t.type}) — {t.location}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setAssignModal(null); setSelectedTeamId(''); setSelectedReportId(''); }}
              className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm">Cancel</button>
            <button onClick={handleAssignTeam} disabled={submitting || !selectedTeamId || availableTeams.length === 0}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
              {submitting ? 'Assigning...' : '🚒 Assign Team'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: Request Resource Allocation */}
      {resourceModal && (
        <Modal title={`Request Resource: ${resourceModal.name}`} onClose={() => setResourceModal(null)}>
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className={`text-xl font-bold ${resourceModal.lowStock ? 'text-red-400' : 'text-white'}`}>{resourceModal.quantity}</p>
                <p className="text-gray-500 text-xs">Current Stock</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-400">{resourceModal.threshold}</p>
                <p className="text-gray-500 text-xs">Min Threshold</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-300">{resourceModal.unit}</p>
                <p className="text-gray-500 text-xs">Unit</p>
              </div>
            </div>
            {resourceModal.lowStock && (
              <p className="text-red-400 text-xs text-center mt-3 bg-red-500/10 rounded-lg py-2">⚠️ This resource is below minimum threshold</p>
            )}
            {resourceModal.warehouse && (
              <p className="text-gray-500 text-xs text-center mt-2">📍 {resourceModal.warehouse.name} — {resourceModal.warehouse.location}</p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity Needed *</label>
              <input type="number" min="1" max={resourceModal.quantity} value={allocForm.quantity}
                onChange={e => setAllocForm(f => ({ ...f, quantity: e.target.value }))}
                className={inp} placeholder={`Max available: ${resourceModal.quantity}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Disaster Event *</label>
              <select value={allocForm.disasterEventId} onChange={e => setAllocForm(f => ({ ...f, disasterEventId: e.target.value }))} className={inp}>
                <option value="">-- Select disaster event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Requested By</label>
              <input type="text" value={allocForm.requestedBy}
                onChange={e => setAllocForm(f => ({ ...f, requestedBy: e.target.value }))}
                className={inp} placeholder="Your name / team name" />
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-xs">ℹ️ This request will be sent for approval to the warehouse manager. You will be notified once approved.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setResourceModal(null)}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm">Cancel</button>
              <button onClick={handleRequestAllocation} disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {submitting ? 'Submitting...' : '📦 Submit Request'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Update Team Location */}
      {locationModal && (
        <Modal title={`Update Location — ${locationModal.name}`} onClose={() => { setLocationModal(null); setNewLocation(''); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Location</label>
              <p className="text-gray-300 text-sm bg-gray-800 rounded-lg px-4 py-2.5">📍 {locationModal.location}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">New Location *</label>
              <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} required
                className={inp} placeholder="Enter current deployment location" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setLocationModal(null); setNewLocation(''); }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm">Cancel</button>
              <button onClick={handleUpdateLocation} disabled={submitting || !newLocation.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                {submitting ? 'Updating...' : '📍 Update Location'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
