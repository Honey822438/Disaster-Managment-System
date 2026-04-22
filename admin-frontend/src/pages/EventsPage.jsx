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
const EVENT_TYPES = ['Flood','Earthquake','Fire','Cyclone','Landslide','Other'];

const emptyForm = { name: '', type: 'Flood', location: '', startDate: '', endDate: '', description: '' };

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      setEvents(res.data?.data || res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchEvents(); 
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const openCreate = () => { setForm(emptyForm); setEditTarget(null); setModal('create'); };
  const openEdit = (ev) => {
    setEditTarget(ev);
    setForm({
      name: ev.name || '',
      type: ev.type || 'Flood',
      location: ev.location || '',
      startDate: ev.startDate ? ev.startDate.slice(0, 10) : '',
      endDate: ev.endDate ? ev.endDate.slice(0, 10) : '',
      description: ev.description || '',
    });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, endDate: form.endDate || null };
      if (modal === 'create') {
        await api.post('/events', payload);
        showToast('Event created successfully', 'success');
      } else {
        await api.put(`/events/${editTarget.id}`, payload);
        showToast('Event updated successfully', 'success');
      }
      setModal(null);
      fetchEvents();
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('Cannot modify: event has active assignments', 'error');
      } else {
        showToast(err.response?.data?.message || 'Operation failed', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ev) => {
    if (!window.confirm(`Delete event "${ev.name}"?`)) return;
    try {
      await api.delete(`/events/${ev.id}`);
      showToast('Event deleted', 'success');
      fetchEvents();
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('Cannot delete: event has active assignments', 'error');
      } else {
        showToast(err.response?.data?.message || 'Failed to delete event', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Disaster Events</h1>
          <p className="text-gray-400 text-sm">Manage active and historical disaster events</p>
        </div>
        <button onClick={openCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Create Event
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','Name','Type','Location','Start Date','End Date','Actions'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-12">🌪️ No events found</td></tr>
            ) : events.map(ev => (
              <tr key={ev.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{ev.id}...</td>
                <td className="px-4 py-3 text-white font-medium">{ev.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{ev.type}</span>
                </td>
                <td className="px-4 py-3 text-gray-300">{ev.location}</td>
                <td className="px-4 py-3 text-gray-400">{ev.startDate ? new Date(ev.startDate).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 text-gray-400">
                  {ev.endDate ? new Date(ev.endDate).toLocaleDateString() : <span className="text-green-400 text-xs">Ongoing</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(ev)}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ev)}
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

      {modal && (
        <Modal title={modal === 'create' ? 'Create Event' : 'Edit Event'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className={labelCls}>Event Name</label><input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Location</label><input className={inputCls} required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div><label className={labelCls}>End Date (optional)</label><input type="date" className={inputCls} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Saving...' : modal === 'create' ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

