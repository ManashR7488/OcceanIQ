import { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { interpretCorrelation } from '../../utils/correlationUtils';

/**
 * Scatter plot chart with regression line
 */
function ScatterPlotChart({
  data = [],
  xField = 'X',
  yField = 'Y',
  regressionData = null,
  pearsonR = null,
  spearmanRho = null,
  showRegression: initialShowRegression = true,
  title = 'Scatter Plot',
  height = 400
}) {
  const [showRegression, setShowRegression] = useState(initialShowRegression);

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No data available</p>
      </div>
    );
  }

  // Prepare regression line data
  let regressionLineData = [];
  if (showRegression && regressionData && regressionData.predictedY) {
    regressionLineData = data.map((point, index) => ({
      x: point.x,
      y: regressionData.predictedY[index]
    }));
  }

  // Calculate correlation coefficient (r)
  const correlation = regressionData?.rSquared 
    ? Math.sqrt(regressionData.rSquared) * (regressionData.slope >= 0 ? 1 : -1)
    : 0;

  const correlationStrength = interpretCorrelation(correlation);

  // Get color for correlation strength
  const getCorrelationColor = (r) => {
    const abs = Math.abs(r);
    if (abs >= 0.7) return 'text-green-600';
    if (abs >= 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {data.label || 'Data Point'}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">{xField}:</span> {data.x?.toFixed(3)}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">{yField}:</span> {data.y?.toFixed(3)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = () => (
    <div className="flex flex-col items-center space-y-2 mt-4 text-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Data Points</span>
        </div>
        {showRegression && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-red-500"></div>
            <span className="text-gray-600">Regression Line</span>
          </div>
        )}
      </div>
      {regressionData && (
        <div className="flex items-center space-x-4 text-xs">
          {pearsonR !== null && pearsonR !== undefined && typeof pearsonR === 'number' && !isNaN(pearsonR) && (
            <span className={`font-semibold ${getCorrelationColor(pearsonR)}`}>
              Pearson r = {pearsonR.toFixed(3)}
            </span>
          )}
          {spearmanRho !== null && spearmanRho !== undefined && typeof spearmanRho === 'number' && !isNaN(spearmanRho) && (
            <span className={`font-semibold ${getCorrelationColor(spearmanRho)}`}>
              Spearman ρ = {spearmanRho.toFixed(3)}
            </span>
          )}
          <span className="text-gray-600">
            R² = {regressionData.rSquared.toFixed(3)}
          </span>
          <span className="text-gray-500">
            {correlationStrength}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {xField} vs {yField}
          </p>
        </div>

        {/* Controls */}
        {regressionData && (
          <button
            onClick={() => setShowRegression(!showRegression)}
            className="flex items-center space-x-2 px-4 py-2 rounded-md 
                     bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {showRegression ? (
              <>
                <FiEyeOff className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Hide Regression
                </span>
              </>
            ) : (
              <>
                <FiEye className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Show Regression
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis
            type="number"
            dataKey="x"
            name={xField}
            domain={['dataMin - 5%', 'dataMax + 5%']}
            label={{
              value: xField,
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fontWeight: 600, fill: '#374151' }
            }}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          
          <YAxis
            type="number"
            dataKey="y"
            name={yField}
            domain={['dataMin - 5%', 'dataMax + 5%']}
            label={{
              value: yField,
              angle: -90,
              position: 'insideLeft',
              offset: -10,
              style: { fontSize: 14, fontWeight: 600, fill: '#374151' }
            }}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend content={<CustomLegend />} />

          {/* Scatter points */}
          <Scatter
            data={data}
            fill="#3B82F6"
            shape="circle"
            name="Data Points"
          />

          {/* Regression line */}
          {showRegression && regressionLineData.length > 0 && (
            <Line
              data={regressionLineData}
              type="monotone"
              dataKey="y"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Regression Line"
              isAnimationActive={false}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Regression equation */}
      {showRegression && regressionData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            <span className="font-mono">
              {yField} = {regressionData.slope.toFixed(4)} × {xField} 
              {regressionData.intercept >= 0 ? ' + ' : ' - '}
              {Math.abs(regressionData.intercept).toFixed(4)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default ScatterPlotChart;
