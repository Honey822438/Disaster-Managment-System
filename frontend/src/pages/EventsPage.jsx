import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const DISASTER_TYPES = ['Flood', 'Earthquake', 'Fire', 'Cyclone', 'Landslide', 'Other'];

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Flood', location: '', startDate: '', endDate: '', description: '' });
  const [saving, setSaving] = useState(false);

  const canManage = ['admin', 'operator'].includes(user?.role);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/events');
      setEvents(res.data.data || res.data || []);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load events', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditEvent(null);
    setForm({ name: '', type: 'Flood', location: '', startDate: '', endDate: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditEvent(ev);
    setForm({
      name: ev.name,
      type: ev.type,
      location: ev.location,
      startDate: ev.startDate ? ev.startDate.slice(0, 10) : '',
      endDate: ev.endDate ? ev.endDate.slice(0, 10) : '',
      description: ev.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editEvent) {
        await apiClient.put(`/events/${editEvent.id}`, form);
        setToast({ message: 'Event updated', type: 'success' });
      } else {
        await apiClient.post('/events', form);
        setToast({ message: 'Event created', type: 'success' });
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to save event', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev) => {
    if (!window.confirm(`Delete event "${ev.name}"?`)) return;
    try {
      await apiClient.delete(`/events/${ev.id}`);
      setToast({ message: 'Event deleted', type: 'success' });
      fetchEvents();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Cannot delete — active reports or allocations exist', type: 'error' });
    }
  };

  const typeColor = {
    Flood: 'text-blue-400', Earthquake: 'text-orange-400', Fire: 'text-red-400',
    Cyclone: 'text-purple-400', Landslide: 'text-yellow-400', Other: 'text-gray-400',
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Disaster Events</h1>
          <p className="text-gray-400">Manage named disaster events for grouping reports and resources</p>
        </div>
        {canManage && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            ➕ New Event
          </button>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No disaster events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left text-gray-400 px-5 py-3">ID</th>
                  <th className="text-left text-gray-400 px-5 py-3">Name</th>
                  <th className="text-left text-gray-400 px-5 py-3">Type</th>
                  <th className="text-left text-gray-400 px-5 py-3">Location</th>
                  <th className="text-left text-gray-400 px-5 py-3">Start Date</th>
                  <th className="text-left text-gray-400 px-5 py-3">End Date</th>
                  {canManage && <th className="text-left text-gray-400 px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{ev.id}</td>
                    <td className="px-5 py-3 text-white font-medium">{ev.name}</td>
                    <td className={`px-5 py-3 font-medium ${typeColor[ev.type] || 'text-gray-300'}`}>{ev.type}</td>
                    <td className="px-5 py-3 text-gray-300">{ev.location}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{ev.startDate ? new Date(ev.startDate).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{ev.endDate ? new Date(ev.endDate).toLocaleDateString() : 'Ongoing'}</td>
                    {canManage && (
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(ev)}
                            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs rounded-lg border border-blue-500/30 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(ev)}
                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">{editEvent ? 'Edit Event' : 'New Disaster Event'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Event Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Metro City Flood 2024" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Disaster Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                    {DISASTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Location *</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Metro City" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Brief description of the disaster event..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
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

export default EventsPage;
