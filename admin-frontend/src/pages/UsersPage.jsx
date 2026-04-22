import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

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
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg">
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

const ROLE_COLORS = {
  admin: 'bg-purple-500/20 text-purple-400',
  operator: 'bg-blue-500/20 text-blue-400',
  field_officer: 'bg-teal-500/20 text-teal-400',
  warehouse_manager: 'bg-amber-500/20 text-amber-400',
  finance_officer: 'bg-green-500/20 text-green-400',
};

const ROLES = ['admin','operator','field_officer','warehouse_manager','finance_officer'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'operator' });
  const [roleVal, setRoleVal] = useState('operator');
  const [roleFilter, setRoleFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const data = res.data?.data || res.data || [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchUsers(); 
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  useEffect(() => {
    if (roleFilter) {
      setFilteredUsers(users.filter(u => u.role === roleFilter));
    } else {
      setFilteredUsers(users);
    }
  }, [roleFilter, users]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/register', form);
      showToast('User created successfully', 'success');
      setModal(null);
      setForm({ username: '', email: '', password: '', role: 'operator' });
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/users/${editTarget.id}`, { role: roleVal });
      showToast('Role updated', 'success');
      setModal(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser.id) {
      return showToast('Cannot delete your own account', 'error');
    }
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      showToast('User deleted', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm">Manage system users and roles</p>
        </div>
        <button onClick={() => { setForm({ username: '', email: '', password: '', role: 'operator' }); setModal('add'); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add User
        </button>
      </div>

      {/* Filter */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="text-gray-400 text-sm mr-3">Filter by Role:</label>
        <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','Username','Email','Role','Created At','Actions'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-12">👥 No users found</td></tr>
            ) : filteredUsers.map(u => (
              <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.id}...</td>
                <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                <td className="px-4 py-3 text-gray-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${ROLE_COLORS[u.role] || 'bg-gray-700 text-gray-300'}`}>
                    {u.role?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditTarget(u); setRoleVal(u.role); setModal('edit'); }}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded transition-colors">
                      Edit Role
                    </button>
                    <button onClick={() => handleDelete(u)}
                      className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded transition-colors"
                      disabled={u.id === currentUser.id}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {modal === 'add' && (
        <Modal title="Add User" onClose={() => setModal(null)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className={labelCls}>Username</label><input className={inputCls} required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
            <div><label className={labelCls}>Email</label><input type="email" className={inputCls} required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className={labelCls}>Password</label><input type="password" className={inputCls} required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div><label className={labelCls}>Role</label>
              <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {modal === 'edit' && (
        <Modal title={`Edit Role: ${editTarget?.username}`} onClose={() => setModal(null)}>
          <form onSubmit={handleEditRole} className="space-y-4">
            <div><label className={labelCls}>Role</label>
              <select className={inputCls} value={roleVal} onChange={e => setRoleVal(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

