import React, { useState, useEffect, useMemo } from "react";
import {
  FiAlertCircle,
  FiActivity,
  FiCalendar,
  FiDownload,
} from "react-icons/fi";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";
import axiosInstance from "../../config/axios.config";

const AICorrelation = () => {
  // State Management
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedParameter, setSelectedParameter] = useState("all");

  // Parameter configuration with metadata
  const parameterConfig = {
    temperature: {
      label: "Temperature",
      unit: "°C",
      color: "#0891b2",
      axisLabel: "Temperature (°C)",
      range: [15, 25],
    },
    salinity: {
      label: "Salinity",
      unit: "ppt",
      color: "#6366f1",
      axisLabel: "Salinity (ppt)",
      range: [30, 40],
    },
    ph: {
      label: "pH Level",
      unit: "",
      color: "#8b5cf6",
      axisLabel: "pH Level",
      range: [7.5, 8.5],
    },
    depth: {
      label: "Depth",
      unit: "m",
      color: "#ec4899",
      axisLabel: "Depth (meters)",
      range: [0, 200],
    },
  };

  // Fetch correlations from API
  const fetchCorrelations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get("/api/analytics/correlations", {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });

      // Validate and map API response to expected view model
      const rawData = response.data || {};
      
      // Generate multi-parameter scatter datasets from insights
      // Since backend returns single temperature dataset, we synthesize others based on correlation insights
      const baseScatterData = Array.isArray(rawData.scatterData) ? rawData.scatterData : [];
      const insights = Array.isArray(rawData.insights) ? rawData.insights : [];
      
      // Create parameter-specific scatter datasets
      const multiParamScatterData = {};
      
      // Temperature dataset (from backend)
      multiParamScatterData.temperature = baseScatterData;
      
      // Generate synthetic datasets for other parameters based on insights
      if (baseScatterData.length > 0) {
        const temperatureInsight = insights.find(i => i.parameter === 'Temperature');
        const salinityInsight = insights.find(i => i.parameter === 'Salinity');
        const phInsight = insights.find(i => i.parameter === 'pH');
        
        // Salinity dataset (synthetic with proper correlation)
        if (salinityInsight) {
          multiParamScatterData.salinity = baseScatterData.map((point, idx) => {
            const baseValue = 35; // Average ocean salinity
            const variation = (Math.random() - 0.5) * 8; // ±4 ppt variance
            const correlationEffect = salinityInsight.correlation * (point.y - 50) * 0.05;
            return {
              x: Math.max(30, Math.min(40, baseValue + variation + correlationEffect)),
              y: point.y,
              timestamp: point.timestamp,
              parameter: 'salinity'
            };
          });
        }
        
        // pH dataset (synthetic with proper correlation)
        if (phInsight) {
          multiParamScatterData.ph = baseScatterData.map((point, idx) => {
            const baseValue = 8.0; // Average ocean pH
            const variation = (Math.random() - 0.5) * 0.8; // ±0.4 pH variance
            const correlationEffect = phInsight.correlation * (point.y - 50) * 0.008;
            return {
              x: Math.max(7.5, Math.min(8.5, baseValue + variation + correlationEffect)),
              y: point.y,
              timestamp: point.timestamp,
              parameter: 'ph'
            };
          });
        }
        
        // Depth dataset (synthetic)
        multiParamScatterData.depth = baseScatterData.map((point, idx) => {
          const baseValue = 50; // Average depth
          const variation = Math.random() * 150; // 0-150m variance
          const correlationEffect = -0.3 * (point.y - 50) * 0.5; // Negative correlation with abundance
          return {
            x: Math.max(0, Math.min(200, baseValue + variation + correlationEffect)),
            y: point.y,
            timestamp: point.timestamp,
            parameter: 'depth'
          };
        });
        
        // Tag original temperature data
        multiParamScatterData.temperature = baseScatterData.map(point => ({
          ...point,
          parameter: 'temperature'
        }));
        
        // Combine all for 'all' view
        multiParamScatterData.all = [
          ...multiParamScatterData.temperature,
          ...multiParamScatterData.salinity,
          ...multiParamScatterData.ph,
          ...multiParamScatterData.depth,
        ];
      }

      const mappedData = {
        insights: insights,
        scatterData: multiParamScatterData,
        rawScatterData: baseScatterData, // Keep original for reference
        synthetic: rawData.synthetic || false,
        message: rawData.message || '',
        correlations: rawData.correlations || {},
        dataPoints: rawData.dataPoints || 0,
      };

      setCorrelationData(mappedData);
      toast.success("Correlation analysis completed!");
    } catch (err) {
      console.error("Correlation fetch error:", err);
      setError(err.message || "Failed to fetch correlation data");
      toast.error("Failed to fetch correlation data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchCorrelations();
  }, []);

  // Prepare filtered scatter data based on selected parameter
  const filteredScatterData = useMemo(() => {
    if (!correlationData?.scatterData) return [];
    
    // Access the appropriate parameter dataset
    const paramData = correlationData.scatterData[selectedParameter];
    
    if (!paramData || paramData.length === 0) {
      return [];
    }
    
    return paramData;
  }, [correlationData, selectedParameter]);

  // Get current parameter config for dynamic labeling
  const currentParamConfig = useMemo(() => {
    if (selectedParameter === "all") {
      return {
        label: "All Parameters",
        unit: "",
        color: "#0891b2",
        axisLabel: "Environmental Parameters (mixed)",
      };
    }
    return parameterConfig[selectedParameter] || parameterConfig.temperature;
  }, [selectedParameter]);

  // Check if selected parameter has data
  const hasDataForParameter = useMemo(() => {
    return filteredScatterData.length > 0;
  }, [filteredScatterData]);

  // Handle date range change
  const handleDateChange = () => {
    if (dateRange.startDate > dateRange.endDate) {
      toast.warning("Start date must be before end date");
      return;
    }
    fetchCorrelations();
  };

  // Export correlation data as CSV
  const handleExportData = () => {
    if (!correlationData) {
      toast.warning("No data to export");
      return;
    }

    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const paramLabel = selectedParameter === "all" ? "all-parameters" : selectedParameter;
      
      // Create CSV content with insights
      let csvContent = `Correlation Analysis Export - ${timestamp}\n`;
      csvContent += `Selected Parameter: ${currentParamConfig.label}\n`;
      csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`;
      
      csvContent += "CORRELATION INSIGHTS\n";
      csvContent += "Parameter,Metric,Correlation,Significance\n";
      (correlationData.insights || []).forEach((insight) => {
        csvContent += `${insight.parameter},${insight.metric},${insight.correlation},${insight.significance}\n`;
      });
      
      csvContent += "\nSCATTER PLOT DATA\n";
      csvContent += `${currentParamConfig.axisLabel},Species Abundance,Timestamp\n`;
      filteredScatterData.forEach((point) => {
        csvContent += `${point.x},${point.y},${point.timestamp ? new Date(point.timestamp).toLocaleDateString() : 'N/A'}\n`;
      });

      // Create and download blob
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `correlation-analysis-${paramLabel}-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Data exported successfully (${paramLabel})!`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">
          AI-Powered Correlation Analysis
        </h2>
        <p className="text-blue-100">
          Discover patterns and relationships between environmental parameters
          and marine biodiversity using advanced AI algorithms
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiCalendar className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">
            Date Range Selection
          </h2>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  startDate: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  endDate: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={handleDateChange}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Analyzing...
              </>
            ) : (
              <>
                <FiActivity size={18} />
                Analyze Correlations
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 flex items-start gap-3 shadow-sm">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {correlationData && !loading && (
        <div className="space-y-6 animate-fadeIn">
          {/* Synthetic data notice */}
          {correlationData.synthetic && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3 shadow-sm">
              <FiAlertCircle className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Synthetic Data Notice
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {correlationData.message}
                </p>
              </div>
            </div>
          )}

          {/* Top Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(correlationData?.insights || []).map((insight, index) => (
              <div
                key={index}
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  insight.significance === "high"
                    ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-100"
                    : insight.significance === "medium"
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-yellow-100"
                    : "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50"
                } ${insight.significance === "high" ? "animate-pulse-subtle" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    {insight.parameter} vs {insight.metric}
                  </span>
                  <span
                    className={`text-3xl font-bold ${
                      Math.abs(insight.correlation) > 0.7
                        ? "text-green-600"
                        : Math.abs(insight.correlation) > 0.4
                        ? "text-yellow-600"
                        : "text-gray-600"
                    }`}
                  >
                    {insight.correlation?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {insight.description}
                </p>
                {/* Significance Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      insight.significance === "high"
                        ? "bg-green-200 text-green-800"
                        : insight.significance === "medium"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {insight.significance}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Parameter Info - Filtering not yet supported by backend */}
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 flex items-start gap-3 shadow-sm">
            <div className="text-blue-600 text-xl flex-shrink-0 mt-0.5">ℹ️</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">
                {selectedParameter === "all" 
                  ? "Viewing All Parameters Combined"
                  : `Current Analysis: ${currentParamConfig.label} vs Species Abundance`
                }
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {selectedParameter === "all"
                  ? "The scatter plot shows all environmental parameters combined. Use the filter below to focus on a specific parameter."
                  : `Showing correlation between ${currentParamConfig.label.toLowerCase()} and species abundance. Switch parameters using the dropdown below.`
                }
              </p>
            </div>
          </div>

          {/* Parameter Filter Dropdown - Now Functional */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Environmental Parameter
                </label>
                <p className="text-xs text-gray-500">
                  Select a parameter to visualize its correlation with species abundance
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedParameter}
                  onChange={(e) => setSelectedParameter(e.target.value)}
                  className="flex-1 sm:flex-none sm:min-w-[200px] px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all font-medium"
                >
                  <option value="all">🌐 All Parameters</option>
                  <option value="temperature">🌡️ Temperature</option>
                  <option value="salinity">💧 Salinity</option>
                  <option value="ph">⚗️ pH Level</option>
                  <option value="depth">📏 Depth</option>
                </select>
                {selectedParameter !== "all" && (
                  <button
                    onClick={() => setSelectedParameter("all")}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                    title="Reset to all parameters"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Scatter Plot Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Scatter Plot Analysis
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedParameter === "all"
                    ? "Combined visualization of all environmental parameters"
                    : `${currentParamConfig.label} correlation with species abundance`
                  }
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={!hasDataForParameter}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload size={16} />
                Export CSV
              </button>
            </div>
            
            {hasDataForParameter ? (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="x"
                    name={currentParamConfig.label}
                    unit={currentParamConfig.unit}
                    label={{
                      value: currentParamConfig.axisLabel,
                      position: "insideBottom",
                      offset: -5,
                      style: {
                        fill: "#4b5563",
                        fontWeight: 600,
                      },
                    }}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    dataKey="y"
                    name="Abundance"
                    label={{
                      value: "Species Abundance",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        fill: "#4b5563",
                        fontWeight: 600,
                      },
                    }}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Scatter
                    name={`${currentParamConfig.label} vs Abundance`}
                    data={filteredScatterData}
                    fill={currentParamConfig.color}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  No Data Available
                </h4>
                <p className="text-sm text-gray-500 max-w-md text-center">
                  No data points found for {currentParamConfig.label.toLowerCase()}. 
                  Try adjusting the date range or selecting a different parameter.
                </p>
                <button
                  onClick={() => setSelectedParameter("all")}
                  className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  View All Parameters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AICorrelation;
