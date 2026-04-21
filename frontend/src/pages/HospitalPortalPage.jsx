import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import CapacityBar from '../components/CapacityBar';

const HospitalPortalPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [criticalReports, setCriticalReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [admitForm, setAdmitForm] = useState({ name: '', age: '', gender: 'Male', condition: '', emergencyReportId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hospRes, reportRes] = await Promise.all([
        apiClient.get('/hospitals'),
        apiClient.get('/reports?severity=Critical&status=Pending&limit=5'),
      ]);
      const hospList = hospRes.data.data || hospRes.data || [];
      setHospitals(hospList);
      if (hospList.length > 0) {
        fetchPatients(hospList[0].id);
      }
      setCriticalReports(reportRes.data.data || reportRes.data || []);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async (hospitalId) => {
    try {
      const res = await apiClient.get(`/hospitals/${hospitalId}`);
      setPatients(res.data.patients || []);
    } catch {
      setPatients([]);
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post(`/hospitals/${selectedHospital.id}/admit`, {
        ...admitForm,
        age: parseInt(admitForm.age),
        emergencyReportId: admitForm.emergencyReportId ? parseInt(admitForm.emergencyReportId) : undefined,
      });
      setToast({ type: 'success', msg: 'Patient admitted successfully' });
      setShowAdmitModal(false);
      setAdmitForm({ name: '', age: '', gender: 'Male', condition: '', emergencyReportId: '' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to admit patient' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (hospitalId, patientId) => {
    if (!window.confirm('Discharge this patient?')) return;
    try {
      await apiClient.post(`/hospitals/${hospitalId}/discharge/${patientId}`);
      setToast({ type: 'success', msg: 'Patient discharged' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to discharge' });
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-blue-500/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <span className="text-white font-bold">Hospital Portal</span>
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
          <div className="text-gray-400 text-center py-20">Loading hospital data...</div>
        ) : (
          <>
            {/* Hospital Stats */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🏥 Hospital Capacity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map((h) => (
                  <div key={h.id} className="bg-gray-900 border border-blue-500/20 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">{h.name}</h3>
                      <button
                        onClick={() => { setSelectedHospital(h); setShowAdmitModal(true); }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                      >
                        + Admit
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs mb-3">📍 {h.location}</p>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-white font-bold text-lg">{h.totalBeds}</p>
                        <p className="text-gray-400 text-xs">Total</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-red-400 font-bold text-lg">{h.totalBeds - h.availableBeds}</p>
                        <p className="text-gray-400 text-xs">Occupied</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-green-400 font-bold text-lg">{h.availableBeds}</p>
                        <p className="text-gray-400 text-xs">Available</p>
                      </div>
                    </div>
                    <CapacityBar total={h.totalBeds} used={h.totalBeds - h.availableBeds} />
                  </div>
                ))}
              </div>
            </div>

            {/* Current Patients */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🛏️ Current Patients</h2>
              {patients.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No patients currently admitted.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-400 pb-3 pr-4">Name</th>
                        <th className="text-left text-gray-400 pb-3 pr-4">Condition</th>
                        <th className="text-left text-gray-400 pb-3 pr-4">Admitted</th>
                        <th className="text-left text-gray-400 pb-3 pr-4">Status</th>
                        <th className="text-left text-gray-400 pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((p) => (
                        <tr key={p.id} className="border-b border-gray-800/50">
                          <td className="py-3 pr-4 text-white">{p.name}</td>
                          <td className="py-3 pr-4 text-gray-300 max-w-xs truncate">{p.condition}</td>
                          <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(p.admittedAt).toLocaleString()}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'admitted' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {p.status === 'admitted' && (
                              <button
                                onClick={() => handleDischarge(p.hospitalId, p.id)}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                              >
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

            {/* Incoming Emergency Alerts */}
            <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🚨 Incoming Critical Alerts</h2>
              {criticalReports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No critical pending reports.</p>
              ) : (
                <div className="space-y-3">
                  {criticalReports.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                      <span className="text-2xl">🚨</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{r.location}</p>
                        <p className="text-gray-400 text-xs">{r.disasterType} · {new Date(r.reportedAt).toLocaleString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">
                        {r.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Admit Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Admit Patient — {selectedHospital?.name}</h3>
              <button onClick={() => setShowAdmitModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleAdmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Patient Name *</label>
                <input type="text" value={admitForm.name} onChange={(e) => setAdmitForm({ ...admitForm, name: e.target.value })} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Age *</label>
                  <input type="number" value={admitForm.age} onChange={(e) => setAdmitForm({ ...admitForm, age: e.target.value })} required min="0" max="150"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Gender *</label>
                  <select value={admitForm.gender} onChange={(e) => setAdmitForm({ ...admitForm, gender: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Condition *</label>
                <textarea value={admitForm.condition} onChange={(e) => setAdmitForm({ ...admitForm, condition: e.target.value })} required rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Linked Report ID (optional)</label>
                <input type="number" value={admitForm.emergencyReportId} onChange={(e) => setAdmitForm({ ...admitForm, emergencyReportId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. 5" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdmitModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Admitting...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalPortalPage;
