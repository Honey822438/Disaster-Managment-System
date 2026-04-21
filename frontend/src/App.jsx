import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './context/AuthContext';

// Core pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EmergencyReportsPage from './pages/EmergencyReportsPage';
import RescueTeamsPage from './pages/RescueTeamsPage';
import ResourcesPage from './pages/ResourcesPage';
import HospitalsPage from './pages/HospitalsPage';
import FinancePage from './pages/FinancePage';
import ApprovalsPage from './pages/ApprovalsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Portal pages
import CitizenPortalPage from './pages/CitizenPortalPage';
import HospitalPortalPage from './pages/HospitalPortalPage';
import RescuePortalPage from './pages/RescuePortalPage';

// Admin docs
import DatabaseDocsPage from './pages/DatabaseDocsPage';

// Smart default redirect based on role + last selected portal
function DefaultRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const portal = localStorage.getItem('selectedPortal');
  if (portal === 'citizen') return <Navigate to="/citizen-portal" replace />;
  if (portal === 'hospital') return <Navigate to="/hospital-portal" replace />;
  if (portal === 'rescue') return <Navigate to="/rescue-portal" replace />;
  if (user.role === 'field_officer') return <Navigate to="/citizen-portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Admin / Ops Dashboard ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'warehouse_manager', 'finance_officer']}>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/events" element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <EventsPage />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'field_officer']}>
              <EmergencyReportsPage />
            </ProtectedRoute>
          } />

          <Route path="/teams" element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'field_officer']}>
              <RescueTeamsPage />
            </ProtectedRoute>
          } />

          <Route path="/resources" element={
            <ProtectedRoute allowedRoles={['admin', 'warehouse_manager']}>
              <ResourcesPage />
            </ProtectedRoute>
          } />

          <Route path="/hospitals" element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <HospitalsPage />
            </ProtectedRoute>
          } />

          <Route path="/finance" element={
            <ProtectedRoute allowedRoles={['admin', 'finance_officer']}>
              <FinancePage />
            </ProtectedRoute>
          } />

          <Route path="/approvals" element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'warehouse_manager', 'finance_officer']}>
              <ApprovalsPage />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />

          <Route path="/audit" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />

          <Route path="/db-docs" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DatabaseDocsPage />
            </ProtectedRoute>
          } />

          {/* ── Citizen Portal (field_officer) ── */}
          <Route path="/citizen-portal" element={
            <ProtectedRoute allowedRoles={['field_officer', 'admin']}>
              <CitizenPortalPage />
            </ProtectedRoute>
          } />

          {/* ── Hospital Portal (operator) ── */}
          <Route path="/hospital-portal" element={
            <ProtectedRoute allowedRoles={['operator', 'admin']}>
              <HospitalPortalPage />
            </ProtectedRoute>
          } />

          {/* ── Rescue Portal (field_officer) ── */}
          <Route path="/rescue-portal" element={
            <ProtectedRoute allowedRoles={['field_officer', 'admin']}>
              <RescuePortalPage />
            </ProtectedRoute>
          } />

          {/* Smart default redirect */}
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
