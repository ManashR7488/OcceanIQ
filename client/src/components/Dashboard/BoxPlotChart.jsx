import {
  ComposedChart,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

/**
 * Box plot chart for distribution comparison
 */
function BoxPlotChart({
  data = [],
  height = 400,
  title = 'Distribution Comparison'
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No distribution data available</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map((item) => ({
    field: item.field,
    // Box plot components
    boxStart: item.q1,
    boxHeight: item.q3 - item.q1,
    median: item.median,
    whiskerLow: item.min,
    whiskerHigh: item.max,
    // Store original values for tooltip
    ...item
  }));

  // Prepare outlier data for scatter
  const outliersData = data.flatMap((item) =>
    (item.outliers || []).map(outlier => ({
      field: item.field,
      value: outlier
    }))
  );

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const hasOutliers = data.outliers && data.outliers.length > 0;

      return (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            {data.field}
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">Max:</span> {data.max?.toFixed(3)}</p>
            <p><span className="font-medium">Q3 (75%):</span> {data.q3?.toFixed(3)}</p>
            <p><span className="font-medium">Median:</span> {data.median?.toFixed(3)}</p>
            <p><span className="font-medium">Q1 (25%):</span> {data.q1?.toFixed(3)}</p>
            <p><span className="font-medium">Min:</span> {data.min?.toFixed(3)}</p>
            <p className="pt-1 border-t border-gray-200">
              <span className="font-medium">IQR:</span> {data.iqr?.toFixed(3)}
            </p>
            {hasOutliers && (
              <p className="text-red-600">
                <span className="font-medium">Outliers:</span> {data.outliers.length}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-blue-500 bg-opacity-60 border-2 border-blue-700"></div>
        <span className="text-gray-600">Box (Q1-Q3)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-0.5 bg-blue-900"></div>
        <span className="text-gray-600">Median</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-500"></div>
        <span className="text-gray-600">Whiskers (Min-Max)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <span className="text-gray-600">Outliers</span>
      </div>
    </div>
  );

  // Custom box shape
  const CustomBox = (props) => {
    const { x, y, width, height, payload } = props;
    
    if (!payload || height <= 0) return null;

    const medianY = y + height * ((payload.q3 - payload.median) / (payload.q3 - payload.q1));
    const whiskerX = x + width / 2;

    return (
      <g>
        {/* Whisker line (low) */}
        <line
          x1={whiskerX}
          y1={y + height}
          x2={whiskerX}
          y2={y + height + ((payload.q1 - payload.min) / (payload.q3 - payload.q1)) * height}
          stroke="#6B7280"
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Whisker line (high) */}
        <line
          x1={whiskerX}
          y1={y}
          x2={whiskerX}
          y2={y - ((payload.max - payload.q3) / (payload.q3 - payload.q1)) * height}
          stroke="#6B7280"
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Whisker caps */}
        <line
          x1={whiskerX - width / 4}
          y1={y + height + ((payload.q1 - payload.min) / (payload.q3 - payload.q1)) * height}
          x2={whiskerX + width / 4}
          y2={y + height + ((payload.q1 - payload.min) / (payload.q3 - payload.q1)) * height}
          stroke="#6B7280"
          strokeWidth={2}
        />
        <line
          x1={whiskerX - width / 4}
          y1={y - ((payload.max - payload.q3) / (payload.q3 - payload.q1)) * height}
          x2={whiskerX + width / 4}
          y2={y - ((payload.max - payload.q3) / (payload.q3 - payload.q1)) * height}
          stroke="#6B7280"
          strokeWidth={2}
        />

        {/* Box */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#3B82F6"
          fillOpacity={0.6}
          stroke="#2563EB"
          strokeWidth={2}
        />

        {/* Median line */}
        <line
          x1={x}
          y1={medianY}
          x2={x + width}
          y2={medianY}
          stroke="#1E40AF"
          strokeWidth={3}
        />
      </g>
    );
  };

  // Count fields with outliers
  const fieldsWithOutliers = data.filter(d => d.outliers && d.outliers.length > 0).length;
  const totalOutliers = data.reduce((sum, d) => sum + (d.outliers?.length || 0), 0);

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">
          Quartile distributions and outliers for each variable
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 flex flex-wrap justify-center gap-4 text-sm">
        <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-blue-700 font-semibold">
            {data.length} Variables
          </span>
        </div>
        <div className="px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="text-yellow-700 font-semibold">
            {fieldsWithOutliers} with Outliers
          </span>
        </div>
        <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-200">
          <span className="text-red-700 font-semibold">
            {totalOutliers} Total Outliers
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis
            dataKey="field"
            angle={data.length > 5 ? -45 : 0}
            textAnchor={data.length > 5 ? 'end' : 'middle'}
            height={data.length > 5 ? 80 : 60}
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          
          <YAxis
            label={{
              value: 'Value',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 600, fill: '#374151' }
            }}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          {/* Box plot bars - transparent bar to anchor at Q1 */}
          <Bar
            dataKey="boxStart"
            stackId="box"
            fill="transparent"
          />
          <Bar
            dataKey="boxHeight"
            stackId="box"
            fill="#3B82F6"
            shape={<CustomBox />}
          />

          {/* Outliers */}
          {outliersData.length > 0 && (
            <Scatter
              data={outliersData}
              dataKey="value"
              fill="#EF4444"
              shape="circle"
              name="Outliers"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Info note */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Box Plot Guide:</span> The box represents the interquartile 
          range (IQR) containing 50% of the data. The line inside the box is the median. Whiskers extend 
          to the minimum and maximum values within 1.5×IQR. Points beyond the whiskers are outliers.
        </p>
      </div>
    </div>
  );
}

export default BoxPlotChart;
