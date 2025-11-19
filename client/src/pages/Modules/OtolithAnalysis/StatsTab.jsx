import React, { useState, useEffect } from "react";
import { FiRefreshCw } from "react-icons/fi";
import axiosInstance from "../../../config/axios.config";
import { toast } from "react-toastify";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const StatsTab = ({ refreshTrigger }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/otolith/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Fetch stats error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Failed to load statistics</p>
      </div>
    );
  }

  // Status breakdown data
  const statusData = [
    { name: "Analyzed", value: stats.analyzedSamples, color: "#10b981" },
    { name: "Pending", value: stats.pendingSamples, color: "#f59e0b" },
    { name: "Failed", value: stats.failedSamples, color: "#ef4444" },
  ];

  // Species distribution (top 5)
  const speciesData = stats.speciesDistribution.slice(0, 5);

  // Confidence distribution (ranges now come from API)
  const confidenceData = stats.confidenceDistribution;

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-gray-700 font-medium"
        >
          <FiRefreshCw />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Samples */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">
            Total Samples
          </h3>
          <p className="text-4xl font-bold">{stats.totalSamples}</p>
          <p className="text-sm mt-2 opacity-75">All uploaded otoliths</p>
        </div>

        {/* Analyzed Samples */}
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">
            Analyzed Samples
          </h3>
          <p className="text-4xl font-bold">{stats.analyzedSamples}</p>
          <p className="text-sm mt-2 opacity-75">
            {stats.totalSamples > 0
              ? Math.round((stats.analyzedSamples / stats.totalSamples) * 100)
              : 0}
            % of total
          </p>
        </div>

        {/* Pending Analysis */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">
            Pending Analysis
          </h3>
          <p className="text-4xl font-bold">{stats.pendingSamples}</p>
          <p className="text-sm mt-2 opacity-75">Awaiting processing</p>
        </div>

        {/* Average Confidence */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-semibold mb-2 opacity-90">
            Avg Confidence
          </h3>
          <p className="text-4xl font-bold">
            {stats.avgConfidence.toFixed(1)}%
          </p>
          <p className="text-sm mt-2 opacity-75">Species identification</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Status Breakdown
          </h4>
          {statusData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Species Distribution Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Species Distribution (Top 5)
          </h4>
          {speciesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={speciesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No analyzed samples yet
            </div>
          )}
        </div>

        {/* Upload Timeline Area Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Upload Timeline (Last 30 Days)
          </h4>
          {stats.uploadTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.uploadTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0891b2"
                  fill="#0891b2"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No uploads in the last 30 days
            </div>
          )}
        </div>

        {/* Confidence Distribution Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Confidence Distribution
          </h4>
          {confidenceData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No analyzed samples yet
            </div>
          )}
        </div>
      </div>

      {/* Average Morphometrics (if available) */}
      {stats.avgMorphometrics && Object.keys(stats.avgMorphometrics).length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Average Morphometric Measurements
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.avgMorphometrics.avgLength && (
              <div className="bg-cyan-50 rounded-lg p-4 text-center">
                <span className="text-sm text-gray-600 block mb-1">
                  Avg Length
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgMorphometrics.avgLength.toFixed(2)} mm
                </span>
              </div>
            )}
            {stats.avgMorphometrics.avgWidth && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <span className="text-sm text-gray-600 block mb-1">
                  Avg Width
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgMorphometrics.avgWidth.toFixed(2)} mm
                </span>
              </div>
            )}
            {stats.avgMorphometrics.avgArea && (
              <div className="bg-teal-50 rounded-lg p-4 text-center">
                <span className="text-sm text-gray-600 block mb-1">
                  Avg Area
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgMorphometrics.avgArea.toFixed(2)} mm²
                </span>
              </div>
            )}
            {stats.avgMorphometrics.avgPerimeter && (
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <span className="text-sm text-gray-600 block mb-1">
                  Avg Perimeter
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgMorphometrics.avgPerimeter.toFixed(2)} mm
                </span>
              </div>
            )}
            {stats.avgMorphometrics.avgCircularity && (
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <span className="text-sm text-gray-600 block mb-1">
                  Avg Circularity
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgMorphometrics.avgCircularity.toFixed(3)}
                </span>
              </div>
            )}
            {stats.avgMorphometrics.avgAspectRatio && (
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <span className="text-sm text-gray-600 block mb-1">
                  Avg Aspect Ratio
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.avgMorphometrics.avgAspectRatio.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.uniqueSpecies}
            </p>
            <p className="text-sm text-gray-600">Unique Species Identified</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.recentUploads}
            </p>
            <p className="text-sm text-gray-600">Uploads (Last 7 Days)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.failedSamples}
            </p>
            <p className="text-sm text-gray-600">Failed Analyses</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
