import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';

function TimeSeriesCharts({ timeSeriesData, loading = false }) {
  // State for toggling series visibility
  const [visibleSeries, setVisibleSeries] = useState({
    occurrenceCount: true,
    speciesCount: true
  });

  // Handle legend click to toggle series
  const handleLegendClick = (dataKey) => {
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  // Custom legend component with click handlers
  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex justify-center gap-4 mb-2">
        {payload.map((entry, index) => {
          const isVisible = visibleSeries[entry.dataKey];
          return (
            <button
              key={`legend-${index}`}
              onClick={() => handleLegendClick(entry.dataKey)}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-all ${
                isVisible 
                  ? 'opacity-100' 
                  : 'opacity-40 line-through'
              } hover:bg-gray-100 cursor-pointer`}
            >
              <span
                className="w-4 h-0.5"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">{entry.value}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );

  // Empty state
  const EmptyState = ({ message = "No data available" }) => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <LoadingSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (!timeSeriesData) {
    return <EmptyState message="No time-series data available" />;
  }

  const { timeSeries, depthDistribution, seasonalPatterns, topSpecies } = timeSeriesData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Species Abundance Over Time */}
      <div 
        className="bg-white rounded-lg shadow-md p-6"
        role="img"
        aria-label="Species abundance over time showing total occurrences and unique species count"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Species Abundance Over Time
        </h3>
        {timeSeries && timeSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend content={<CustomLegend />} />
              <Brush dataKey="date" height={30} stroke="#0891B2" />
              {visibleSeries.occurrenceCount && (
                <Line 
                  type="monotone" 
                  dataKey="occurrenceCount" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  dot={false}
                  name="Total Occurrences"
                />
              )}
              {visibleSeries.speciesCount && (
                <Line 
                  type="monotone" 
                  dataKey="speciesCount" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                  name="Unique Species"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Depth Distribution */}
      <div 
        className="bg-white rounded-lg shadow-md p-6"
        role="img"
        aria-label="Depth distribution histogram showing occurrence counts by depth range"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Depth Distribution
        </h3>
        {depthDistribution && depthDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={depthDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="depthRange" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis label={{ value: 'Occurrences', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="url(#depthGradient)"
                name="Occurrence Count"
              />
              <defs>
                <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Seasonal Patterns */}
      <div 
        className="bg-white rounded-lg shadow-md p-6"
        role="img"
        aria-label="Seasonal patterns area chart showing average occurrence counts by month"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Seasonal Patterns
        </h3>
        {seasonalPatterns && seasonalPatterns.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={seasonalPatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
              />
              <YAxis label={{ value: 'Avg Occurrences', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="occurrenceCount" 
                stroke="#0891B2" 
                fill="url(#seasonalGradient)"
                name="Average Occurrences"
              />
              <defs>
                <linearGradient id="seasonalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0891B2" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Top Species */}
      <div 
        className="bg-white rounded-lg shadow-md p-6"
        role="img"
        aria-label="Top species horizontal bar chart showing the 10 most frequently observed species"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top 10 Species
        </h3>
        {topSpecies && topSpecies.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topSpecies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="scientificName" 
                type="category" 
                width={150}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="url(#speciesGradient)"
                name="Occurrence Count"
              />
              <defs>
                <linearGradient id="speciesGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default TimeSeriesCharts;
