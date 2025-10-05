import { FiMap, FiThermometer, FiCloudRain, FiCloud, FiWind, FiAlertTriangle } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import { useState } from 'react';

/**
 * Layer Control Panel for toggling and adjusting map layers
 */
function LayerControlPanel({ 
  activeLayers, 
  layerOpacity, 
  onLayerToggle, 
  onOpacityChange, 
  loading = {} 
}) {
  const [localOpacity, setLocalOpacity] = useState(layerOpacity);
  
  // Debounce opacity changes to prevent excessive re-renders
  const debouncedOpacity = useDebounce(localOpacity, 300);

  // Update parent when debounced value changes
  useState(() => {
    Object.keys(debouncedOpacity).forEach(layerId => {
      if (debouncedOpacity[layerId] !== layerOpacity[layerId]) {
        onOpacityChange(layerId, debouncedOpacity[layerId]);
      }
    });
  }, [debouncedOpacity]);

  // Layer definitions
  const layers = [
    { 
      id: 'biodiversity', 
      name: 'Biodiversity Heatmap', 
      color: '#3b82f6', 
      icon: FiMap,
      description: 'Species occurrence density from OBIS'
    },
    { 
      id: 'sst', 
      name: 'Sea Surface Temperature', 
      color: '#ef4444', 
      icon: FiThermometer,
      description: 'Real-time ocean temperature'
    },
    { 
      id: 'precipitation', 
      name: 'Precipitation', 
      color: '#06b6d4', 
      icon: FiCloudRain,
      description: 'Current precipitation levels'
    },
    { 
      id: 'clouds', 
      name: 'Cloud Cover', 
      color: '#94a3b8', 
      icon: FiCloud,
      description: 'Cloud coverage percentage'
    },
    { 
      id: 'wind', 
      name: 'Wind Speed', 
      color: '#10b981', 
      icon: FiWind,
      description: 'Wind speed and direction'
    },
    { 
      id: 'pollution', 
      name: 'Water Pollution', 
      color: '#f59e0b', 
      icon: FiAlertTriangle,
      description: 'Chlorophyll and turbidity levels'
    }
  ];

  const handleOpacityChange = (layerId, value) => {
    setLocalOpacity(prev => ({
      ...prev,
      [layerId]: parseFloat(value)
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-h-[600px] overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Map Layers
      </h3>

      <div className="space-y-3">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayers[layer.id];
          const opacity = localOpacity[layer.id] || 0.7;
          const isLoading = loading[layer.id];

          return (
            <div
              key={layer.id}
              className={`border-2 rounded-lg p-3 transition-all ${
                isActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Layer toggle */}
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  id={`layer-${layer.id}`}
                  checked={isActive}
                  onChange={() => onLayerToggle(layer.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: layer.color }}
                />
                
                <Icon 
                  size={18} 
                  style={{ color: layer.color }}
                />
                
                <label
                  htmlFor={`layer-${layer.id}`}
                  className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {layer.name}
                </label>

                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 ml-10 mb-2">
                {layer.description}
              </p>

              {/* Opacity slider - only show when layer is active */}
              {isActive && (
                <div className="ml-10">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Opacity:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={opacity}
                      onChange={(e) => handleOpacityChange(layer.id, e.target.value)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs text-gray-600 w-10">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Toggle layers on/off and adjust opacity to explore different environmental data
        </p>
      </div>
    </div>
  );
}

export default LayerControlPanel;
