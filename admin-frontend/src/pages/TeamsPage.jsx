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

const STATUS_COLORS = {
  Available: 'bg-green-500/20 text-green-400',
  Assigned: 'bg-orange-500/20 text-orange-400',
  Busy: 'bg-red-500/20 text-red-400',
};

const emptyForm = { name: '', type: 'Medical', location: '', memberCount: '' };

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // null | 'add' | 'assign'
  const [assignTarget, setAssignTarget] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [assignReportId, setAssignReportId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data?.data || res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchTeams(); 
    // Auto-refresh every 15 seconds to stay in sync with database
    const interval = setInterval(fetchTeams, 15000);
    return () => clearInterval(interval);
  }, [fetchTeams]);

  const openAssign = async (team) => {
    setAssignTarget(team);
    setAssignReportId('');
    try {
      const res = await api.get('/reports?status=Pending&limit=50');
      setPendingReports(res.data?.data || res.data || []);
    } catch {
      setPendingReports([]);
    }
    setModal('assign');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/teams', { ...form, memberCount: Number(form.memberCount) });
      showToast('Team added successfully', 'success');
      setModal(null);
      setForm(emptyForm);
      fetchTeams();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignReportId) return showToast('Please select a report', 'error');
    setSubmitting(true);
    try {
      await api.post(`/teams/${assignTarget.id}/assign`, { emergencyReportId: assignReportId });
      showToast('Team assigned successfully', 'success');
      setModal(null);
      fetchTeams();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (team) => {
    if (!window.confirm(`Mark team "${team.name}" as Available?`)) return;
    try {
      await api.put(`/teams/${team.id}`, { status: 'Available' });
      showToast('Team marked as available', 'success');
      fetchTeams();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update team', 'error');
    }
  };

  const handleDelete = async (team) => {
    if (!window.confirm(`Delete team "${team.name}"?`)) return;
    try {
      await api.delete(`/teams/${team.id}`);
      showToast('Team deleted', 'success');
      fetchTeams();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete team', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rescue Teams</h1>
          <p className="text-gray-400 text-sm">Manage and deploy rescue teams</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTeams} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors">🔄 Refresh</button>
          <button onClick={() => { setForm(emptyForm); setModal('add'); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Add Team
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','Name','Type','Location','Members','Status','Actions'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : teams.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-12">🚒 No teams found</td></tr>
            ) : teams.map(team => (
              <tr key={team.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{team.id}...</td>
                <td className="px-4 py-3 text-white font-medium">{team.name}</td>
                <td className="px-4 py-3 text-gray-300">{team.type}</td>
                <td className="px-4 py-3 text-gray-300">{team.location}</td>
                <td className="px-4 py-3 text-gray-300">{team.memberCount ?? team.members ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[team.status] || 'bg-gray-700 text-gray-300'}`}>{team.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {team.status === 'Available' && (
                      <button onClick={() => openAssign(team)}
                        className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded transition-colors">
                        Assign
                      </button>
                    )}
                    {team.status === 'Assigned' && (
                      <button onClick={() => handleMarkComplete(team)}
                        className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-2 py-1 rounded transition-colors">
                        Mark Complete
                      </button>
                    )}
                    <button onClick={() => handleDelete(team)}
                      className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Team Modal */}
      {modal === 'add' && (
        <Modal title="Add Team" onClose={() => setModal(null)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className={labelCls}>Team Name</label><input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['Medical','Fire','Rescue','Relief'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Location</label><input className={inputCls} required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><label className={labelCls}>Member Count</label><input type="number" min="1" className={inputCls} required value={form.memberCount} onChange={e => setForm(f => ({ ...f, memberCount: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Adding...' : 'Add Team'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Modal */}
      {modal === 'assign' && (
        <Modal title={`Assign Team: ${assignTarget?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleAssign} className="space-y-4">
            <div><label className={labelCls}>Select Pending Report</label>
              <select className={inputCls} value={assignReportId} onChange={e => setAssignReportId(e.target.value)}>
                <option value="">-- Select a report --</option>
                {pendingReports.map(r => (
                  <option key={r.id} value={r.id}>{r.location} — {r.disasterType} ({r.severity})</option>
                ))}
              </select>
            </div>
            {pendingReports.length === 0 && <p className="text-gray-500 text-sm">No pending reports available</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting || !assignReportId} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Assigning...' : 'Assign Team'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

