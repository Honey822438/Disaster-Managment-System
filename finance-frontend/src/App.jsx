import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DonationsPage from './pages/DonationsPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import BudgetPage from './pages/BudgetPage.jsx';

function Guard({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard"    element={<Guard><DashboardPage /></Guard>} />
        <Route path="/donations"    element={<Guard><DonationsPage /></Guard>} />
        <Route path="/expenses"     element={<Guard><ExpensesPage /></Guard>} />
        <Route path="/transactions" element={<Guard><TransactionsPage /></Guard>} />
        <Route path="/reports"      element={<Guard><ReportsPage /></Guard>} />
        <Route path="/budget"       element={<Guard><BudgetPage /></Guard>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
