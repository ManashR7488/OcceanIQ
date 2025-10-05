import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Bubble chart for multi-variable analysis
 */
function BubbleChart({
  data = [],
  xField = 'X',
  yField = 'Y',
  zField = 'Size',
  colorField = null,
  height = 500,
  title = 'Bubble Chart'
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No data available for bubble chart</p>
      </div>
    );
  }

  // Get z value range for legend
  const zValues = data.map(d => d.z);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const zRange = maxZ - minZ || 1;

  // Use raw data without pre-scaling (ZAxis will handle it)
  const chartData = data;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-lg">
          {data.label && (
            <p className="text-sm font-semibold text-gray-800 mb-2">
              {data.label}
            </p>
          )}
          <div className="text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">{xField}:</span> {data.x?.toFixed(3)}</p>
            <p><span className="font-medium">{yField}:</span> {data.y?.toFixed(3)}</p>
            <p><span className="font-medium">{zField}:</span> {data.z?.toFixed(3)}</p>
            {colorField && data.color !== undefined && (
              <p><span className="font-medium">{colorField}:</span> {data.color}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = () => {
    const sampleSizes = [
      { label: 'Small', value: minZ },
      { label: 'Medium', value: (minZ + maxZ) / 2 },
      { label: 'Large', value: maxZ }
    ];

    return (
      <div className="flex flex-col items-center space-y-3 mt-4">
        <p className="text-sm font-semibold text-gray-700">
          Bubble Size: {zField}
        </p>
        <div className="flex items-end space-x-6">
          {sampleSizes.map((sample, index) => {
            // Match ZAxis range [60, 160] scaling
            const normalizedSize = (sample.value - minZ) / zRange;
            const radius = 60 + (normalizedSize * 100);
            
            return (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div
                  className="rounded-full bg-cyan-500 bg-opacity-60 border-2 border-cyan-600"
                  style={{
                    width: `${radius / 5}px`,
                    height: `${radius / 5}px`
                  }}
                ></div>
                <span className="text-xs text-gray-600">{sample.label}</span>
                <span className="text-xs text-gray-500">
                  {sample.value.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">
          Three-variable relationship: {xField} (X) vs {yField} (Y) sized by {zField}
        </p>
      </div>

      {/* Info note */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">How to read:</span> Position shows the relationship 
          between {xField} and {yField}, while bubble size represents {zField} values. 
          Larger bubbles indicate higher {zField} values.
        </p>
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
          
          <ZAxis
            type="number"
            dataKey="z"
            range={[60, 160]}
            name={zField}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          {/* Bubble scatter */}
          <Scatter
            data={chartData}
            fill="#06B6D4"
            fillOpacity={0.6}
            stroke="#0891B2"
            strokeWidth={2}
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-1">Data Points</p>
            <p className="text-xl font-bold text-gray-800">{data.length}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-1">{zField} Range</p>
            <p className="text-xl font-bold text-gray-800">
              {minZ.toFixed(2)} - {maxZ.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-1">Average {zField}</p>
            <p className="text-xl font-bold text-gray-800">
              {(zValues.reduce((a, b) => a + b, 0) / zValues.length).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BubbleChart;
