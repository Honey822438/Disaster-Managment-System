import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import HospitalsPage from './pages/HospitalsPage.jsx';
import FinancePage from './pages/FinancePage.jsx';
import ApprovalsPage from './pages/ApprovalsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import DatabaseDocsPage from './pages/DatabaseDocsPage.jsx';
import Layout from './components/Layout.jsx';

const ADMIN_ROLES = ['admin', 'operator', 'warehouse_manager', 'finance_officer'];

function ProtectedRoute({ children, roles }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-5xl mb-3">🚫</p>
          <p className="text-red-400 text-xl font-bold">Access Denied</p>
          <p className="text-gray-400 text-sm mt-2">Your role does not have permission for this page.</p>
        </div>
      </div>
    </Layout>
  );
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute roles={ADMIN_ROLES}><Layout><DashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin','operator','field_officer']}><Layout><ReportsPage /></Layout></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute roles={['admin','operator']}><Layout><EventsPage /></Layout></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute roles={['admin','operator']}><Layout><TeamsPage /></Layout></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute roles={['admin','warehouse_manager']}><Layout><ResourcesPage /></Layout></ProtectedRoute>} />
        <Route path="/hospitals" element={<ProtectedRoute roles={['admin','operator']}><Layout><HospitalsPage /></Layout></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute roles={['admin','finance_officer']}><Layout><FinancePage /></Layout></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute roles={['admin','operator','warehouse_manager','finance_officer']}><Layout><ApprovalsPage /></Layout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><Layout><UsersPage /></Layout></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute roles={['admin']}><Layout><AuditPage /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={['admin','operator']}><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
        <Route path="/db-docs" element={<ProtectedRoute roles={['admin']}><Layout><DatabaseDocsPage /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
