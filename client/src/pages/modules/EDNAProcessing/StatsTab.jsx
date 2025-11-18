import { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiActivity,
  FiDatabase,
  FiPieChart,
} from 'react-icons/fi';
import axios from '../../../config/axios.config';
import { toast } from 'react-toastify';

const StatsTab = ({ refreshTrigger }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/edna/stats');

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Samples */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FiDatabase className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{stats.totalSamples}</span>
          </div>
          <p className="text-blue-100 text-sm font-medium">Total Samples</p>
        </div>

        {/* Completed Samples */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FiActivity className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">
              {stats.samplesByStatus?.completed || 0}
            </span>
          </div>
          <p className="text-green-100 text-sm font-medium">Completed Analysis</p>
        </div>

        {/* Unique Species */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FiPieChart className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{stats.totalUniqueSpecies}</span>
          </div>
          <p className="text-purple-100 text-sm font-medium">Unique Species</p>
        </div>

        {/* Avg Species/Sample */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FiTrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">
              {stats.biodiversityMetrics?.avgSpeciesCount?.toFixed(1) || 0}
            </span>
          </div>
          <p className="text-orange-100 text-sm font-medium">Avg Species/Sample</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Samples by Status
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.samplesByStatus?.pending || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Pending</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {stats.samplesByStatus?.processing || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Processing</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {stats.samplesByStatus?.completed || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {stats.samplesByStatus?.failed || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Failed</p>
          </div>
        </div>
      </div>

      {/* Top Species */}
      {stats.topSpecies && stats.topSpecies.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 Detected Species
          </h3>
          
          <div className="space-y-3">
            {stats.topSpecies.map((species, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {species.scientificName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Total Reads</p>
                    <p className="font-medium text-gray-900">{species.totalReads}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Avg Confidence</p>
                    <p className="font-medium text-green-600">
                      {species.averageConfidence}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biodiversity Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Average Biodiversity Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-3xl font-bold text-green-600 mb-2">
              {stats.biodiversityMetrics?.avgSpeciesCount?.toFixed(1) || 0}
            </p>
            <p className="text-sm font-medium text-gray-700">
              Average Species Count
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Per sample analysis
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {stats.biodiversityMetrics?.avgShannonIndex?.toFixed(2) || 0}
            </p>
            <p className="text-sm font-medium text-gray-700">
              Shannon Diversity Index
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Species richness & evenness
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {stats.biodiversityMetrics?.avgSimpsonIndex?.toFixed(2) || 0}
            </p>
            <p className="text-sm font-medium text-gray-700">
              Simpson Diversity Index
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Dominance & diversity
            </p>
          </div>
        </div>
      </div>

      {/* Samples by Gene */}
      {stats.samplesByGene && Object.keys(stats.samplesByGene).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Samples by Target Gene
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.samplesByGene).map(([gene, count]) => (
              <div
                key={gene}
                className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg"
              >
                <p className="text-2xl font-bold text-indigo-600">{count}</p>
                <p className="text-sm font-medium text-gray-700 mt-1">{gene}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {stats.timeline && stats.timeline.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sample Upload Timeline
          </h3>
          
          <div className="space-y-2">
            {stats.timeline.map((point, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700">
                  {point.date}
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${point.count * 20}px` }} />
                  <span className="text-sm font-bold text-blue-600 w-8 text-right">
                    {point.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsTab;
