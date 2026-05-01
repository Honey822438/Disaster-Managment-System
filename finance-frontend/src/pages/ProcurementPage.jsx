import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const NAV = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { path: '/donations',    icon: '💚', label: 'Donations' },
  { path: '/expenses',     icon: '💸', label: 'Expenses' },
  { path: '/procurement',  icon: '🛒', label: 'Procurement' },
  { path: '/budget',       icon: '🎯', label: 'Budget' },
  { path: '/transactions', icon: '📋', label: 'Transactions' },
  { path: '/reports',      icon: '📈', label: 'Reports' },
];

const inp = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm';
const lbl = 'block text-gray-400 text-sm mb-1';

export default function ProcurementPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [resources, setResources] = useState([]);
  const [events, setEvents]       = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState(null);

  const [form, setForm] = useState({
    resourceId: '',
    quantity: '',
    unitCost: '',
    disasterEventId: '',
    supplierName: '',
    receiptRef: '',
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchData = useCallback(async () => {
    try {
      const [resRes, evRes, expRes] = await Promise.all([
        api.get('/resources'),
        api.get('/events'),
        api.get('/finance/expenses?category=Procurement&limit=50'),
      ]);
      setResources(resRes.data.data || resRes.data || []);
      setEvents(evRes.data.data || evRes.data || []);
      setExpenses(expRes.data.data || expRes.data || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 15000);
    return () => clearInterval(i);
  }, [fetchData]);

  const selectedResource = resources.find(r => String(r.id) === String(form.resourceId));
  const totalCost = form.quantity && form.unitCost
    ? (parseFloat(form.quantity) * parseFloat(form.unitCost)).toFixed(2)
    : '0.00';

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/finance/purchase-resource', {
        ...form,
        quantity: parseInt(form.quantity),
        unitCost: parseFloat(form.unitCost),
      });
      showToast('success',
        `✅ Purchased ${form.quantity} ${selectedResource?.unit || 'units'} of ${selectedResource?.name}. Stock updated.`
      );
      setShowForm(false);
      setForm({ resourceId: '', quantity: '', unitCost: '', disasterEventId: '', supplierName: '', receiptRef: '' });
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Purchase failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💰</span>
            <div>
              <p className="text-white text-sm font-bold">Finance Portal</p>
              <p className="text-emerald-400 text-xs">Disaster Response MIS</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-white text-sm font-medium">{user.username}</p>
            <p className="text-emerald-400 text-xs capitalize">{user.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.path === '/procurement'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout}
            className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-500/20">
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-xl max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-3 opacity-70">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🛒 Resource Procurement</h1>
            <p className="text-gray-400 text-sm">Purchase resources — stock is updated immediately upon purchase</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
            + New Purchase Order
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-6">
          <p className="text-emerald-400 text-sm">
            ℹ️ Procurement purchases are <strong>immediately approved</strong> and warehouse stock is updated atomically.
            The cost is recorded as an approved <strong>Procurement</strong> expense against the selected disaster event.
          </p>
        </div>

        {/* Low stock alert */}
        {resources.filter(r => r.lowStock).length > 0 && (
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm font-semibold mb-2">⚠️ Low Stock Resources — Consider Purchasing:</p>
            <div className="flex flex-wrap gap-2">
              {resources.filter(r => r.lowStock).map(r => (
                <button key={r.id}
                  onClick={() => { setForm(f => ({ ...f, resourceId: String(r.id) })); setShowForm(true); }}
                  className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full hover:bg-red-500/30 transition-colors">
                  ⚠️ {r.name} ({r.quantity} {r.unit} left)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Procurement History Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Procurement History</h2>
            <button onClick={fetchData} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg">🔄 Refresh</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['ID','Description','Amount','Event','Status','Recorded By','Date'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-12">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-12">🛒 No procurement records yet</td></tr>
              ) : expenses.map(ex => (
                <tr key={ex.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{ex.id}</td>
                  <td className="px-4 py-3 text-white max-w-xs">{ex.description}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">${Number(ex.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{ex.disasterEvent?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">✅ Approved</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{ex.recordedBy?.username || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(ex.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Purchase Order Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">🛒 New Purchase Order</h3>
                <button onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">✕</button>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mb-4">
                <p className="text-emerald-400 text-xs">
                  ✅ Purchase is <strong>immediately approved</strong> — warehouse stock updates instantly.
                  Cost is recorded as an approved Procurement expense.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Resource selector */}
                <div>
                  <label className={lbl}>Resource to Purchase *</label>
                  <select className={inp} required value={form.resourceId}
                    onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))}>
                    <option value="">-- Select resource --</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.resourceType}) — {r.quantity} {r.unit} in stock
                        {r.lowStock ? ' ⚠️ LOW' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedResource && (
                    <div className="mt-2 bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-4 text-xs">
                      <span className="text-gray-400">Current stock: <span className={selectedResource.lowStock ? 'text-red-400 font-bold' : 'text-white font-bold'}>{selectedResource.quantity} {selectedResource.unit}</span></span>
                      <span className="text-gray-400">Warehouse: <span className="text-gray-300">{selectedResource.warehouse?.name}</span></span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Quantity to Buy *</label>
                    <input type="number" min="1" className={inp} required
                      value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      placeholder={`e.g. 500 ${selectedResource?.unit || 'units'}`} />
                  </div>
                  <div>
                    <label className={lbl}>Unit Cost ($) *</label>
                    <input type="number" min="0.01" step="0.01" className={inp} required
                      value={form.unitCost}
                      onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))}
                      placeholder="Cost per unit" />
                  </div>
                </div>

                {/* Total cost preview */}
                {form.quantity && form.unitCost && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Purchase Cost:</span>
                    <span className="text-emerald-400 font-bold text-lg">${Number(totalCost).toLocaleString()}</span>
                  </div>
                )}

                <div>
                  <label className={lbl}>Disaster Event (charge to) *</label>
                  <select className={inp} required value={form.disasterEventId}
                    onChange={e => setForm(f => ({ ...f, disasterEventId: e.target.value }))}>
                    <option value="">-- Select event --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Supplier Name</label>
                    <input className={inp} value={form.supplierName}
                      onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                      placeholder="e.g. MedSupply Co." />
                  </div>
                  <div>
                    <label className={lbl}>Receipt / Invoice Ref</label>
                    <input className={inp} value={form.receiptRef}
                      onChange={e => setForm(f => ({ ...f, receiptRef: e.target.value }))}
                      placeholder="e.g. INV-2024-001" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm">
                    {submitting ? 'Processing...' : `🛒 Confirm Purchase ($${Number(totalCost).toLocaleString()})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
