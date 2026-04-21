import React, { useState, useEffect } from 'react';
import api from '../api/client.js';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [criticalReports, setCriticalReports] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdmit, setShowAdmit] = useState(false);
  const [admitHospital, setAdmitHospital] = useState(null);
  const [admitForm, setAdmitForm] = useState({ name: '', age: '', gender: 'Male', condition: '', emergencyReportId: '' });
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [hRes, rRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/reports?severity=Critical&status=Pending&limit=5'),
      ]);
      const hList = hRes.data.data || hRes.data || [];
      setHospitals(hList);
      if (hList.length > 0) {
        setSelectedHospital(hList[0]);
        fetchPatients(hList[0].id);
      }
      setCriticalReports(rRes.data.data || rRes.data || []);
    } catch { } finally { setLoading(false); }
  };

  const fetchPatients = async id => {
    try {
      const res = await api.get(`/hospitals/${id}`);
      setPatients(res.data.patients || []);
    } catch { setPatients([]); }
  };

  const handleAdmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/hospitals/${admitHospital.id}/admit`, {
        ...admitForm,
        age: parseInt(admitForm.age),
        emergencyReportId: admitForm.emergencyReportId ? parseInt(admitForm.emergencyReportId) : undefined,
      });
      showToast('success', 'Patient admitted successfully');
      setShowAdmit(false);
      setAdmitForm({ name: '', age: '', gender: 'Male', condition: '', emergencyReportId: '' });
      fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to admit patient');
    } finally { setSubmitting(false); }
  };

  const handleDischarge = async (hospitalId, patientId) => {
    if (!confirm('Discharge this patient?')) return;
    try {
      await api.post(`/hospitals/${hospitalId}/discharge/${patientId}`);
      showToast('success', 'Patient discharged');
      fetchAll();
    } catch (err) { showToast('error', err.response?.data?.error || 'Failed'); }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; };

  const occupancyPct = h => h.totalBeds > 0 ? Math.round((h.totalBeds - h.availableBeds) / h.totalBeds * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-blue-500/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <div>
            <p className="text-white font-bold text-sm">Hospital Staff Portal</p>
            <p className="text-blue-400 text-xs">Smart Disaster Response MIS</p>
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
          <div className="text-center py-20 text-gray-400">Loading hospital data...</div>
        ) : (
          <>
            {/* Hospital Capacity Cards */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🏥 Hospital Capacity Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map(h => {
                  const pct = occupancyPct(h);
                  const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-500' : 'bg-green-500';
                  return (
                    <div key={h.id} className={`bg-gray-900 border rounded-2xl p-5 cursor-pointer transition-all ${selectedHospital?.id === h.id ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'}`}
                      onClick={() => { setSelectedHospital(h); fetchPatients(h.id); }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-sm">{h.name}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">📍 {h.location}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setAdmitHospital(h); setShowAdmit(true); }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
                          + Admit
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div className="bg-gray-800 rounded-lg p-2">
                          <p className="text-white font-bold">{h.totalBeds}</p>
                          <p className="text-gray-500 text-xs">Total</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-2">
                          <p className="text-red-400 font-bold">{h.totalBeds - h.availableBeds}</p>
                          <p className="text-gray-500 text-xs">Occupied</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-2">
                          <p className="text-green-400 font-bold">{h.availableBeds}</p>
                          <p className="text-gray-500 text-xs">Free</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-gray-500 text-xs mt-1 text-right">{pct}% occupied</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Patients */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">
                  🛏️ Patients — {selectedHospital?.name || 'Select a hospital'}
                </h2>
                <span className="text-gray-500 text-sm">{patients.filter(p => p.status === 'admitted').length} admitted</span>
              </div>
              {patients.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No patients. Click a hospital above to view its patients.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['Name', 'Age', 'Gender', 'Condition', 'Admitted', 'Status', 'Action'].map(h => (
                          <th key={h} className="text-left text-gray-500 pb-3 pr-4 font-medium text-xs uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 pr-4 text-white font-medium">{p.name}</td>
                          <td className="py-3 pr-4 text-gray-300">{p.age}</td>
                          <td className="py-3 pr-4 text-gray-300">{p.gender}</td>
                          <td className="py-3 pr-4 text-gray-400 max-w-xs truncate">{p.condition}</td>
                          <td className="py-3 pr-4 text-gray-500 text-xs">{new Date(p.admittedAt).toLocaleDateString()}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'admitted' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {p.status === 'admitted' && (
                              <button onClick={() => handleDischarge(p.hospitalId, p.id)}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors">
                                Discharge
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Critical Alerts */}
            <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🚨 Incoming Critical Alerts</h2>
              {criticalReports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No critical pending reports.</p>
              ) : (
                <div className="space-y-3">
                  {criticalReports.map(r => (
                    <div key={r.id} className="flex items-center gap-4 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                      <span className="text-2xl">🚨</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{r.location}</p>
                        <p className="text-gray-400 text-xs">{r.disasterType} · {new Date(r.reportedAt).toLocaleString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">{r.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Admit Modal */}
      {showAdmit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Admit Patient — {admitHospital?.name}</h3>
              <button onClick={() => setShowAdmit(false)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">✕</button>
            </div>
            <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-sm">Available beds: <span className="font-bold text-white">{admitHospital?.availableBeds}</span></p>
            </div>
            <form onSubmit={handleAdmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Patient Name *</label>
                <input type="text" value={admitForm.name} onChange={e => setAdmitForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Age *</label>
                  <input type="number" value={admitForm.age} onChange={e => setAdmitForm(f => ({ ...f, age: e.target.value }))} required min="0" max="150"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Gender *</label>
                  <select value={admitForm.gender} onChange={e => setAdmitForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Condition *</label>
                <textarea value={admitForm.condition} onChange={e => setAdmitForm(f => ({ ...f, condition: e.target.value }))} required rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Linked Report ID (optional)</label>
                <input type="number" value={admitForm.emergencyReportId} onChange={e => setAdmitForm(f => ({ ...f, emergencyReportId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. 5" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdmit(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {submitting ? 'Admitting...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
