import React from 'react';
import { FiSearch, FiX, FiInfo } from 'react-icons/fi';

const FilterPanel = ({ filters, onFilterChange, onSearch, onClear, loading, viewMode }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FiSearch size={20} />
        Search Filters
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Species Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Species Name (Scientific)
          </label>
          <input
            type="text"
            value={filters.scientificName}
            onChange={(e) => onFilterChange('scientificName', e.target.value)}
            placeholder="e.g., Mola mola"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Country/Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country/Region
          </label>
          <input
            type="text"
            value={filters.country}
            onChange={(e) => onFilterChange('country', e.target.value)}
            placeholder="e.g., India, Australia"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Overridden by Country ID if both provided
          </p>
        </div>

        {/* Country ID (MRGID) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country ID (MRGID)
          </label>
          <input
            type="number"
            value={filters.countryId}
            onChange={(e) => onFilterChange('countryId', e.target.value)}
            placeholder="e.g., 100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. Find IDs at{' '}
            <a 
              href="https://www.marineregions.org/gazetteer.php" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Marine Regions
            </a>
          </p>
        </div>

        {/* Grid Precision (only in grid view) */}
        {viewMode === 'grid' && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              Grid Precision
              <span className="font-normal text-blue-600">({filters.precision})</span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={filters.precision}
              onChange={(e) => onFilterChange('precision', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (Coarse)</span>
              <span>12 (Fine)</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
              <div className="flex items-start gap-1">
                <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={12} />
                <p className="text-xs text-blue-800">
                  {filters.precision <= 3 && 'Country/continent level (~156km cells)'}
                  {filters.precision === 4 && 'Large region level (~39km cells)'}
                  {filters.precision === 5 && 'Region level (~5km cells)'}
                  {filters.precision === 6 && 'City level (~1.2km cells)'}
                  {filters.precision === 7 && 'Neighborhood level (~153m cells)'}
                  {filters.precision === 8 && 'Street level (~38m cells)'}
                  {filters.precision >= 9 && 'Building level (~5m cells or smaller)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Depth Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Depth Range (meters)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={filters.startDepth}
              onChange={(e) => onFilterChange('startDepth', e.target.value)}
              placeholder="Min depth"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={filters.endDepth}
              onChange={(e) => onFilterChange('endDepth', e.target.value)}
              placeholder="Max depth"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <FiSearch size={16} />
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FiX size={16} />
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterPanel;
