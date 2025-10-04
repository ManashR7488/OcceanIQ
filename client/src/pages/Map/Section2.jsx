import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, CircleMarker, Popup, Rectangle } from 'react-leaflet';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axios.config';
import LayerControl from '../../components/Map/LayerControl';
import { FiInfo, FiMapPin } from 'react-icons/fi';

// Component to handle map center updates
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Component to handle map click events
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    }
  });
  return null;
};

// Component to render SST heatmap overlay
const SSTOverlay = ({ data }) => {
  if (!data?.current?.sst) return null;
  
  const sst = data.current.sst;
  const lat = data.location.latitude;
  const lng = data.location.longitude;
  
  // Create color based on temperature (cold=blue, warm=red)
  const getColor = (temp) => {
    if (temp < 10) return '#0000ff';
    if (temp < 15) return '#00ffff';
    if (temp < 20) return '#00ff00';
    if (temp < 25) return '#ffff00';
    if (temp < 30) return '#ff8800';
    return '#ff0000';
  };
  
  return (
    <CircleMarker
      center={[lat, lng]}
      radius={30}
      pathOptions={{
        fillColor: getColor(sst),
        fillOpacity: 0.4,
        color: getColor(sst),
        weight: 2,
        opacity: 0.6
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-bold text-red-600">Sea Surface Temperature</p>
          <p className="mt-1">{sst.toFixed(1)}°C</p>
          <p className="text-xs text-gray-600 mt-1">
            {lat.toFixed(2)}, {lng.toFixed(2)}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  );
};

// Component to render wave overlay
const WaveOverlay = ({ data }) => {
  if (!data?.current?.waveHeight) return null;
  
  const waveHeight = data.current.waveHeight;
  const lat = data.location.latitude;
  const lng = data.location.longitude;
  
  // Create color based on wave height
  const getColor = (height) => {
    if (height < 1) return '#9333ea';
    if (height < 2) return '#a855f7';
    if (height < 3) return '#c084fc';
    return '#e9d5ff';
  };
  
  return (
    <CircleMarker
      center={[lat, lng]}
      radius={25}
      pathOptions={{
        fillColor: getColor(waveHeight),
        fillOpacity: 0.4,
        color: getColor(waveHeight),
        weight: 2,
        opacity: 0.6
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-bold text-purple-600">Wave Data</p>
          <p className="mt-1">Height: {waveHeight.toFixed(1)}m</p>
          {data.current.waveDirection && (
            <p>Direction: {data.current.waveDirection.toFixed(0)}°</p>
          )}
          {data.current.wavePeriod && (
            <p>Period: {data.current.wavePeriod.toFixed(1)}s</p>
          )}
          <p className="text-xs text-gray-600 mt-1">
            {lat.toFixed(2)}, {lng.toFixed(2)}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  );
};

// Component to render current velocity arrows
const CurrentOverlay = ({ data }) => {
  if (!data?.current?.currentVelocity) return null;
  
  const velocity = data.current.currentVelocity;
  const direction = data.current.currentDirection || 0;
  const lat = data.location.latitude;
  const lng = data.location.longitude;
  
  // Calculate arrow endpoint based on direction and velocity
  const arrowLength = velocity * 0.5; // Scale factor
  const radians = (direction - 90) * (Math.PI / 180);
  const endLat = lat + (arrowLength * Math.cos(radians));
  const endLng = lng + (arrowLength * Math.sin(radians));
  
  return (
    <>
      <CircleMarker
        center={[lat, lng]}
        radius={15}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 0.5,
          color: '#1d4ed8',
          weight: 2,
          opacity: 0.7
        }}
      >
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-blue-600">Ocean Current</p>
            <p className="mt-1">Velocity: {velocity.toFixed(2)} m/s</p>
            <p>Direction: {direction.toFixed(0)}°</p>
            <p className="text-xs text-gray-600 mt-1">
              {lat.toFixed(2)}, {lng.toFixed(2)}
            </p>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
};

// Component to render wind overlay
const WindOverlay = ({ data }) => {
  if (!data?.current?.windSpeed) return null;
  
  const windSpeed = data.current.windSpeed;
  const windDirection = data.current.windDirection || 0;
  const lat = data.location.latitude;
  const lng = data.location.longitude;
  
  return (
    <CircleMarker
      center={[lat, lng]}
      radius={20}
      pathOptions={{
        fillColor: '#10b981',
        fillOpacity: 0.4,
        color: '#059669',
        weight: 2,
        opacity: 0.6
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-bold text-green-600">Wind Pattern</p>
          <p className="mt-1">Speed: {windSpeed.toFixed(1)} m/s</p>
          <p>Direction: {windDirection.toFixed(0)}°</p>
          <p className="text-xs text-gray-600 mt-1">
            {lat.toFixed(2)}, {lng.toFixed(2)}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  );
};

const Section2 = () => {
  const [layers, setLayers] = useState({
    sst: false,
    currents: false,
    wind: false,
    waves: false
  });
  const [loading, setLoading] = useState(false);
  const [layerData, setLayerData] = useState({});
  const [mapCenter, setMapCenter] = useState([20, 80]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Create persistent unique key for MapContainer to prevent double-initialization
  const mapKey = useMemo(() => `section2-map-${Date.now()}`, []);

  const handleLayerToggle = async (layerId) => {
    const newState = !layers[layerId];
    setLayers(prev => ({ ...prev, [layerId]: newState }));

    if (newState && !layerData[layerId]) {
      // Fetch data for this layer
      setLoading(true);
      try {
        const response = await axiosInstance.get('/map/marine-weather', {
          params: {
            latitude: mapCenter[0],
            longitude: mapCenter[1],
            layer: layerId
          }
        });
        
        setLayerData(prev => ({
          ...prev,
          [layerId]: response.data
        }));
        
        toast.success(`${layerId.toUpperCase()} layer loaded`);
      } catch (error) {
        console.error(`Error fetching ${layerId} data:`, error);
        toast.error(`Failed to load ${layerId} layer`);
        setLayers(prev => ({ ...prev, [layerId]: false }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation({ lat, lng });
    setMapCenter([lat, lng]);
    
    // Fetch data for selected location
    setLoading(true);
    try {
      const response = await axiosInstance.get('/map/marine-weather', {
        params: {
          latitude: lat,
          longitude: lng
        }
      });
      
      // Update all active layers with new location data
      const newLayerData = { ...layerData };
      Object.keys(layers).forEach(layerId => {
        if (layers[layerId]) {
          newLayerData[layerId] = response.data;
        }
      });
      setLayerData(newLayerData);
      
      toast.info(`Location data loaded: ${lat.toFixed(2)}, ${lng.toFixed(2)}`);
    } catch (error) {
      console.error('Error fetching location data:', error);
      toast.error('Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Sidebar with layer controls */}
      <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
        <LayerControl
          layers={layers}
          onLayerToggle={handleLayerToggle}
          loading={loading}
        />
        
        {/* Location info */}
        {selectedLocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FiMapPin className="text-blue-600 mt-0.5" size={18} />
              <div className="text-sm w-full">
                <p className="font-medium text-blue-900">Selected Location</p>
                <p className="text-blue-700 mt-1">
                  Lat: {selectedLocation.lat.toFixed(4)}<br />
                  Lng: {selectedLocation.lng.toFixed(4)}
                </p>
                
                {/* Display data for active layers */}
                {Object.keys(layers).some(key => layers[key]) && (
                  <div className="mt-3 pt-3 border-t border-blue-200 space-y-2">
                    {layers.sst && layerData.sst?.current?.sst !== undefined && (
                      <div className="text-xs">
                        <span className="font-medium text-red-600">SST:</span> {layerData.sst.current.sst.toFixed(1)}°C
                      </div>
                    )}
                    {layers.currents && layerData.currents?.current?.currentVelocity !== undefined && (
                      <div className="text-xs">
                        <span className="font-medium text-blue-600">Current:</span> {layerData.currents.current.currentVelocity.toFixed(2)} m/s
                      </div>
                    )}
                    {layers.wind && layerData.wind?.current?.windSpeed !== undefined && (
                      <div className="text-xs">
                        <span className="font-medium text-green-600">Wind:</span> {layerData.wind.current.windSpeed.toFixed(1)} m/s
                      </div>
                    )}
                    {layers.waves && layerData.waves?.current?.waveHeight !== undefined && (
                      <div className="text-xs">
                        <span className="font-medium text-purple-600">Waves:</span> {layerData.waves.current.waveHeight.toFixed(1)}m
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Layer legend */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Layer Information</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div>
              <span className="font-medium text-red-600">SST:</span> Sea Surface Temperature in °C
            </div>
            <div>
              <span className="font-medium text-blue-600">Currents:</span> Ocean current velocity (m/s)
            </div>
            <div>
              <span className="font-medium text-green-600">Wind:</span> Wind speed and direction
            </div>
            <div>
              <span className="font-medium text-purple-600">Waves:</span> Significant wave height (m)
            </div>
          </div>
        </div>
        
        {/* Info panel */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-2">About Environmental Data</p>
          <p>
            Real-time marine weather data from Open-Meteo Marine Weather API. 
            Click on the map to view data for specific locations.
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
        <MapContainer
          key={mapKey}
          center={mapCenter}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapCenter} />
          <MapClickHandler onMapClick={handleMapClick} />
          
          {/* Render environmental overlays based on active layers */}
          {layers.sst && layerData.sst && <SSTOverlay data={layerData.sst} />}
          {layers.currents && layerData.currents && <CurrentOverlay data={layerData.currents} />}
          {layers.wind && layerData.wind && <WindOverlay data={layerData.wind} />}
          {layers.waves && layerData.waves && <WaveOverlay data={layerData.waves} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default Section2;
