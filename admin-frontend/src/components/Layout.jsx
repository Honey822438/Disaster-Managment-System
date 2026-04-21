import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const user = () => JSON.parse(localStorage.getItem('user') || '{}');

const NAV = [
  { path: '/dashboard',  icon: '📊', label: 'Dashboard',        roles: ['admin','operator','warehouse_manager','finance_officer'] },
  { path: '/events',     icon: '🌪️', label: 'Disaster Events',  roles: ['admin','operator'] },
  { path: '/reports',    icon: '🚨', label: 'Reports',           roles: ['admin','operator'] },
  { path: '/teams',      icon: '🚒', label: 'Rescue Teams',      roles: ['admin','operator'] },
  { path: '/resources',  icon: '📦', label: 'Resources',         roles: ['admin','warehouse_manager'] },
  { path: '/hospitals',  icon: '🏥', label: 'Hospitals',         roles: ['admin','operator'] },
  { path: '/finance',    icon: '💰', label: 'Finance',           roles: ['admin','finance_officer'] },
  { path: '/approvals',  icon: '✅', label: 'Approvals',         roles: ['admin','operator','warehouse_manager','finance_officer'] },
  { path: '/analytics',  icon: '📈', label: 'Analytics',         roles: ['admin','operator'] },
  { path: '/users',      icon: '👥', label: 'Users',             roles: ['admin'] },
  { path: '/audit',      icon: '🔍', label: 'Audit Logs',        roles: ['admin'] },
  { path: '/db-docs',    icon: '📋', label: 'DB Documentation',   roles: ['admin'] },
];

export default function Layout({ children }) {
  const location = useLocation();
  const u = user();
  const links = NAV.filter(n => n.roles.includes(u.role));

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; };

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🛡️</span>
            <div>
              <p className="text-white text-sm font-bold">Disaster Response</p>
              <p className="text-purple-400 text-xs">MIS Control Center</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-white text-sm font-medium">{u.username}</p>
            <p className="text-purple-400 text-xs capitalize">{u.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button onClick={logout}
            className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors border border-red-500/20">
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
