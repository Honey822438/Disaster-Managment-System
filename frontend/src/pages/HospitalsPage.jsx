import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import CapacityBar from '../components/CapacityBar';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Toast from '../components/Toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const HospitalsPage = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [toast, setToast] = useState(null);
  const [admitForm, setAdmitForm] = useState({
    name: '',
    age: '',
    gender: '',
    condition: '',
    emergencyReportId: '',
  });

  const canAdmit = ['admin', 'operator'].includes(user?.role);

  useEffect(() => {
    fetchHospitals();
    fetchReports();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/hospitals');
      setHospitals(response.data.data || response.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to load hospitals', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await apiClient.get('/reports');
      setReports(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    }
  };

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/hospitals/${selectedHospital.id}/admit`, {
        ...admitForm,
        age: parseInt(admitForm.age),
        emergencyReportId: admitForm.emergencyReportId ? parseInt(admitForm.emergencyReportId) : null,
      });
      setToast({ message: 'Patient admitted successfully', type: 'success' });
      setShowAdmitModal(false);
      setSelectedHospital(null);
      setAdmitForm({
        name: '',
        age: '',
        gender: '',
        condition: '',
        emergencyReportId: '',
      });
      fetchHospitals();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to admit patient', type: 'error' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Hospital Name' },
    { key: 'location', label: 'Location' },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (_, row) => (
        <CapacityBar
          total={row.totalBeds}
          used={row.totalBeds - row.availableBeds}
        />
      ),
    },
    { key: 'contactNumber', label: 'Contact' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) =>
        canAdmit && row.availableBeds > 0 ? (
          <button
            onClick={() => {
              setSelectedHospital(row);
              setShowAdmitModal(true);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Admit Patient
          </button>
        ) : row.availableBeds === 0 ? (
          <span className="text-red-500 text-sm">Full</span>
        ) : null,
    },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Hospitals</h1>
        <p className="text-gray-400">Monitor hospital capacity and patient admissions</p>
      </div>

      <DataTable columns={columns} data={hospitals} loading={loading} />

      <Modal
        isOpen={showAdmitModal}
        onClose={() => {
          setShowAdmitModal(false);
          setSelectedHospital(null);
        }}
        title={`Admit Patient to ${selectedHospital?.name}`}
      >
        <form onSubmit={handleAdmitPatient}>
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <p className="text-sm text-gray-400">
              Available Beds: <span className="text-white font-bold">{selectedHospital?.availableBeds}</span>
            </p>
          </div>
          <FormField
            label="Patient Name"
            name="name"
            value={admitForm.name}
            onChange={(e) => setAdmitForm({ ...admitForm, name: e.target.value })}
            required
          />
          <FormField
            label="Age"
            type="number"
            name="age"
            value={admitForm.age}
            onChange={(e) => setAdmitForm({ ...admitForm, age: e.target.value })}
            required
          />
          <FormField
            label="Gender"
            type="select"
            name="gender"
            value={admitForm.gender}
            onChange={(e) => setAdmitForm({ ...admitForm, gender: e.target.value })}
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ]}
            required
          />
          <FormField
            label="Condition"
            type="textarea"
            name="condition"
            value={admitForm.condition}
            onChange={(e) => setAdmitForm({ ...admitForm, condition: e.target.value })}
            required
          />
          <FormField
            label="Emergency Report (Optional)"
            type="select"
            name="emergencyReportId"
            value={admitForm.emergencyReportId}
            onChange={(e) => setAdmitForm({ ...admitForm, emergencyReportId: e.target.value })}
            options={reports.map((report) => ({
              value: report.id,
              label: `#${report.id} - ${report.location}`,
            }))}
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Admit Patient
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

export default HospitalsPage;
