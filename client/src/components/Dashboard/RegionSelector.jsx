import React, { useState } from 'react';
import { FiMapPin, FiPlus, FiX } from 'react-icons/fi';

/**
 * Region Selector Component
 * Allows users to add and manage region coordinates for comparison
 */
function RegionSelector({ value, onChange, label = "Select Regions" }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');

  // Parse existing value into array of regions
  const regions = value ? value.split(',').filter(v => v.trim()) : [];

  // Validate latitude
  const validateLatitude = (lat) => {
    const num = parseFloat(lat);
    if (isNaN(num)) return 'Latitude must be a number';
    if (num < -90 || num > 90) return 'Latitude must be between -90 and 90';
    return null;
  };

  // Validate longitude
  const validateLongitude = (lon) => {
    const num = parseFloat(lon);
    if (isNaN(num)) return 'Longitude must be a number';
    if (num < -180 || num > 180) return 'Longitude must be between -180 and 180';
    return null;
  };

  // Add a new region
  const handleAddRegion = () => {
    setError('');

    // Validate inputs
    const latError = validateLatitude(latitude);
    if (latError) {
      setError(latError);
      return;
    }

    const lonError = validateLongitude(longitude);
    if (lonError) {
      setError(lonError);
      return;
    }

    // Format as "lat,lon"
    const newRegion = `${parseFloat(latitude).toFixed(2)},${parseFloat(longitude).toFixed(2)}`;
    
    // Add to regions list
    const updatedRegions = [...regions, newRegion];
    onChange(updatedRegions.join(','));

    // Reset inputs
    setLatitude('');
    setLongitude('');
  };

  // Remove a region
  const handleRemoveRegion = (index) => {
    const updatedRegions = regions.filter((_, i) => i !== index);
    onChange(updatedRegions.join(','));
  };

  // Handle key press (Enter to add)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRegion();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <FiMapPin className="inline mr-2" />
        {label}
      </label>

      {/* Input Fields */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            step="0.01"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Latitude (-90 to 90)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex-1">
          <input
            type="number"
            step="0.01"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Longitude (-180 to 180)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleAddRegion}
          disabled={!latitude || !longitude}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Selected Regions List */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-600">Selected Regions:</div>
          <div className="space-y-1">
            {regions.map((region, index) => {
              const [lat, lon] = region.split(',');
              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md"
                >
                  <span className="text-sm text-gray-700">
                    Region {index + 1}: {lat}°, {lon}°
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRegion(index)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="text-xs text-gray-500">
        Add at least 2 regions for comparison. Example: Lat: 20.5, Lon: 70.2
      </div>
    </div>
  );
}

export default RegionSelector;
