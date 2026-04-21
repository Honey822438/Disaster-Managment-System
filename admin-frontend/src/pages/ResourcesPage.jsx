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

const RESOURCE_TYPES = ['Food','Water','Medicine','Equipment','Clothing','Shelter','Other'];

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [allocateTarget, setAllocateTarget] = useState(null);
  const [form, setForm] = useState({ name: '', resourceType: 'Food', quantity: '', threshold: '', unit: '', warehouseId: '' });
  const [allocateForm, setAllocateForm] = useState({ quantity: '', disasterEventId: '', requestedBy: '' });
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '', capacity: '' });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, whRes, evRes] = await Promise.all([
        api.get('/resources'),
        api.get('/resources/warehouses'),
        api.get('/events'),
      ]);
      setResources(resRes.data?.data || resRes.data || []);
      setWarehouses(whRes.data?.data || whRes.data || []);
      setEvents(evRes.data?.data || evRes.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddResource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/resources', { ...form, quantity: Number(form.quantity), threshold: Number(form.threshold) });
      showToast('Resource added', 'success');
      setModal(null);
      setForm({ name: '', resourceType: 'Food', quantity: '', threshold: '', unit: '', warehouseId: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/resources/${allocateTarget.id}/allocate`, {
        quantity: Number(allocateForm.quantity),
        disasterEventId: allocateForm.disasterEventId,
        requestedBy: allocateForm.requestedBy,
      });
      showToast('Resource allocated', 'success');
      setModal(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to allocate resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/resources/${id}`);
      showToast('Resource deleted', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete resource', 'error');
    }
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/resources/warehouses', { ...warehouseForm, capacity: Number(warehouseForm.capacity) });
      showToast('Warehouse added', 'success');
      setModal(null);
      setWarehouseForm({ name: '', location: '', capacity: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add warehouse', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try {
      await api.delete(`/resources/warehouses/${id}`);
      showToast('Warehouse deleted', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete warehouse', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          <p className="text-gray-400 text-sm">Manage inventory and warehouse resources</p>
        </div>
        <button onClick={() => setModal('add')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Resource
        </button>
      </div>

      {/* Resources Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','Name','Type','Quantity','Unit','Warehouse','Stock','Actions'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : resources.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-12">📦 No resources found</td></tr>
            ) : resources.map(r => (
              <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}...</td>
                <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                <td className="px-4 py-3 text-gray-300">{r.resourceType}</td>
                <td className={`px-4 py-3 font-bold ${r.lowStock ? 'text-red-400' : 'text-white'}`}>{r.quantity}</td>
                <td className="px-4 py-3 text-gray-400">{r.unit}</td>
                <td className="px-4 py-3 text-gray-300">{r.warehouse?.name || r.warehouseId || '-'}</td>
                <td className="px-4 py-3">
                  {r.lowStock ? (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                      ⚠️ Low Stock
                    </span>
                  ) : (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">OK</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setAllocateTarget(r); setAllocateForm({ quantity: '', disasterEventId: '', requestedBy: '' }); setModal('allocate'); }}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded transition-colors">
                      Allocate
                    </button>
                    <button onClick={() => handleDeleteResource(r.id)}
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

      {/* Warehouses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Warehouses</h2>
          <button onClick={() => setModal('addWarehouse')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
            + Add Warehouse
          </button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['ID','Name','Location','Capacity','Actions'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-500 py-8">🏭 No warehouses found</td></tr>
              ) : warehouses.map(w => (
                <tr key={w.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{w.id}...</td>
                  <td className="px-4 py-3 text-white">{w.name}</td>
                  <td className="px-4 py-3 text-gray-300">{w.location}</td>
                  <td className="px-4 py-3 text-gray-300">{w.capacity}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeleteWarehouse(w.id)}
                      className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Resource Modal */}
      {modal === 'add' && (
        <Modal title="Add Resource" onClose={() => setModal(null)}>
          <form onSubmit={handleAddResource} className="space-y-4">
            <div><label className={labelCls}>Name</label><input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Resource Type</label>
              <select className={inputCls} value={form.resourceType} onChange={e => setForm(f => ({ ...f, resourceType: e.target.value }))}>
                {RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Quantity</label><input type="number" min="0" className={inputCls} required value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div><label className={labelCls}>Low Stock Threshold</label><input type="number" min="0" className={inputCls} required value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} /></div>
            <div><label className={labelCls}>Unit</label><input className={inputCls} placeholder="e.g. kg, liters, units" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            <div><label className={labelCls}>Warehouse</label>
              <select className={inputCls} value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}>
                <option value="">-- Select warehouse --</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.location})</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Adding...' : 'Add Resource'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Allocate Modal */}
      {modal === 'allocate' && (
        <Modal title={`Allocate: ${allocateTarget?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleAllocate} className="space-y-4">
            <div><label className={labelCls}>Quantity</label><input type="number" min="1" className={inputCls} required value={allocateForm.quantity} onChange={e => setAllocateForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div><label className={labelCls}>Disaster Event</label>
              <select className={inputCls} value={allocateForm.disasterEventId} onChange={e => setAllocateForm(f => ({ ...f, disasterEventId: e.target.value }))}>
                <option value="">-- Select event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Requested By</label><input className={inputCls} value={allocateForm.requestedBy} onChange={e => setAllocateForm(f => ({ ...f, requestedBy: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Allocating...' : 'Allocate'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Warehouse Modal */}
      {modal === 'addWarehouse' && (
        <Modal title="Add Warehouse" onClose={() => setModal(null)}>
          <form onSubmit={handleAddWarehouse} className="space-y-4">
            <div><label className={labelCls}>Name</label><input className={inputCls} required value={warehouseForm.name} onChange={e => setWarehouseForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Location</label><input className={inputCls} required value={warehouseForm.location} onChange={e => setWarehouseForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><label className={labelCls}>Capacity</label><input type="number" min="1" className={inputCls} value={warehouseForm.capacity} onChange={e => setWarehouseForm(f => ({ ...f, capacity: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Adding...' : 'Add Warehouse'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

