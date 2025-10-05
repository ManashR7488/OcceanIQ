import React, { useState, useEffect } from 'react';
import axiosInstance from '../../config/axios.config';
import { toast } from 'react-toastify';
import { FiCalendar, FiMap } from 'react-icons/fi';
import BiodiversityMap from '../../components/Dashboard/BiodiversityMap';
import TemporalControls from '../../components/Dashboard/TemporalControls';
import TimeSeriesCharts from '../../components/Dashboard/TimeSeriesCharts';

function BiodiversityAnalysis() {
  // Biodiversity visualization state
  const [biodiversityFilters, setBiodiversityFilters] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      precision: 4,
      interval: 'month',
      scientificName: ''
    };
  });
  const [gridData, setGridData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [biodiversityLoading, setBiodiversityLoading] = useState(false);
  const [biodiversityError, setBiodiversityError] = useState(null);

  // Load initial data on mount
  useEffect(() => {
    handleApplyFilters();
  }, []);

  // Fetch biodiversity heatmap data
  const fetchBiodiversityHeatmap = async () => {
    try {
      const params = {
        precision: biodiversityFilters.precision,
        startdate: biodiversityFilters.startDate,
        enddate: biodiversityFilters.endDate
      };

      if (biodiversityFilters.scientificName) {
        params.scientificname = biodiversityFilters.scientificName;
      }

      const response = await axiosInstance.get('/dashboard/biodiversity-heatmap', { params });
      
      setGridData(response.data);
      
      if (response.data?.features) {
        toast.success(`Loaded ${response.data.features.length} grid cells`);
      }
    } catch (err) {
      console.error('Error fetching biodiversity heatmap:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch biodiversity heatmap';
      setBiodiversityError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Fetch time-series data
  const fetchTimeSeriesData = async () => {
    try {
      const params = {
        startdate: biodiversityFilters.startDate,
        enddate: biodiversityFilters.endDate,
        interval: biodiversityFilters.interval
      };

      if (biodiversityFilters.scientificName) {
        params.scientificname = biodiversityFilters.scientificName;
      }

      const response = await axiosInstance.get('/dashboard/time-series', { params });
      
      setTimeSeriesData(response.data);
      toast.success('Time-series data loaded successfully');
    } catch (err) {
      console.error('Error fetching time-series data:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch time-series data';
      setBiodiversityError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Handle filter changes
  const handleBiodiversityFilterChange = (field, value) => {
    setBiodiversityFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply filters and fetch data
  const handleApplyFilters = async () => {
    // Validate date range
    if (biodiversityFilters.startDate && biodiversityFilters.endDate) {
      const start = new Date(biodiversityFilters.startDate);
      const end = new Date(biodiversityFilters.endDate);
      
      if (start > end) {
        toast.error('End date must be after start date');
        return;
      }
    }

    setBiodiversityLoading(true);
    setBiodiversityError(null);

    try {
      // Fetch both datasets in parallel
      await Promise.all([
        fetchBiodiversityHeatmap(),
        fetchTimeSeriesData()
      ]);
    } catch (err) {
      console.error('Error applying biodiversity filters:', err);
    } finally {
      setBiodiversityLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Biodiversity Distribution & Temporal Analysis
        </h1>
        <p className="text-gray-600">
          Explore species distribution patterns and trends over time
        </p>
      </div>

      {/* Error Alert */}
      {biodiversityError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start justify-between">
          <div>
            <p className="text-red-800 font-medium">Error loading biodiversity data</p>
            <p className="text-red-600 text-sm mt-1">{biodiversityError}</p>
          </div>
          <button
            onClick={handleApplyFilters}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Layout: Filters + Map & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Temporal Controls */}
        <div className="lg:col-span-1">
          <TemporalControls
            filters={biodiversityFilters}
            onFilterChange={handleBiodiversityFilterChange}
            onApply={handleApplyFilters}
            loading={biodiversityLoading}
            enablePlayback={false}
          />
        </div>

        {/* Right Column: Map and Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biodiversity Heatmap Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiMap className="text-cyan-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Geographic Distribution Heatmap
                </h3>
                <p className="text-sm text-gray-600">
                  Species occurrence density by region
                </p>
              </div>
            </div>

            <BiodiversityMap
              gridData={gridData}
              loading={biodiversityLoading}
              height="500px"
              filters={biodiversityFilters}
            />
          </div>

          {/* Time-Series Charts Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="text-blue-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Temporal Trends & Patterns
                </h3>
                <p className="text-sm text-gray-600">
                  Analyze species abundance and distribution over time
                </p>
              </div>
            </div>

            <TimeSeriesCharts
              timeSeriesData={timeSeriesData}
              loading={biodiversityLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BiodiversityAnalysis;
