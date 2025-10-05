import { useState } from 'react';
import { getCorrelationColor, interpretCorrelation } from '../../utils/correlationUtils';

/**
 * Correlation matrix heatmap chart
 */
function CorrelationMatrixChart({
  correlationMatrix = [],
  fieldNames = [],
  height = 500
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!correlationMatrix || correlationMatrix.length === 0 || !fieldNames || fieldNames.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No correlation data available</p>
      </div>
    );
  }

  const n = fieldNames.length;

  // Get cell size based on number of fields
  const getCellSize = () => {
    if (n <= 5) return 100;
    if (n <= 8) return 80;
    return 60;
  };

  const cellSize = getCellSize();

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Correlation Matrix</h3>
        <p className="text-sm text-gray-600">
          Pairwise correlations between selected variables
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-600 mb-2">Correlation Strength</p>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">-1.0</span>
            <div className="flex h-4 rounded-full overflow-hidden" style={{ width: '200px' }}>
              <div className="flex-1" style={{ backgroundColor: '#DC2626' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#FCA5A5' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#E5E7EB' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#93C5FD' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#1E40AF' }}></div>
            </div>
            <span className="text-xs text-gray-500">+1.0</span>
          </div>
          <div className="flex justify-between w-full mt-1 text-xs text-gray-500">
            <span>Strong Negative</span>
            <span>None</span>
            <span>Strong Positive</span>
          </div>
        </div>
      </div>

      {/* Matrix Container */}
      <div className="overflow-auto max-w-full" style={{ maxHeight: `${height}px` }}>
        <div className="inline-block min-w-full">
          {/* Matrix Grid */}
          <div className="relative">
            {/* Column Headers */}
            <div className="flex" style={{ marginLeft: `${cellSize}px` }}>
              {fieldNames.map((field, colIndex) => (
                <div
                  key={`header-col-${colIndex}`}
                  className="flex items-end justify-center pb-2"
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                >
                  <div
                    className="text-xs font-semibold text-gray-700 origin-bottom-left transform -rotate-45"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {field}
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {fieldNames.map((rowField, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex">
                {/* Row Header */}
                <div
                  className="flex items-center justify-end pr-2"
                  style={{ width: `${cellSize}px`, minWidth: `${cellSize}px` }}
                >
                  <div className="text-xs font-semibold text-gray-700 truncate">
                    {rowField}
                  </div>
                </div>

                {/* Matrix Cells */}
                {fieldNames.map((colField, colIndex) => {
                  const correlation = correlationMatrix[rowIndex]?.[colIndex] ?? 0;
                  const isDiagonal = rowIndex === colIndex;
                  const bgColor = getCorrelationColor(correlation);

                  return (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="relative border border-gray-300 flex items-center justify-center 
                               transition-all duration-200 cursor-pointer"
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: bgColor,
                        transform: hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex
                          ? 'scale(1.05)'
                          : 'scale(1)',
                        zIndex: hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex ? 10 : 1
                      }}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                      role="cell"
                      aria-label={`${rowField} vs ${colField}: ${correlation.toFixed(3)}`}
                    >
                      <div
                        className={`text-xs ${
                          isDiagonal
                            ? 'font-bold text-gray-800'
                            : Math.abs(correlation) >= 0.7
                            ? 'font-bold text-gray-900'
                            : 'text-gray-700'
                        }`}
                      >
                        {correlation.toFixed(2)}
                      </div>

                      {/* Tooltip on hover */}
                      {hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex && !isDiagonal && (
                        <div className="absolute z-20 bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                                      bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap
                                      pointer-events-none">
                          <div className="text-xs">
                            <p className="font-semibold mb-1">
                              {rowField} vs {colField}
                            </p>
                            <p>r = {correlation.toFixed(3)}</p>
                            <p className="text-gray-300 mt-1">
                              {interpretCorrelation(correlation)}
                            </p>
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                                        border-4 border-transparent border-t-gray-900">
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1E40AF' }}></div>
            <span className="text-gray-600">
              Strong Positive (r {'>'} 0.7): 
              <span className="font-semibold ml-1">
                {correlationMatrix.flat().filter(r => r > 0.7 && r < 1).length}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }}></div>
            <span className="text-gray-600">
              Strong Negative (r {'<'} -0.7): 
              <span className="font-semibold ml-1">
                {correlationMatrix.flat().filter(r => r < -0.7).length}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-gray-600">
              Weak (|r| {'<'} 0.3): 
              <span className="font-semibold ml-1">
                {correlationMatrix.flat().filter(r => Math.abs(r) < 0.3 && r !== 1).length}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CorrelationMatrixChart;
