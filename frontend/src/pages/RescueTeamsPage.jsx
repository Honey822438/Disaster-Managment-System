import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const TEAM_TYPES = ['Medical', 'Fire', 'Rescue', 'Relief'];
const STATUS_TABS = ['All', 'Available', 'Assigned', 'Busy'];

const RescueTeamsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [toast, setToast] = useState(null);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedReport, setSelectedReport] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Add Team modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', type: 'Medical', location: '', memberCount: '', contactNumber: '' });
  const [addLoading, setAddLoading] = useState(false);

  const canAssign = ['admin', 'operator'].includes(user?.role);
  const canManage = ['admin', 'operator'].includes(user?.role);

  useEffect(() => {
    fetchTeams();
    fetchReports();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/teams');
      setTeams(res.data.data || res.data || []);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load teams', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await apiClient.get('/reports?status=Pending');
      setReports(res.data.data || res.data || []);
    } catch {
      setReports([]);
    }
  };

  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!selectedReport) {
      setToast({ message: 'Please select a report', type: 'error' });
      return;
    }
    setAssigning(true);
    try {
      await apiClient.post(`/teams/${selectedTeam.id}/assign`, {
        emergencyReportId: parseInt(selectedReport),
      });
      setToast({ message: 'Team assigned successfully', type: 'success' });
      setShowAssignModal(false);
      setSelectedTeam(null);
      setSelectedReport('');
      fetchTeams();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to assign team', type: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await apiClient.post('/teams', {
        ...addForm,
        memberCount: parseInt(addForm.memberCount),
      });
      setToast({ message: 'Team created successfully', type: 'success' });
      setShowAddModal(false);
      setAddForm({ name: '', type: 'Medical', location: '', memberCount: '', contactNumber: '' });
      fetchTeams();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to create team', type: 'error' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleMarkComplete = async (team) => {
    if (!window.confirm(`Mark ${team.name} as Available (complete assignment)?`)) return;
    try {
      await apiClient.put(`/teams/${team.id}`, { status: 'Available' });
      setToast({ message: 'Team marked as available', type: 'success' });
      fetchTeams();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to update team', type: 'error' });
    }
  };

  const filteredTeams = activeTab === 'All' ? teams : teams.filter((t) => t.status === activeTab);

  const statusBadge = (status) => {
    const colors = {
      Available: 'bg-green-500/20 text-green-400 border border-green-500/30',
      Assigned: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      Busy: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-700 text-gray-300'}`}>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Rescue Teams</h1>
          <p className="text-gray-400">Manage and assign rescue teams to incidents</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            ➕ Add Team
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab}
            {tab !== 'All' && (
              <span className="ml-2 text-xs opacity-70">
                ({teams.filter((t) => t.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Teams Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-12">Loading teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No teams found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left text-gray-400 px-5 py-3">ID</th>
                  <th className="text-left text-gray-400 px-5 py-3">Team Name</th>
                  <th className="text-left text-gray-400 px-5 py-3">Type</th>
                  <th className="text-left text-gray-400 px-5 py-3">Location</th>
                  <th className="text-left text-gray-400 px-5 py-3">Members</th>
                  <th className="text-left text-gray-400 px-5 py-3">Status</th>
                  <th className="text-left text-gray-400 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{team.id}</td>
                    <td className="px-5 py-3 text-white font-medium">{team.name}</td>
                    <td className="px-5 py-3 text-gray-300">{team.type}</td>
                    <td className="px-5 py-3 text-gray-300">{team.location}</td>
                    <td className="px-5 py-3 text-gray-300">{team.memberCount}</td>
                    <td className="px-5 py-3">{statusBadge(team.status)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {canAssign && team.status === 'Available' && (
                          <button
                            onClick={() => { setSelectedTeam(team); setShowAssignModal(true); }}
                            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs rounded-lg border border-blue-500/30 transition-colors"
                          >
                            Assign
                          </button>
                        )}
                        {canManage && team.status === 'Assigned' && (
                          <button
                            onClick={() => handleMarkComplete(team)}
                            className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs rounded-lg border border-green-500/30 transition-colors"
                          >
                            ✅ Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Assign {selectedTeam?.name}</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleAssignTeam} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Select Emergency Report *</label>
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select a report --</option>
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {r.location} ({r.disasterType}, {r.severity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={assigning}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {assigning ? 'Assigning...' : 'Assign Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Add New Team</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Team Name *</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Alpha Medical Team" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Team Type *</label>
                <select value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                  {TEAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current Location *</label>
                <input type="text" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Metro City Base" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Member Count *</label>
                <input type="number" value={addForm.memberCount} onChange={(e) => setAddForm({ ...addForm, memberCount: e.target.value })} required min="1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="12" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contact Number</label>
                <input type="text" value={addForm.contactNumber} onChange={(e) => setAddForm({ ...addForm, contactNumber: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="+1234567890" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {addLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </Layout>
  );
};

export default RescueTeamsPage;
