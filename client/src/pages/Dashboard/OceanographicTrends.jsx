import React, { useState, useEffect } from 'react';
import axiosInstance from '../../config/axios.config';
import { toast } from 'react-toastify';
import { FiUsers, FiDatabase, FiActivity, FiTrendingUp } from 'react-icons/fi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function OceanographicTrends() {
  const [stats, setStats] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Recent observations state
  const [observations, setObservations] = useState([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalObservations: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch observations when page changes
  useEffect(() => {
    fetchRecentObservations(currentPage);
  }, [currentPage]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Make parallel API calls
      const [statsResponse, trendsResponse] = await Promise.all([
        axiosInstance.get('/dashboard/stats'),
        axiosInstance.get('/dashboard/oceanographic-trends')
      ]);

      setStats(statsResponse.data);
      
      // Transform trends data for Recharts format
      const transformedData = transformTrendsData(trendsResponse.data);
      setTrendsData(transformedData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent observations with pagination
  const fetchRecentObservations = async (page = 1) => {
    setObservationsLoading(true);

    try {
      const response = await axiosInstance.get('/dashboard/recent-observations', {
        params: {
          page: page,
          limit: 10,
          sortBy: 'observedDate',
          order: 'desc'
        }
      });

      setObservations(response.data.observations);
      setPagination(response.data.pagination);

    } catch (err) {
      console.error('Error fetching recent observations:', err);
      toast.error('Failed to load recent observations');
    } finally {
      setObservationsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Transform backend data into Recharts format
  const transformTrendsData = (data) => {
    const { timestamps, temperature, salinity, ph, dissolvedOxygen } = data;
    
    return timestamps.map((timestamp, index) => ({
      timestamp: timestamp,
      rawTimestamp: timestamp,
      temperature: temperature[index],
      salinity: salinity[index],
      ph: ph[index],
      dissolvedOxygen: dissolvedOxygen[index]
    }));
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit'
    });
  };

  // Format timestamp for X-axis ticks (shorter version)
  const formatTickTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Oceanographic Trends
        </h1>
        <p className="text-gray-600">Real-time oceanographic insights and statistics</p>
      </div>

      {/* Statistics Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Species Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl">
              <FiActivity className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats?.totalSpecies?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Species</p>
          </div>
        </div>

        {/* Total Observations Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
              <FiDatabase className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats?.totalObservations?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Observations Recorded</p>
          </div>
        </div>

        {/* Data Sources Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl">
              <FiTrendingUp className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats?.dataSources}
            </p>
            <p className="text-sm text-gray-600">Integrated Data Sources</p>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
              <FiUsers className="text-white" size={24} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats?.totalUsers?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Users</p>
          </div>
        </div>
      </div>

      {/* Oceanographic Trends Charts Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Real-time Oceanographic Trends
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sea Surface Temperature Chart */}
          <div className="bg-white rounded-lg shadow-md p-6" role="img" aria-label="Sea surface temperature trend chart showing temperature changes in degrees Celsius over the past 7 days">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sea Surface Temperature (°C)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                  tickFormatter={formatTickTimestamp}
                />
                <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#0891B2" 
                  strokeWidth={2}
                  dot={false}
                  name="Temperature"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Salinity Chart */}
          <div className="bg-white rounded-lg shadow-md p-6" role="img" aria-label="Salinity trend chart showing salinity levels in practical salinity units over the past 7 days">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Salinity (PSU)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                  tickFormatter={formatTickTimestamp}
                />
                <YAxis label={{ value: 'Salinity (PSU)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="salinity" 
                  stroke="#2563EB" 
                  fill="#2563EB"
                  fillOpacity={0.3}
                  name="Salinity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* pH Levels Chart */}
          <div className="bg-white rounded-lg shadow-md p-6" role="img" aria-label="pH levels trend chart showing ocean pH measurements over the past 7 days">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              pH Levels
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                  tickFormatter={formatTickTimestamp}
                />
                <YAxis 
                  label={{ value: 'pH', angle: -90, position: 'insideLeft' }}
                  domain={[7.8, 8.3]}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ph" 
                  stroke="#0D9488" 
                  strokeWidth={2}
                  dot={false}
                  name="pH Level"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dissolved Oxygen Chart */}
          <div className="bg-white rounded-lg shadow-md p-6" role="img" aria-label="Dissolved oxygen trend chart showing oxygen levels in milligrams per liter over the past 7 days">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Dissolved Oxygen (mg/L)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                  tickFormatter={formatTickTimestamp}
                />
                <YAxis label={{ value: 'DO (mg/L)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="dissolvedOxygen" 
                  stroke="#7C3AED" 
                  fill="#7C3AED"
                  fillOpacity={0.3}
                  name="Dissolved Oxygen"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Observations Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <FiDatabase className="text-2xl text-blue-600" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Recent Observations
              </h2>
            </div>

            {observationsLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : observations.length === 0 ? (
              // Empty state
              <div className="text-center py-12">
                <FiDatabase className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No observations found</p>
                <p className="text-gray-400 text-sm mt-2">Check back later for new data</p>
              </div>
            ) : (
              <>
                {/* Responsive table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Species
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Depth
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Observed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institution/Observer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {observations.map((obs, index) => (
                        <tr 
                          key={obs.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {obs.species.scientificName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {obs.species.commonName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {obs.location.latitude.toFixed(4)}°, {obs.location.longitude.toFixed(4)}°
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {obs.depth !== 'N/A' ? `${obs.depth} ${obs.depthUnit}` : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(obs.observedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {obs.institution}
                            </div>
                            <div className="text-sm text-gray-500">
                              {obs.observer}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                    <span className="text-gray-400">•</span>
                    <p className="text-sm text-gray-700">
                      Total: <span className="font-medium">{pagination.totalObservations}</span> observations
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        pagination.hasPrevPage
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      aria-label="Previous page"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        pagination.hasNextPage
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OceanographicTrends;
