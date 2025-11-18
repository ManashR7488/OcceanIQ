import { useState, useEffect } from 'react';
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiActivity,
  FiClock,
  FiTrash2,
  FiEye,
} from 'react-icons/fi';
import axios from '../../../config/axios.config';
import { toast } from 'react-toastify';

const GalleryTab = ({ refreshTrigger, onSelectSample }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSamples: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    targetGene: '',
    searchTerm: '',
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const fetchSamples = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9,
        ...(filters.status && { status: filters.status }),
        ...(filters.targetGene && { targetGene: filters.targetGene }),
      };

      const response = await axios.get('/edna/samples', { params });

      if (response.data.success) {
        let filteredSamples = response.data.data;

        // Apply client-side search filter
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filteredSamples = filteredSamples.filter(
            (sample) =>
              sample.sampleId.toLowerCase().includes(term) ||
              sample.sampleMetadata.location.name.toLowerCase().includes(term)
          );
        }

        setSamples(filteredSamples);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching samples:', error);
      toast.error('Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [filters, refreshTrigger]);

  const handlePageChange = (newPage) => {
    fetchSamples(newPage);
  };

  const handleDelete = async (sampleId) => {
    if (!window.confirm('Are you sure you want to delete this sample? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/edna/samples/${sampleId}`);
      
      if (response.data.success) {
        toast.success('Sample deleted successfully');
        fetchSamples(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error deleting sample:', error);
      toast.error(error.response?.data?.message || 'Failed to delete sample');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Sample ID or Location..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        {/* Target Gene Filter */}
        <select
          value={filters.targetGene}
          onChange={(e) => handleFilterChange('targetGene', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Genes</option>
          <option value="COI">COI</option>
          <option value="16S">16S rRNA</option>
          <option value="12S">12S rRNA</option>
          <option value="18S">18S rRNA</option>
          <option value="ITS">ITS</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : samples.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <FiActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No samples found</h3>
          <p className="text-gray-500">Upload your first eDNA sample to get started</p>
        </div>
      ) : (
        <>
          {/* Samples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {samples.map((sample) => (
              <div
                key={sample.sampleId}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold truncate">
                      {sample.sampleId}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        statusColors[sample.analysisStatus]
                      }`}
                    >
                      {sample.analysisStatus}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <FiMapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sample.sampleMetadata.location.name}
                      </p>
                    </div>
                  </div>

                  {/* Collection Date */}
                  <div className="flex items-start gap-2">
                    <FiCalendar className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Collection Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(sample.sampleMetadata.collectionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Target Gene & Sequences */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Target Gene</p>
                      <p className="text-sm font-medium text-blue-600">
                        {sample.pcrWorkflow.targetGene}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Sequences</p>
                      <p className="text-sm font-medium text-gray-900">
                        {sample.sequenceCount}
                      </p>
                    </div>
                  </div>

                  {/* Species Detected (if completed) */}
                  {sample.analysisStatus === 'completed' && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 mb-1">Species Detected</p>
                      <p className="text-lg font-bold text-green-600">
                        {sample.biodiversityMetrics?.totalSpecies || 0}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FiClock className="w-3 h-3" />
                    {new Date(sample.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSample && onSelectSample(sample)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sample.sampleId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Sample"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GalleryTab;
