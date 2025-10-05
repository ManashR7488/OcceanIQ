import { useState } from 'react';
import IntegratedEnvironmentalMap from '../../components/Map/IntegratedEnvironmentalMap';
import TemporalControls from '../../components/Dashboard/TemporalControls';
import { FiInfo, FiMap, FiLayers, FiClock } from 'react-icons/fi';

/**
 * Section4 - Integrated Environmental Map Page
 * Combines OBIS biodiversity, weather tiles, and WMS pollution layers
 */
function Section4() {
  // Filter state
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    precision: 5,
    interval: 'month',
    scientificName: '',
    startdepth: 0,
    enddepth: 1000
  });

  const [enableAnimation, setEnableAnimation] = useState(false);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle animation toggle
  const handleAnimationToggle = () => {
    setEnableAnimation(prev => !prev);
    
    // Ensure interval is set when enabling animation
    if (!enableAnimation && !filters.interval) {
      setFilters(prev => ({ ...prev, interval: 'month' }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar - Controls */}
      <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiMap className="text-cyan-600" />
              Integrated Environmental Map
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Explore biodiversity, weather, and pollution data in a unified view
            </p>
          </div>

          {/* Temporal controls */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <FiClock className="text-blue-600" />
              Temporal Filters
            </h3>
            <TemporalControls
              filters={filters}
              onFiltersChange={handleFilterChange}
              showIntervalSelector={true}
            />
          </div>

          {/* Animation toggle */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Temporal Animation
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Play through time-sliced data
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAnimation}
                  onChange={handleAnimationToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-600 peer-checked:to-blue-600"></div>
              </label>
            </div>
            {enableAnimation && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Animation mode fetches data in {filters.interval || 'month'} intervals. 
                  Use the controls at the bottom to play/pause and navigate through time.
                </p>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-cyan-50 to-blue-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <FiInfo className="text-cyan-600" />
              Data Sources & Layers
            </h3>
            
            <div className="space-y-3 text-xs text-gray-700">
              <div>
                <h4 className="font-semibold text-cyan-700 flex items-center gap-1">
                  <FiLayers size={12} />
                  Biodiversity (OBIS)
                </h4>
                <p className="text-gray-600 ml-4 mt-1">
                  Species occurrence data from the Ocean Biodiversity Information System
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-blue-700 flex items-center gap-1">
                  <FiLayers size={12} />
                  Weather (OpenWeatherMap)
                </h4>
                <ul className="text-gray-600 ml-4 mt-1 space-y-0.5">
                  <li>• Precipitation patterns</li>
                  <li>• Cloud coverage</li>
                  <li>• Sea surface temperature</li>
                  <li>• Wind speed & direction</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700 flex items-center gap-1">
                  <FiLayers size={12} />
                  Pollution (Copernicus WMS)
                </h4>
                <ul className="text-gray-600 ml-4 mt-1 space-y-0.5">
                  <li>• Chlorophyll concentration</li>
                  <li>• Water turbidity</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-300">
              <h4 className="font-semibold text-gray-700 mb-2">Usage Tips</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Toggle layers using the control panel (top-right)</li>
                <li>• Adjust layer opacity with the sliders</li>
                <li>• Click grid cells to view biodiversity details</li>
                <li>• Enable animation to explore temporal changes</li>
                <li>• Use keyboard shortcuts (Space, arrows, Home/End)</li>
              </ul>
            </div>
          </div>

          {/* Species search */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Species Filter
            </h3>
            <input
              type="text"
              placeholder="Scientific name (optional)"
              value={filters.scientificName}
              onChange={(e) => handleFilterChange({ scientificName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Filter biodiversity data by species name
            </p>
          </div>

          {/* Depth range */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Depth Range (meters)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Min Depth</label>
                <input
                  type="number"
                  value={filters.startdepth}
                  onChange={(e) => handleFilterChange({ startdepth: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Max Depth</label>
                <input
                  type="number"
                  value={filters.enddepth}
                  onChange={(e) => handleFilterChange({ enddepth: parseInt(e.target.value) || 1000 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - Map */}
      <main className="flex-1 overflow-hidden">
        <IntegratedEnvironmentalMap
          filters={filters}
          onFilterChange={handleFilterChange}
          height="100%"
          center={[0, 0]}
          zoom={2}
          enableAnimation={enableAnimation}
        />
      </main>
    </div>
  );
}

export default Section4;
