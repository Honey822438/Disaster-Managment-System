import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard',         icon: '📊', path: '/dashboard',  roles: ['admin','operator','warehouse_manager','finance_officer'] },
    { name: 'Disaster Events',   icon: '🌪️', path: '/events',     roles: ['admin','operator'] },
    { name: 'Emergency Reports', icon: '🚨', path: '/reports',    roles: ['admin','operator','field_officer'] },
    { name: 'Rescue Teams',      icon: '🚒', path: '/teams',      roles: ['admin','operator','field_officer'] },
    { name: 'Resources',         icon: '📦', path: '/resources',  roles: ['admin','warehouse_manager'] },
    { name: 'Hospitals',         icon: '🏥', path: '/hospitals',  roles: ['admin','operator'] },
    { name: 'Finance',           icon: '💰', path: '/finance',    roles: ['admin','finance_officer'] },
    { name: 'Approvals',         icon: '✅', path: '/approvals',  roles: ['admin','operator','warehouse_manager','finance_officer'] },
    { name: 'Analytics',         icon: '📈', path: '/analytics',  roles: ['admin','operator'] },
    { name: 'Users',             icon: '👥', path: '/users',      roles: ['admin'] },
    { name: 'Audit Logs',        icon: '🔍', path: '/audit',      roles: ['admin'] },
    { name: 'DB Documentation',  icon: '📋', path: '/db-docs',    roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🛡️</span>
          <div>
            <p className="text-sm font-bold text-white">Disaster Response</p>
            <p className="text-xs text-blue-400">MIS Control Center</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg px-3 py-2">
          <p className="text-sm text-white font-medium">{user?.username}</p>
          <p className="text-xs text-blue-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
