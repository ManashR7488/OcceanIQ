import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

/**
 * Reusable Gauge Chart Component
 * Displays a radial progress bar with center label
 */
function GaugeChart({ 
  value = 0, 
  maxValue = 100, 
  size = 200, 
  label = '', 
  colorScheme = 'health' 
}) {
  // Normalize value to 0-100 range
  const normalizedValue = Math.min(Math.max((value / maxValue) * 100, 0), 100);

  // Determine color based on scheme and value
  const getColor = () => {
    if (colorScheme === 'health') {
      if (normalizedValue >= 71) return '#10B981'; // green
      if (normalizedValue >= 41) return '#F59E0B'; // yellow
      return '#EF4444'; // red
    } else if (colorScheme === 'quality') {
      // Blue gradient
      return normalizedValue >= 50 ? '#2563EB' : '#0891B2';
    } else if (colorScheme === 'diversity') {
      // Teal gradient
      return normalizedValue >= 50 ? '#14B8A6' : '#0D9488';
    }
    return '#3B82F6'; // default blue
  };

  const color = getColor();

  // Data for the radial bar chart
  const data = [
    {
      value: normalizedValue,
      fill: color
    }
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: '#E5E7EB' }}
            dataKey="value"
            cornerRadius={10}
            animationDuration={1000}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold" style={{ color }}>
          {Math.round(value)}
        </div>
        {label && (
          <div className="text-xs text-gray-500 mt-1 text-center px-2">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

export default GaugeChart;
