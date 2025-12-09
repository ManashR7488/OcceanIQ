import React, { useState, useMemo } from 'react';
import { FiSearch, FiFilter, FiUpload, FiDatabase, FiAlertCircle } from 'react-icons/fi';
import DatasetCard from './DatasetCard';

const DatasetList = ({ datasets, activeId, onSelect, onDelete, onUpload, loading, onDownload }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, name, size, chunks
  const [filterType, setFilterType] = useState('all'); // all, csv, json, xml, netcdf

  // Filter and sort datasets
  const filteredDatasets = useMemo(() => {
    let filtered = [...datasets];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(ds =>
        ds.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(ds => {
        const ext = ds.filename.split('.').pop().toLowerCase();
        return ext === filterType || (filterType === 'netcdf' && ext === 'nc');
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return (b.size || 0) - (a.size || 0);
        case 'chunks':
          return (b.chunksStored || 0) - (a.chunksStored || 0);
        case 'date':
        default:
          const aTime = isNaN(new Date(a.uploadDate).getTime()) ? 0 : new Date(a.uploadDate).getTime();
          const bTime = isNaN(new Date(b.uploadDate).getTime()) ? 0 : new Date(b.uploadDate).getTime();
          return bTime - aTime;
      }
    });

    return filtered;
  }, [datasets, searchQuery, sortBy, filterType]);

  // Empty state
  if (!loading && datasets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 p-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full">
          <FiDatabase size={48} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Datasets Yet</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-xs">
          Upload your first marine dataset to start analyzing data with AI
        </p>
        <button
          onClick={onUpload}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <FiUpload />
          Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Search and Filters */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Search Bar */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter and Sort Row */}
        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <div className="flex-1 relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="netcdf">NetCDF</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="date">Recent</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="chunks">Chunks</option>
          </select>
        </div>

        {/* Results Count */}
        <p className="mt-2 text-xs text-gray-500">
          {filteredDatasets.length} of {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Dataset Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border-2 border-gray-200 bg-white animate-pulse">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-5 h-5 bg-gray-300 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-300 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="h-4 bg-gray-300 rounded" />
                <div className="h-4 bg-gray-300 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-gray-300 rounded" />
                <div className="w-20 h-8 bg-gray-300 rounded" />
              </div>
            </div>
          ))
        ) : filteredDatasets.length === 0 ? (
          // No results state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiAlertCircle size={32} className="text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-1">No datasets found</p>
            <p className="text-xs text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          // Dataset cards
          filteredDatasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              isActive={activeId === dataset.id}
              onSelect={onSelect}
              onDelete={onDelete}
              onDownload={onDownload}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DatasetList;
