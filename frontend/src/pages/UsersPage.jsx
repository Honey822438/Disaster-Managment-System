import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'operator', 'field_officer', 'warehouse_manager', 'finance_officer'];

const ROLE_COLORS = {
  admin: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  operator: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  field_officer: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  warehouse_manager: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  finance_officer: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', email: '', password: '', role: 'operator' });
  const [addLoading, setAddLoading] = useState(false);

  // Edit Role Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (roleFilter) {
      setFiltered(users.filter((u) => u.role === roleFilter));
    } else {
      setFiltered(users);
    }
  }, [roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users');
      const list = res.data.data || res.data || [];
      setUsers(list);
      setFiltered(list);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await apiClient.post('/auth/register', addForm);
      setToast({ message: 'User created successfully', type: 'success' });
      setShowAddModal(false);
      setAddForm({ username: '', email: '', password: '', role: 'operator' });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to create user', type: 'error' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await apiClient.put(`/users/${editUser.id}`, { role: editRole });
      setToast({ message: 'Role updated successfully', type: 'success' });
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to update role', type: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/users/${u.id}`);
      setToast({ message: 'User deleted', type: 'success' });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to delete user', type: 'error' });
    }
  };

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Manage system users and roles</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            ➕ Add User
          </button>
        )}
      </div>

      {/* Role Filter */}
      <div className="mb-5 flex items-center gap-3">
        <label className="text-gray-400 text-sm">Filter by role:</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {roleFilter && (
          <button onClick={() => setRoleFilter('')} className="text-gray-400 hover:text-white text-sm">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-12">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left text-gray-400 px-5 py-3">ID</th>
                  <th className="text-left text-gray-400 px-5 py-3">Username</th>
                  <th className="text-left text-gray-400 px-5 py-3">Email</th>
                  <th className="text-left text-gray-400 px-5 py-3">Role</th>
                  <th className="text-left text-gray-400 px-5 py-3">Created</th>
                  <th className="text-left text-gray-400 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{u.id}</td>
                    <td className="px-5 py-3 text-white font-medium">{u.username}</td>
                    <td className="px-5 py-3 text-gray-300">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[u.role] || 'bg-gray-700 text-gray-300'}`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditUser(u); setEditRole(u.role); setShowEditModal(true); }}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs rounded-lg border border-blue-500/30 transition-colors"
                        >
                          Edit Role
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              {[
                { label: 'Username', key: 'username', type: 'text', placeholder: 'johndoe' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'john@example.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-1">{label} *</label>
                  <input
                    type={type}
                    value={addForm[key]}
                    onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })}
                    required
                    placeholder={placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role *</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {addLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Edit Role — {editUser.username}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleEditRole} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={editLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {editLoading ? 'Saving...' : 'Save Role'}
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

export default UsersPage;
