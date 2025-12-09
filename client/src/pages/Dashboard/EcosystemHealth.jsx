import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiActivity, 
  FiDroplet, 
  FiMap, 
  FiDownload,
  FiRefreshCw 
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../config/axios.config';
import { useTimePeriod } from './Dashboard';
import { getDateRangeForAPI } from '../../utils/timePeriodHelper';
import GaugeChart from '../../components/Dashboard/GaugeChart';
import AlertCard from '../../components/Dashboard/AlertCard';
import ComparisonCard from '../../components/Dashboard/ComparisonCard';
import RegionSelector from '../../components/Dashboard/RegionSelector';
import DateRangeSelector from '../../components/Dashboard/DateRangeSelector';
import { exportToPDF, exportToCSV } from '../../utils/exportUtils';

/**
 * Ecosystem Health Monitoring Component
 * Displays comprehensive health metrics, alerts, and comparison tools
 */
function EcosystemHealth() {
  // Get time period from context
  const { timePeriod } = useTimePeriod();
  
  // State management
  const [healthData, setHealthData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(null);
  const [selectedEntities, setSelectedEntities] = useState(''); // Changed to string for selector components
  const [comparingLoading, setComparingLoading] = useState(false);

  // Fetch ecosystem health data on mount and when time period changes
  useEffect(() => {
    fetchHealthData();
  }, [timePeriod]);

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get date range from time period
      const { startDate, endDate } = getDateRangeForAPI(timePeriod);
      
      const response = await axiosInstance.get('/dashboard/ecosystem-health', {
        params: { startDate, endDate }
      });
      setHealthData(response.data);
      toast.success('Ecosystem health data loaded successfully');
    } catch (err) {
      console.error('Error fetching health data:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load ecosystem health data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!comparisonMode) {
      toast.warning('Please select a comparison type');
      return;
    }

    const validEntities = selectedEntities.split(',').map(e => e.trim()).filter(e => e);
    if (validEntities.length < 2) {
      toast.warning('Please add at least 2 entities to compare');
      return;
    }

    setComparingLoading(true);

    try {
      const response = await axiosInstance.get('/dashboard/compare', {
        params: {
          type: comparisonMode,
          entities: validEntities.join(',')
        }
      });

      setComparisonData(response.data);
      toast.success('Comparison data loaded successfully');
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load comparison data';
      toast.error(errorMsg);
    } finally {
      setComparingLoading(false);
    }
  };

  const handleExportPDF = () => {
    const success = exportToPDF(healthData, comparisonData);
    if (success) {
      toast.success('PDF report exported successfully');
    } else {
      toast.error('Failed to export PDF report');
    }
  };

  const handleExportCSV = () => {
    const success = exportToCSV(healthData, comparisonData);
    if (success) {
      toast.success('CSV data exported successfully');
    } else {
      toast.error('Failed to export CSV data');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading ecosystem health data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchHealthData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Ecosystem Health Monitoring
        </h1>
        <p className="text-gray-600">
          Comprehensive analysis of marine ecosystem health indicators, trends, and alerts
        </p>
      </div>

      {/* Overall Health Score Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Gauge Chart */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall Health Score</h2>
            <GaugeChart 
              value={healthData?.overallHealthScore || 0} 
              size={250} 
              label="Score" 
              colorScheme="health" 
            />
          </div>

          {/* Trend Information */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-3">
              {healthData?.trend === 'improving' ? (
                <FiTrendingUp className="w-8 h-8 text-green-600" />
              ) : healthData?.trend === 'declining' ? (
                <FiTrendingDown className="w-8 h-8 text-red-600" />
              ) : (
                <FiActivity className="w-8 h-8 text-gray-600" />
              )}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 capitalize">
                  {healthData?.trend || 'Stable'}
                </h3>
                <p className="text-gray-600">
                  {healthData?.trendPercentage > 0 ? '+' : ''}
                  {healthData?.trendPercentage?.toFixed(1)}% from previous period
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg font-semibold text-gray-800">
                  {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Region</p>
                <p className="text-lg font-semibold text-gray-800">
                  {healthData?.region ? `${healthData.region.latitude}°, ${healthData.region.longitude}°` : 'Global'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Species Diversity Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:-translate-y-2 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <FiActivity className="w-8 h-8 text-teal-600" />
            <span className="text-sm font-medium text-gray-500">Species Diversity</span>
          </div>
          <div className="flex justify-center mb-4">
            <GaugeChart 
              value={healthData?.metrics?.speciesDiversityIndex || 0} 
              size={180} 
              colorScheme="diversity" 
            />
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800">
              {healthData?.metrics?.speciesDiversityIndex?.toFixed(1) || 'N/A'}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Shannon Diversity Index measuring species richness
            </p>
          </div>
        </div>

        {/* Water Quality Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:-translate-y-2 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <FiDroplet className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Water Quality</span>
          </div>
          <div className="flex justify-center mb-4">
            <GaugeChart 
              value={healthData?.metrics?.waterQualityIndex || 0} 
              size={180} 
              colorScheme="quality" 
            />
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800">
              {healthData?.metrics?.waterQualityIndex?.toFixed(1) || 'N/A'}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Composite score of temperature, pH, and oxygen levels
            </p>
          </div>
        </div>

        {/* Habitat Integrity Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:-translate-y-2 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <FiMap className="w-8 h-8 text-cyan-600" />
            <span className="text-sm font-medium text-gray-500">Habitat Integrity</span>
          </div>
          <div className="flex justify-center mb-4">
            <GaugeChart 
              value={healthData?.metrics?.habitatIntegrity || 0} 
              size={180} 
              colorScheme="health" 
            />
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800">
              {healthData?.metrics?.habitatIntegrity?.toFixed(1) || 'N/A'}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Observation density and depth range coverage
            </p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Active Alerts</h2>
        
        {healthData?.alerts && healthData.alerts.length > 0 ? (
          <div className="space-y-4">
            {healthData.alerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiActivity className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No alerts - ecosystem is healthy</p>
          </div>
        )}
      </div>

      {/* Comparative Analysis Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Comparative Analysis</h2>

        {/* Comparison Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Comparison Type
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setComparisonMode('region')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                comparisonMode === 'region'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiMap className="inline mr-2" />
              Region
            </button>
            <button
              onClick={() => setComparisonMode('timeperiod')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                comparisonMode === 'timeperiod'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiActivity className="inline mr-2" />
              Time Period
            </button>
            <button
              onClick={() => setComparisonMode('species')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                comparisonMode === 'species'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiTrendingUp className="inline mr-2" />
              Species
            </button>
          </div>
        </div>

        {/* Entity Input Fields */}
        {comparisonMode && (
          <div className="mb-6">
            {comparisonMode === 'region' && (
              <RegionSelector 
                value={selectedEntities}
                onChange={setSelectedEntities}
                label="Select Regions for Comparison"
              />
            )}
            {comparisonMode === 'timeperiod' && (
              <DateRangeSelector 
                value={selectedEntities}
                onChange={setSelectedEntities}
                label="Select Time Periods for Comparison"
              />
            )}
            {comparisonMode === 'species' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Enter Species Names (comma-separated)
                </label>
                <textarea
                  value={selectedEntities}
                  onChange={(e) => setSelectedEntities(e.target.value)}
                  placeholder="e.g., Thunnus albacares, Katsuwonus pelamis, Sarda sarda"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500">
                  Enter at least 2 species names separated by commas
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compare Button */}
        {comparisonMode && (
          <button
            onClick={handleCompare}
            disabled={comparingLoading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {comparingLoading ? 'Comparing...' : 'Compare Entities'}
          </button>
        )}

        {/* Comparison Results */}
        {comparisonData && comparisonData.entities && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Comparison Results - {comparisonData.comparisonType}
            </h3>
            
            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {comparisonData.entities.map((entity, index) => (
                <ComparisonCard
                  key={index}
                  entity={entity}
                  showDifference={!entity.isBaseline}
                  difference={entity.difference || 0}
                  isBaseline={entity.isBaseline}
                />
              ))}
            </div>

            {/* Comparison Bar Chart */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                {comparisonData.comparisonType === 'species' ? 'Species Metrics Comparison' : 'Health Score Comparison'}
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData.entities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis domain={[0, comparisonData.comparisonType === 'species' ? 'auto' : 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="healthScore" fill="#0891B2" name="Health Score" />
                  {/* Additional bars for species comparison */}
                  {comparisonData.comparisonType === 'species' && (
                    <>
                      <Bar 
                        dataKey="details.abundance" 
                        fill="#10B981" 
                        name="Abundance" 
                      />
                      <Bar 
                        dataKey="details.distribution" 
                        fill="#F59E0B" 
                        name="Distribution (%)" 
                      />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Export Data</h2>
        <p className="text-gray-600 mb-6">
          Download ecosystem health report and comparison data
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportPDF}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            <FiDownload className="mr-2" />
            Export as PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <FiDownload className="mr-2" />
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default EcosystemHealth;
