import { FiCheck } from 'react-icons/fi';

/**
 * Field selector component for choosing variables for correlation analysis
 */
function FieldSelector({
  fields = [],
  selectedFields = [],
  onFieldToggle,
  onSelectAll,
  onClearAll,
  fieldStats = {},
  minSelection = 2,
  maxSelection = 10
}) {
  const selectedCount = selectedFields.length;
  const maxReached = selectedCount >= maxSelection;

  const getFieldQualityColor = (numericPercentage) => {
    if (numericPercentage >= 95) return 'text-green-600 bg-green-50';
    if (numericPercentage >= 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getFieldQualityLabel = (numericPercentage) => {
    if (numericPercentage >= 95) return 'Excellent';
    if (numericPercentage >= 80) return 'Good';
    return 'Poor';
  };

  const handleFieldClick = (field) => {
    const isSelected = selectedFields.includes(field);
    const stats = fieldStats[field];

    // Don't allow selection if max reached and field not already selected
    if (!isSelected && maxReached) {
      return;
    }

    // Don't allow selection if field has low numeric percentage
    if (stats && stats.numericPercentage < 80) {
      return;
    }

    onFieldToggle(field);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFieldClick(field);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Select Variables for Analysis
        </h3>
        <p className="text-sm text-gray-600">
          Choose {minSelection}-{maxSelection} numeric fields to analyze correlations
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className={`
            text-sm font-semibold px-3 py-1 rounded-full
            ${selectedCount >= minSelection 
              ? 'bg-cyan-100 text-cyan-700' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {selectedCount} of {fields.length} fields selected
          </span>

          {selectedCount < minSelection && (
            <span className="text-xs text-red-600">
              (Select at least {minSelection})
            </span>
          )}

          {maxReached && (
            <span className="text-xs text-yellow-600">
              (Maximum reached)
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onSelectAll}
            disabled={maxReached && selectedCount !== fields.length}
            className="px-3 py-1 text-sm font-medium text-cyan-600 hover:text-cyan-700 
                     hover:bg-cyan-50 rounded-md transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <button
            onClick={onClearAll}
            disabled={selectedCount === 0}
            className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700 
                     hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Field List */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        {fields.map((field) => {
          const isSelected = selectedFields.includes(field);
          const stats = fieldStats[field];
          const numericPercentage = stats?.numericPercentage || 0;
          const isDisabled = (maxReached && !isSelected) || numericPercentage < 80;

          return (
            <div
              key={field}
              className={`
                relative flex items-start p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200
                ${isSelected 
                  ? 'border-cyan-500 bg-cyan-50' 
                  : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-sm'
                }
              `}
              onClick={() => !isDisabled && handleFieldClick(field)}
              onKeyDown={(e) => !isDisabled && handleKeyDown(e, field)}
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mr-3 mt-0.5">
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  transition-colors duration-200
                  ${isSelected 
                    ? 'bg-cyan-500 border-cyan-500' 
                    : 'bg-white border-gray-300'
                  }
                `}>
                  {isSelected && (
                    <FiCheck className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </div>

              {/* Field Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate mb-1">
                  {field}
                </p>

                {stats && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Data quality badge */}
                    <span className={`
                      px-2 py-0.5 rounded-full font-medium
                      ${getFieldQualityColor(numericPercentage)}
                    `}>
                      {getFieldQualityLabel(numericPercentage)} 
                      ({numericPercentage.toFixed(0)}% numeric)
                    </span>

                    {/* Value count */}
                    <span className="text-gray-500">
                      {stats.count} values
                    </span>

                    {/* Null count indicator */}
                    {stats.nullCount > 0 && (
                      <span className="text-orange-600">
                        {stats.nullCount} nulls
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Messages */}
      <div className="mt-4 space-y-2">
        {selectedCount < minSelection && selectedCount > 0 && (
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ Please select at least {minSelection} fields to perform correlation analysis
            </p>
          </div>
        )}

        {maxReached && (
          <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ℹ️ Maximum of {maxSelection} fields can be selected for analysis
            </p>
          </div>
        )}

        {Object.keys(fieldStats).length > fields.length && (
          <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              ℹ️ {Object.keys(fieldStats).length - fields.length} non-numeric fields are hidden
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default FieldSelector;
