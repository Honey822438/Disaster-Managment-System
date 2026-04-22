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

const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500';

const ACTION_COLORS = {
  CREATE: 'bg-green-500/20 text-green-400',
  UPDATE: 'bg-blue-500/20 text-blue-400',
  DELETE: 'bg-red-500/20 text-red-400',
  STATUS_CHANGE: 'bg-orange-500/20 text-orange-400',
  ADMIT: 'bg-blue-500/20 text-blue-400',
  DISCHARGE: 'bg-gray-500/20 text-gray-400',
};

const ENTITY_TYPES = ['EmergencyReport','DisasterEvent','RescueTeam','Resource','Hospital','Patient','Donation','Expense','Approval','User'];

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ action: '', entityType: '', startDate: '', endDate: '' });

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.action) params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      const res = await api.get(`/audit?${params}`);
      const data = res.data;
      setLogs(data?.data || data || []);
      if (data?.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { 
    fetchLogs(); 
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-gray-400 text-sm">System activity and change history</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          className={`${inputCls} w-full`}
          placeholder="Filter by action..."
          value={filters.action}
          onChange={e => handleFilterChange('action', e.target.value)}
        />
        <select
          className={`${inputCls} w-full`}
          value={filters.entityType}
          onChange={e => handleFilterChange('entityType', e.target.value)}
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Start Date</label>
          <input
            type="date"
            className={`${inputCls} w-full`}
            value={filters.startDate}
            onChange={e => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">End Date</label>
          <input
            type="date"
            className={`${inputCls} w-full`}
            value={filters.endDate}
            onChange={e => handleFilterChange('endDate', e.target.value)}
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              {['ID','User','Action','Entity Type','Entity ID','Timestamp'].map(h => (
                <th key={h} className="text-left text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center text-gray-400 py-12">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-12">🔍 No audit logs found</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.id}...</td>
                <td className="px-4 py-3 text-white">{log.user?.username || log.userId || 'System'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-700 text-gray-300'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{log.entityType}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.entityId ?? '-'}</td>
                <td className="px-4 py-3 text-gray-400">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === p ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
                  {p}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
          >
            Next →
          </button>
          <span className="text-gray-500 text-sm ml-2">Page {page} of {totalPages}</span>
        </div>
      )}
    </div>
  );
}

