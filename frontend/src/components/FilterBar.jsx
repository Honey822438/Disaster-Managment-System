import React from 'react';

const FilterBar = ({ filters, values, onChange, onClear }) => {
  const handleChange = (name, value) => {
    onChange({ ...values, [name]: value });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.name}>
            <label className="block text-gray-400 text-sm mb-2">{filter.label}</label>
            {filter.type === 'select' ? (
              <select
                value={values[filter.name] || ''}
                onChange={(e) => handleChange(filter.name, e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">All</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={filter.type || 'text'}
                value={values[filter.name] || ''}
                onChange={(e) => handleChange(filter.name, e.target.value)}
                placeholder={filter.placeholder}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
        ))}
      </div>
      {onClear && (
        <div className="mt-4">
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
