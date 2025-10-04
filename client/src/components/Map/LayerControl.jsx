import React from 'react';
import { FiLayers, FiWind, FiDroplet, FiActivity } from 'react-icons/fi';

const LayerControl = ({ layers, onLayerToggle, loading }) => {
  const layerConfig = [
    {
      id: 'sst',
      name: 'Sea Surface Temperature',
      icon: <FiDroplet size={18} />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'currents',
      name: 'Ocean Currents',
      icon: <FiActivity size={18} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'wind',
      name: 'Wind Patterns',
      icon: <FiWind size={18} />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'waves',
      name: 'Wave Data',
      icon: <FiActivity size={18} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FiLayers size={20} />
        Environmental Layers
      </h3>
      
      <div className="space-y-2">
        {layerConfig.map((layer) => (
          <button
            key={layer.id}
            onClick={() => onLayerToggle(layer.id)}
            disabled={loading}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              layers[layer.id]
                ? `${layer.bgColor} ${layer.borderColor} ${layer.color}`
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className={`p-2 rounded-md ${
              layers[layer.id] ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}>
              {layer.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{layer.name}</div>
              <div className="text-xs opacity-75">
                {layers[layer.id] ? 'Active' : 'Click to enable'}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              layers[layer.id] ? layer.color.replace('text-', 'bg-') : 'bg-gray-300'
            }`} />
          </button>
        ))}
      </div>
      
      {loading && (
        <div className="text-sm text-gray-600 text-center py-2">
          Loading layer data...
        </div>
      )}
    </div>
  );
};

export default LayerControl;
