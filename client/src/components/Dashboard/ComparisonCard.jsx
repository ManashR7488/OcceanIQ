import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import GaugeChart from './GaugeChart';

/**
 * Reusable Comparison Card Component
 * Displays entity metrics for side-by-side comparison
 */
function ComparisonCard({ entity, showDifference = false, difference = 0, isBaseline = false }) {
  // Determine trend icon
  const getTrendIcon = () => {
    if (entity.trend === 'improving') return <FiTrendingUp className="w-4 h-4 text-green-600" />;
    if (entity.trend === 'declining') return <FiTrendingDown className="w-4 h-4 text-red-600" />;
    return <FiMinus className="w-4 h-4 text-gray-600" />;
  };

  // Determine difference color
  const getDifferenceColor = () => {
    if (difference > 0) return 'text-green-600';
    if (difference < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Determine health score color
  const getHealthScoreColor = (score) => {
    if (score >= 71) return 'text-green-600';
    if (score >= 41) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-6 transition-all duration-200 hover:shadow-lg ${
        isBaseline ? 'border-2 border-blue-500' : 'border border-gray-200'
      }`}
    >
      {/* Card Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{entity.name}</h3>
          {isBaseline && (
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              Baseline
            </span>
          )}
        </div>
      </div>

      {/* Health Score Display */}
      <div className="flex items-center justify-center mb-6">
        <GaugeChart 
          value={entity.healthScore} 
          size={150} 
          label="Health Score" 
          colorScheme="health" 
        />
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        {getTrendIcon()}
        <span className="text-sm font-medium text-gray-700 capitalize">
          {entity.trend}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-3 mb-4">
        {entity.metrics && Object.entries(entity.metrics).map(([key, value]) => {
          // Format metric name
          const metricName = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();

          // Safely calculate bar width: clamp to [0, 100] and handle non-numeric values
          const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
          const barWidth = Math.max(0, Math.min(100, numericValue));

          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{metricName}</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                  {typeof value === 'number' && !isNaN(value) ? value.toFixed(1) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Section */}
      {entity.details && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(entity.details).map(([key, value]) => {
              const detailName = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();

              // Special formatting for abundance and distribution
              let displayValue = value;
              if (key === 'abundance' || key === 'observationCount') {
                displayValue = typeof value === 'number' ? value.toLocaleString() : value;
              } else if (key === 'distribution') {
                displayValue = typeof value === 'number' ? `${value}%` : value;
              } else if (typeof value === 'number' && value > 100) {
                displayValue = value.toLocaleString();
              } else if (typeof value === 'number') {
                displayValue = value.toFixed(1);
              }

              return (
                <div key={key}>
                  <div className="text-gray-500">{detailName}</div>
                  <div className="font-semibold text-gray-800">{displayValue}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Difference Indicator */}
      {showDifference && !isBaseline && (
        <div className={`mt-4 pt-4 border-t border-gray-200 text-center ${getDifferenceColor()}`}>
          <div className="flex items-center justify-center space-x-2">
            {difference > 0 ? (
              <FiTrendingUp className="w-5 h-5" />
            ) : difference < 0 ? (
              <FiTrendingDown className="w-5 h-5" />
            ) : (
              <FiMinus className="w-5 h-5" />
            )}
            <span className="text-lg font-bold">
              {difference > 0 ? '+' : ''}{difference.toFixed(1)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.abs(entity.differencePercentage || 0).toFixed(1)}% vs baseline
          </div>
        </div>
      )}
    </div>
  );
}

export default ComparisonCard;
