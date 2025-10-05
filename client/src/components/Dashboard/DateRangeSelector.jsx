import React, { useState } from 'react';
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi';

/**
 * Date Range Selector Component
 * Allows users to add and manage date ranges/time periods for comparison
 */
function DateRangeSelector({ value, onChange, label = "Select Time Periods" }) {
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('Q1');
  const [error, setError] = useState('');

  // Parse existing value into array of time periods
  const periods = value ? value.split(',').filter(v => v.trim()) : [];

  // Validate year
  const validateYear = (yearInput) => {
    const yearNum = parseInt(yearInput);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(yearNum)) return 'Year must be a number';
    if (yearNum < 2000 || yearNum > currentYear) {
      return `Year must be between 2000 and ${currentYear}`;
    }
    return null;
  };

  // Add a new time period
  const handleAddPeriod = () => {
    setError('');

    // Validate year
    const yearError = validateYear(year);
    if (yearError) {
      setError(yearError);
      return;
    }

    // Format as "YYYY-QX"
    const newPeriod = `${year}-${quarter}`;
    
    // Check for duplicates
    if (periods.includes(newPeriod)) {
      setError('This time period is already added');
      return;
    }

    // Add to periods list
    const updatedPeriods = [...periods, newPeriod];
    onChange(updatedPeriods.join(','));

    // Reset inputs
    setYear('');
    setQuarter('Q1');
  };

  // Remove a period
  const handleRemovePeriod = (index) => {
    const updatedPeriods = periods.filter((_, i) => i !== index);
    onChange(updatedPeriods.join(','));
  };

  // Handle key press (Enter to add)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPeriod();
    }
  };

  // Quick add buttons for common periods
  const handleQuickAdd = (periodOffset) => {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
    
    let targetYear = currentYear;
    let targetQuarter = currentQuarter - periodOffset;
    
    while (targetQuarter <= 0) {
      targetQuarter += 4;
      targetYear -= 1;
    }
    
    const newPeriod = `${targetYear}-Q${targetQuarter}`;
    
    if (!periods.includes(newPeriod)) {
      const updatedPeriods = [...periods, newPeriod];
      onChange(updatedPeriods.join(','));
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <FiCalendar className="inline mr-2" />
        {label}
      </label>

      {/* Input Fields */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Year (e.g., 2023)"
            min="2000"
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="w-28">
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleAddPeriod}
          disabled={!year}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2">
        <div className="text-xs text-gray-500 w-full">Quick add:</div>
        <button
          type="button"
          onClick={() => handleQuickAdd(0)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          Current Quarter
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd(1)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          Last Quarter
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd(4)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          1 Year Ago
        </button>
      </div>

      {/* Selected Periods List */}
      {periods.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-600">Selected Time Periods:</div>
          <div className="space-y-1">
            {periods.map((period, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md"
              >
                <span className="text-sm text-gray-700">
                  Period {index + 1}: {period}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePeriod(index)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="text-xs text-gray-500">
        Add at least 2 time periods for comparison. Format: YYYY-QX (e.g., 2023-Q1)
      </div>
    </div>
  );
}

export default DateRangeSelector;
