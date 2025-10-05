import { useState, useEffect } from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';

function TemporalControls({ 
  filters, 
  onFilterChange, 
  onApply, 
  loading = false,
  enablePlayback = false 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Preset date ranges
  const handlePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onFilterChange('startDate', start.toISOString().split('T')[0]);
    onFilterChange('endDate', end.toISOString().split('T')[0]);
  };

  // Playback control
  useEffect(() => {
    let interval;
    if (isPlaying && enablePlayback) {
      interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          const next = prev + 1;
          // Loop back to start when reaching the end
          return next > 100 ? 0 : next;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, enablePlayback]);

  // Precision helper text
  const getPrecisionText = (precision) => {
    const precisionMap = {
      1: '≈5000km × 5000km',
      2: '≈1250km × 625km',
      3: '≈156km × 156km',
      4: '≈39km × 19.5km',
      5: '≈4.9km × 4.9km',
      6: '≈1.2km × 0.6km',
      7: '≈153m × 153m',
      8: '≈38m × 19m',
      9: '≈4.8m × 4.8m',
      10: '≈1.2m × 0.6m',
      11: '≈15cm × 15cm',
      12: '≈3.7cm × 1.9cm'
    };
    return precisionMap[precision] || '';
  };

  // Validate dates
  const validateDates = () => {
    if (filters.startDate && filters.endDate) {
      return new Date(filters.startDate) <= new Date(filters.endDate);
    }
    return true;
  };

  // Check if date range exceeds 2 years
  const isDateRangeExceeded = () => {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffYears = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return diffYears > 2;
    }
    return false;
  };

  const isValidDates = validateDates();
  const dateRangeExceeded = isDateRangeExceeded();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Temporal Filters
      </h3>

      {/* Date Range Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          
          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-600">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
              max={filters.endDate || undefined}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2 mt-2">
            <label className="block text-xs text-gray-600">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
              min={filters.startDate || undefined}
            />
          </div>

          {!isValidDates && (
            <p className="text-xs text-red-600 mt-1">
              End date must be after start date
            </p>
          )}
          
          {/* 2-year limit helper text */}
          <p className={`text-xs mt-2 ${dateRangeExceeded ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {dateRangeExceeded 
              ? '⚠️ Date range exceeds 2 years. Time-series data may be limited.'
              : 'ℹ️ Maximum range for time-series is 2 years'}
          </p>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePreset(7)}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              disabled={loading}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePreset(30)}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              disabled={loading}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePreset(90)}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              disabled={loading}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => handlePreset(365)}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              disabled={loading}
            >
              Last Year
            </button>
          </div>
        </div>

        {/* Grid Precision Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grid Precision: {filters.precision || 4}
          </label>
          <input
            type="range"
            min="1"
            max="12"
            value={filters.precision || 4}
            onChange={(e) => onFilterChange('precision', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            disabled={loading}
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Coarse (1)</span>
            <span>Fine (12)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {getPrecisionText(filters.precision || 4)}
          </p>
        </div>

        {/* Time Interval Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aggregation Interval
          </label>
          <select
            value={filters.interval || 'month'}
            onChange={(e) => onFilterChange('interval', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            disabled={loading}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>

        {/* Optional Species Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Species Name (Optional)
          </label>
          <input
            type="text"
            value={filters.scientificName || ''}
            onChange={(e) => onFilterChange('scientificName', e.target.value)}
            placeholder="e.g., Thunnus albacares"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to view all species
          </p>
        </div>

        {/* Playback Controls (Optional) */}
        {enablePlayback && (
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Playback Controls
            </label>
            
            {/* Play/Pause Button */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors"
                disabled={loading}
              >
                {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
              </button>
              
              {/* Speed Control */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="px-2 py-2 border border-gray-300 rounded-md text-sm"
                disabled={loading}
              >
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
              </select>
            </div>

            {/* Time Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={currentTimeIndex}
              onChange={(e) => setCurrentTimeIndex(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              disabled={loading}
            />
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={onApply}
          disabled={loading || !isValidDates || dateRangeExceeded}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
}

export default TemporalControls;
