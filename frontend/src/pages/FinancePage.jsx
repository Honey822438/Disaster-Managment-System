import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import MetricCard from '../components/MetricCard';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const FinancePage = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [donationForm, setDonationForm] = useState({
    donorName: '',
    organization: '',
    amount: '',
    disasterEventId: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    description: '',
    disasterEventId: '',
  });

  const canManage = ['admin', 'finance_officer'].includes(user?.role);

  useEffect(() => {
    fetchFinanceData();
    fetchEvents();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [donationsRes, expensesRes, summaryRes] = await Promise.all([
        apiClient.get('/finance/donations'),
        apiClient.get('/finance/expenses'),
        apiClient.get('/finance/summary'),
      ]);
      setDonations(donationsRes.data.data || donationsRes.data);
      setExpenses(expensesRes.data.data || expensesRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load finance data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get('/events');
      setEvents(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to load events', err);
    }
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/finance/donations', {
        ...donationForm,
        amount: parseFloat(donationForm.amount),
        disasterEventId: parseInt(donationForm.disasterEventId),
      });
      setToast({ message: 'Donation recorded successfully', type: 'success' });
      setShowDonationModal(false);
      setDonationForm({ donorName: '', organization: '', amount: '', disasterEventId: '' });
      fetchFinanceData();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to record donation', type: 'error' });
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/finance/expenses', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        disasterEventId: parseInt(expenseForm.disasterEventId),
      });
      setToast({ message: 'Expense recorded successfully', type: 'success' });
      setShowExpenseModal(false);
      setExpenseForm({ category: '', amount: '', description: '', disasterEventId: '' });
      fetchFinanceData();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to record expense', type: 'error' });
    }
  };

  const donationColumns = [
    { key: 'id', label: 'ID' },
    { key: 'donorName', label: 'Donor' },
    { key: 'organization', label: 'Organization' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `$${parseFloat(value).toLocaleString()}`,
    },
    {
      key: 'donatedAt',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const expenseColumns = [
    { key: 'id', label: 'ID' },
    { key: 'category', label: 'Category' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `$${parseFloat(value).toLocaleString()}`,
    },
    { key: 'description', label: 'Description' },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Finance</h1>
          <p className="text-gray-400">Track donations and expenses</p>
        </div>
        {canManage && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDonationModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Record Donation
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Record Expense
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Donations"
          value={`$${(summary?.totalDonations || 0).toLocaleString()}`}
          color="green"
        />
        <MetricCard
          title="Total Expenses"
          value={`$${(summary?.totalExpenses || 0).toLocaleString()}`}
          color="red"
        />
        <MetricCard
          title="Net Balance"
          value={`$${((summary?.totalDonations || 0) - (summary?.totalExpenses || 0)).toLocaleString()}`}
          color="blue"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Donations</h2>
        <DataTable columns={donationColumns} data={donations} loading={loading} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Expenses</h2>
        <DataTable columns={expenseColumns} data={expenses} loading={loading} />
      </div>

      <Modal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        title="Record Donation"
      >
        <form onSubmit={handleCreateDonation}>
          <FormField
            label="Donor Name"
            name="donorName"
            value={donationForm.donorName}
            onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
            required
          />
          <FormField
            label="Organization"
            name="organization"
            value={donationForm.organization}
            onChange={(e) => setDonationForm({ ...donationForm, organization: e.target.value })}
          />
          <FormField
            label="Amount"
            type="number"
            name="amount"
            value={donationForm.amount}
            onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
            required
          />
          <FormField
            label="Disaster Event"
            type="select"
            name="disasterEventId"
            value={donationForm.disasterEventId}
            onChange={(e) => setDonationForm({ ...donationForm, disasterEventId: e.target.value })}
            options={events.map((event) => ({
              value: event.id,
              label: event.name,
            }))}
            required
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Record Donation
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Record Expense"
      >
        <form onSubmit={handleCreateExpense}>
          <FormField
            label="Category"
            type="select"
            name="category"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            options={[
              { value: 'Medical', label: 'Medical' },
              { value: 'Transport', label: 'Transport' },
              { value: 'Equipment', label: 'Equipment' },
              { value: 'Personnel', label: 'Personnel' },
              { value: 'Infrastructure', label: 'Infrastructure' },
              { value: 'Other', label: 'Other' },
            ]}
            required
          />
          <FormField
            label="Amount"
            type="number"
            name="amount"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            required
          />
          <FormField
            label="Description"
            type="textarea"
            name="description"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            required
          />
          <FormField
            label="Disaster Event"
            type="select"
            name="disasterEventId"
            value={expenseForm.disasterEventId}
            onChange={(e) => setExpenseForm({ ...expenseForm, disasterEventId: e.target.value })}
            options={events.map((event) => ({
              value: event.id,
              label: event.name,
            }))}
            required
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Record Expense
          </button>
        </form>
      </Modal>

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </Layout>
  );
};

export default FinancePage;
