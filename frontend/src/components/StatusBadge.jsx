import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
  const getColorClasses = () => {
    if (type === 'severity') {
      switch (status) {
        case 'Critical':
          return 'bg-red-600 text-white';
        case 'High':
          return 'bg-orange-500 text-white';
        case 'Medium':
          return 'bg-yellow-500 text-gray-900';
        case 'Low':
          return 'bg-green-500 text-white';
        default:
          return 'bg-gray-600 text-white';
      }
    }

    if (type === 'team') {
      switch (status) {
        case 'Available':
          return 'bg-green-500 text-white';
        case 'Assigned':
          return 'bg-orange-500 text-white';
        case 'Busy':
          return 'bg-red-600 text-white';
        default:
          return 'bg-gray-600 text-white';
      }
    }

    if (type === 'report') {
      switch (status) {
        case 'Pending':
          return 'bg-yellow-500 text-gray-900';
        case 'Assigned':
          return 'bg-blue-500 text-white';
        case 'InProgress':
          return 'bg-orange-500 text-white';
        case 'Resolved':
          return 'bg-green-500 text-white';
        case 'Closed':
          return 'bg-gray-600 text-white';
        default:
          return 'bg-gray-600 text-white';
      }
    }

    if (type === 'approval') {
      switch (status) {
        case 'pending':
          return 'bg-yellow-500 text-gray-900';
        case 'approved':
          return 'bg-green-500 text-white';
        case 'rejected':
          return 'bg-red-600 text-white';
        default:
          return 'bg-gray-600 text-white';
      }
    }

    return 'bg-blue-500 text-white';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorClasses()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
