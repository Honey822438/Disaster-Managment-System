import React from 'react';

const CapacityBar = ({ total, used, label }) => {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const available = total - used;

  const getColorClass = () => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full">
      {label && <p className="text-sm text-gray-400 mb-2">{label}</p>}
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full ${getColorClass()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Used: {used}</span>
        <span>Available: {available}</span>
        <span>Total: {total}</span>
      </div>
    </div>
  );
};

export default CapacityBar;
