import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const user = JSON.parse(localStorage.getItem('user') || '{}');

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
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">x</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500';
const labelCls = 'block text-gray-400 text-sm mb-1';
const EXPENSE_CATEGORIES = ['Personnel','Equipment','Supplies','Transport','Communication','Infrastructure','Other'];
const canManage = ['admin','finance_officer'].includes(user.role);

export default function FinancePage() {
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalDonations: 0, totalExpenses: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [donationForm, setDonationForm] = useState({ donorName: '', organization: '', amount: '', disasterEventId: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Personnel', amount: '', description: '', disasterEventId: '' });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [donRes, expRes, sumRes, evRes] = await Promise.all([
        api.get('/finance/donations'),
        api.get('/finance/expenses'),
        api.get('/finance/summary'),
        api.get('/events'),
      ]);
      setDonations(donRes.data?.data || donRes.data || []);
      setExpenses(expRes.data?.data || expRes.data || []);
      setSummary(sumRes.data || { totalDonations: 0, totalExpenses: 0 });
      setEvents(evRes.data?.data || evRes.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load finance data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDonation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance/donations', { ...donationForm, amount: Number(donationForm.amount) });
      showToast('Donation recorded', 'success');
      setModal(null);
      setDonationForm({ donorName: '', organization: '', amount: '', disasterEventId: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record donation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance/expenses', { ...expenseForm, amount: Number(expenseForm.amount) });
      showToast('Expense recorded', 'success');
      setModal(null);
      setExpenseForm({ category: 'Personnel', amount: '', description: '', disasterEventId: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const netBalance = (summary.totalDonations || 0) - (summary.totalExpenses || 0);

  if (loading) return <div className="text-gray-400 text-center py-20">Loading...</div>;

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-white">Finance</h1>
        <p className="text-gray-400 text-sm">Track donations and expenses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Donations</p>
          <p className="text-2xl font-bold text-emerald-400">${(summary.totalDonations || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">${(summary.totalExpenses || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Net Balance</p>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${netBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Donations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Donations</h2>
          {canManage && (
            <button onClick={() => setModal('donation')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              + Record Donation
            </button>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['ID','Donor','Organization','Amount','Event','Date'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">💰 No donations recorded</td></tr>
              ) : donations.map(d => (
                <tr key={d.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{d.id}...</td>
                  <td className="px-4 py-3 text-white">{d.donorName}</td>
                  <td className="px-4 py-3 text-gray-300">{d.organization || '-'}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">${Number(d.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{d.disasterEvent?.name || d.disasterEventId || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Expenses</h2>
          {canManage && (
            <button onClick={() => setModal('expense')}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              + Record Expense
            </button>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['ID','Category','Amount','Description','Event','Date'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">💸 No expenses recorded</td></tr>
              ) : expenses.map(ex => (
                <tr key={ex.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{ex.id}...</td>
                  <td className="px-4 py-3"><span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">{ex.category}</span></td>
                  <td className="px-4 py-3 text-red-400 font-medium">${Number(ex.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{ex.description || '-'}</td>
                  <td className="px-4 py-3 text-gray-300">{ex.disasterEvent?.name || ex.disasterEventId || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{ex.createdAt ? new Date(ex.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Donation Modal */}
      {modal === 'donation' && (
        <Modal title="Record Donation" onClose={() => setModal(null)}>
          <form onSubmit={handleDonation} className="space-y-4">
            <div><label className={labelCls}>Donor Name</label><input className={inputCls} required value={donationForm.donorName} onChange={e => setDonationForm(f => ({ ...f, donorName: e.target.value }))} /></div>
            <div><label className={labelCls}>Organization (optional)</label><input className={inputCls} value={donationForm.organization} onChange={e => setDonationForm(f => ({ ...f, organization: e.target.value }))} /></div>
            <div><label className={labelCls}>Amount ($)</label><input type="number" min="0" step="0.01" className={inputCls} required value={donationForm.amount} onChange={e => setDonationForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><label className={labelCls}>Disaster Event</label>
              <select className={inputCls} value={donationForm.disasterEventId} onChange={e => setDonationForm(f => ({ ...f, disasterEventId: e.target.value }))}>
                <option value="">-- Select event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Recording...' : 'Record Donation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Expense Modal */}
      {modal === 'expense' && (
        <Modal title="Record Expense" onClose={() => setModal(null)}>
          <form onSubmit={handleExpense} className="space-y-4">
            <div><label className={labelCls}>Category</label>
              <select className={inputCls} value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Amount ($)</label><input type="number" min="0" step="0.01" className={inputCls} required value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label className={labelCls}>Disaster Event</label>
              <select className={inputCls} value={expenseForm.disasterEventId} onChange={e => setExpenseForm(f => ({ ...f, disasterEventId: e.target.value }))}>
                <option value="">-- Select event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Recording...' : 'Record Expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

