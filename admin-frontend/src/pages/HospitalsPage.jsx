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

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
      <div className={`bg-gray-900 border border-gray-800 rounded-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">x</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500';
const labelCls = 'block text-gray-400 text-sm mb-1';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', totalBeds: '', availableBeds: '', contactNumber: '' });
  const [admitForm, setAdmitForm] = useState({ name: '', age: '', gender: 'Male', condition: '', emergencyReportId: '' });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data?.data || res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load hospitals', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchHospitals(); 
    const interval = setInterval(fetchHospitals, 15000);
    return () => clearInterval(interval);
  }, [fetchHospitals]);

  const openViewPatients = async (hospital) => {
    setSelectedHospital(hospital);
    setModal('patients');
    setPatientsLoading(true);
    try {
      const res = await api.get(`/hospitals/${hospital.id}`);
      setPatients(res.data?.patients || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load patients', 'error');
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleDischarge = async (patientId) => {
    if (!window.confirm('Discharge this patient?')) return;
    try {
      await api.post(`/hospitals/${selectedHospital.id}/discharge/${patientId}`);
      showToast('Patient discharged', 'success');
      openViewPatients(selectedHospital);
      fetchHospitals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to discharge patient', 'error');
    }
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/hospitals', { ...form, totalBeds: Number(form.totalBeds), availableBeds: Number(form.availableBeds) });
      showToast('Hospital added', 'success');
      setModal(null);
      setForm({ name: '', location: '', totalBeds: '', availableBeds: '', contactNumber: '' });
      fetchHospitals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add hospital', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/hospitals/${selectedHospital.id}/admit`, {
        ...admitForm,
        age: Number(admitForm.age),
        emergencyReportId: admitForm.emergencyReportId || undefined,
      });
      showToast('Patient admitted', 'success');
      setModal(null);
      setAdmitForm({ name: '', age: '', gender: 'Male', condition: '', emergencyReportId: '' });
      fetchHospitals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to admit patient', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hospital?')) return;
    try {
      await api.delete(`/hospitals/${id}`);
      showToast('Hospital deleted', 'success');
      fetchHospitals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete hospital', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hospitals</h1>
          <p className="text-gray-400 text-sm">Manage hospital capacity and patients</p>
        </div>
        <button onClick={() => { setForm({ name: '', location: '', totalBeds: '', availableBeds: '', contactNumber: '' }); setModal('add'); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Hospital
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','Name','Location','Total Beds','Available','Occupied','Occupancy','Actions'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : hospitals.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-12">🏥 No hospitals found</td></tr>
            ) : hospitals.map(h => {
              const occupied = (h.totalBeds || 0) - (h.availableBeds || 0);
              const pct = h.totalBeds ? Math.round((occupied / h.totalBeds) * 100) : 0;
              const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-500' : 'bg-green-500';
              return (
                <tr key={h.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{h.id}...</td>
                  <td className="px-4 py-3 text-white font-medium">{h.name}</td>
                  <td className="px-4 py-3 text-gray-300">{h.location}</td>
                  <td className="px-4 py-3 text-gray-300">{h.totalBeds}</td>
                  <td className="px-4 py-3 text-green-400">{h.availableBeds}</td>
                  <td className="px-4 py-3 text-orange-400">{occupied}</td>
                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-400 w-8">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => { setSelectedHospital(h); setAdmitForm({ name: '', age: '', gender: 'Male', condition: '', emergencyReportId: '' }); setModal('admit'); }}
                        className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-2 py-1 rounded transition-colors">
                        Admit
                      </button>
                      <button onClick={() => openViewPatients(h)}
                        className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded transition-colors">
                        Patients
                      </button>
                      <button onClick={() => handleDelete(h.id)}
                        className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Hospital Modal */}
      {modal === 'add' && (
        <Modal title="Add Hospital" onClose={() => setModal(null)}>
          <form onSubmit={handleAddHospital} className="space-y-4">
            <div><label className={labelCls}>Name</label><input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Location</label><input className={inputCls} required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><label className={labelCls}>Total Beds</label><input type="number" min="1" className={inputCls} required value={form.totalBeds} onChange={e => setForm(f => ({ ...f, totalBeds: e.target.value }))} /></div>
            <div><label className={labelCls}>Available Beds</label><input type="number" min="0" className={inputCls} required value={form.availableBeds} onChange={e => setForm(f => ({ ...f, availableBeds: e.target.value }))} /></div>
            <div><label className={labelCls}>Contact Number</label><input className={inputCls} value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Adding...' : 'Add Hospital'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admit Patient Modal */}
      {modal === 'admit' && (
        <Modal title={`Admit Patient — ${selectedHospital?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleAdmit} className="space-y-4">
            <div><label className={labelCls}>Patient Name</label><input className={inputCls} required value={admitForm.name} onChange={e => setAdmitForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Age</label><input type="number" min="0" className={inputCls} required value={admitForm.age} onChange={e => setAdmitForm(f => ({ ...f, age: e.target.value }))} /></div>
            <div><label className={labelCls}>Gender</label>
              <select className={inputCls} value={admitForm.gender} onChange={e => setAdmitForm(f => ({ ...f, gender: e.target.value }))}>
                {['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Condition</label><input className={inputCls} required value={admitForm.condition} onChange={e => setAdmitForm(f => ({ ...f, condition: e.target.value }))} /></div>
            <div><label className={labelCls}>Emergency Report ID (optional)</label><input className={inputCls} value={admitForm.emergencyReportId} onChange={e => setAdmitForm(f => ({ ...f, emergencyReportId: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Admitting...' : 'Admit Patient'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Patients Modal */}
      {modal === 'patients' && (
        <Modal title={`Patients — ${selectedHospital?.name}`} onClose={() => setModal(null)} wide>
          {patientsLoading ? (
            <p className="text-gray-400 text-center py-8">Loading patients...</p>
          ) : patients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">🏥 No patients admitted</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  {['Name','Age','Gender','Condition','Admitted','Actions'].map(h => (
                    <th key={h} className="text-left text-gray-400 font-medium px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} className="border-t border-gray-800">
                    <td className="px-3 py-2 text-white">{p.name}</td>
                    <td className="px-3 py-2 text-gray-300">{p.age}</td>
                    <td className="px-3 py-2 text-gray-300">{p.gender}</td>
                    <td className="px-3 py-2 text-gray-300">{p.condition}</td>
                    <td className="px-3 py-2 text-gray-400">{p.admittedAt ? new Date(p.admittedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">
                      {!p.dischargedAt && (
                        <button onClick={() => handleDischarge(p.id)}
                          className="text-xs bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 px-2 py-1 rounded transition-colors">
                          Discharge
                        </button>
                      )}
                      {p.dischargedAt && <span className="text-xs text-gray-500">Discharged</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
    </div>
  );
}

