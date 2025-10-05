import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../../config/axios.config';
import WMSLayer from './WMSLayer';
import LayerControlPanel from './LayerControlPanel';
import GridLayer from './GridLayer';
import { apiCache, getCachedOrFetch } from '../../utils/cacheManager';
import useDebounce  from '../../hooks/useDebounce';
import useTemporalAnimation  from '../../hooks/useTemporalAnimation';
import TemporalAnimationControls from './TemporalAnimationControls';

/**
 * Integrated Environmental Map combining:
 * - OBIS biodiversity grid (temporal sliced)
 * - OpenWeatherMap weather tiles (precipitation, clouds, temp, wind)
 * - Copernicus WMS pollution layers (chlorophyll, turbidity)
 */
function IntegratedEnvironmentalMap({
  filters = {},
  onFilterChange,
  height = '600px',
  center = [0, 0],
  zoom = 2,
  enableAnimation = false
}) {
  // State
  const [activeLayers, setActiveLayers] = useState({
    biodiversity: true,
    sst: false,
    precipitation: false,
    clouds: false,
    wind: false,
    pollution: false
  });

  const [layerOpacity, setLayerOpacity] = useState({
    biodiversity: 80,
    sst: 70,
    precipitation: 60,
    clouds: 50,
    wind: 60,
    pollution: 70
  });

  const [loading, setLoading] = useState({});
  const [gridData, setGridData] = useState(null);
  const [timeSlices, setTimeSlices] = useState([]);
  const [weatherTileConfig, setWeatherTileConfig] = useState(null);
  const [error, setError] = useState(null);

  // Debounce filters to prevent excessive API calls
  const debouncedFilters = useDebounce(filters, 500);

  // Temporal animation hook
  const {
    currentIndex,
    currentSlice,
    isPlaying,
    play,
    pause,
    reset,
    goToIndex,
    playbackSpeed,
    setPlaybackSpeed
  } = useTemporalAnimation(timeSlices, 1000);

  // Fetch biodiversity grid data
  useEffect(() => {
    if (!activeLayers.biodiversity) return;

    const fetchGridData = async () => {
      setLoading(prev => ({ ...prev, biodiversity: true }));
      setError(null);

      try {
        const params = {
          ...debouncedFilters,
          interval: enableAnimation ? (debouncedFilters.interval || 'month') : undefined
        };

        const cacheKey = apiCache.generateKey('biodiversity-grid', params);
        const data = await getCachedOrFetch(cacheKey, async () => {
          const response = await axios.get('biodiversity/grid', { params });
          return response.data;
        });

        if (enableAnimation && Array.isArray(data)) {
          // Time-sliced data
          setTimeSlices(data);
          setGridData(data[0]?.data || null);
        } else {
          // Single snapshot
          setGridData(data);
          setTimeSlices([]);
        }
      } catch (err) {
        console.error('Failed to fetch biodiversity grid:', err);
        setError('Failed to load biodiversity data');
        setGridData(null);
        setTimeSlices([]);
      } finally {
        setLoading(prev => ({ ...prev, biodiversity: false }));
      }
    };

    fetchGridData();
  }, [activeLayers.biodiversity, debouncedFilters, enableAnimation]);

  // Fetch weather tile configuration
  useEffect(() => {
    const shouldFetchWeather = 
      activeLayers.precipitation || 
      activeLayers.clouds || 
      activeLayers.wind || 
      activeLayers.sst;

    if (!shouldFetchWeather) return;

    const fetchWeatherConfig = async () => {
      const weatherLayers = [];
      if (activeLayers.precipitation) weatherLayers.push('precipitation');
      if (activeLayers.clouds) weatherLayers.push('clouds');
      if (activeLayers.wind) weatherLayers.push('wind');
      if (activeLayers.sst) weatherLayers.push('temp');

      setLoading(prev => ({ 
        ...prev, 
        ...Object.fromEntries(weatherLayers.map(l => [l === 'temp' ? 'sst' : l, true]))
      }));

      try {
        const cacheKey = apiCache.generateKey('weather-tiles', {});
        const data = await getCachedOrFetch(cacheKey, async () => {
          const response = await axios.get('biodiversity/weather-tiles');
          return response.data;
        });
        console.log(data);
        setWeatherTileConfig(data);
      } catch (err) {
        console.error('Failed to fetch weather tiles:', err);
      } finally {
        setLoading(prev => ({ 
          ...prev, 
          ...Object.fromEntries(
            ['precipitation', 'clouds', 'wind', 'sst'].map(l => [l, false])
          )
        }));
      }
    };

    fetchWeatherConfig();
  }, [
    activeLayers.precipitation, 
    activeLayers.clouds, 
    activeLayers.wind, 
    activeLayers.sst
  ]);

  // Update grid data when animation progresses
  useEffect(() => {
    if (enableAnimation && currentSlice) {
      setGridData(currentSlice.data);
    }
  }, [currentSlice, enableAnimation]);

  // Layer toggle handler
  const handleLayerToggle = (layerId) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  // Opacity change handler
  const handleOpacityChange = (layerId, opacity) => {
    setLayerOpacity(prev => ({
      ...prev,
      [layerId]: opacity
    }));
  };

  // Memoize biodiversity layer
  const biodiversityLayer = useMemo(() => {
    if (!activeLayers.biodiversity || !gridData) return null;

    return (
      <GridLayer
        gridData={gridData}
        filters={debouncedFilters}
        opacity={layerOpacity.biodiversity / 100}
      />
    );
  }, [activeLayers.biodiversity, gridData, debouncedFilters, layerOpacity.biodiversity]);

  // Memoize weather tile layers
  const weatherLayers = useMemo(() => {
    if (!weatherTileConfig) return null;

    const layers = [];

    if (activeLayers.precipitation && weatherTileConfig.precipitation) {
      layers.push(
        <TileLayer
          key="precipitation"
          url={weatherTileConfig.precipitation}
          opacity={layerOpacity.precipitation / 100}
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        />
      );
    }

    if (activeLayers.clouds && weatherTileConfig.clouds) {
      layers.push(
        <TileLayer
          key="clouds"
          url={weatherTileConfig.clouds}
          opacity={layerOpacity.clouds / 100}
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        />
      );
    }

    if (activeLayers.sst && weatherTileConfig.temp) {
      layers.push(
        <TileLayer
          key="sst"
          url={weatherTileConfig.temp}
          opacity={layerOpacity.sst / 100}
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        />
      );
    }

    if (activeLayers.wind && weatherTileConfig.wind) {
      layers.push(
        <TileLayer
          key="wind"
          url={weatherTileConfig.wind}
          opacity={layerOpacity.wind / 100}
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        />
      );
    }

    return layers;
  }, [
    activeLayers.precipitation,
    activeLayers.clouds,
    activeLayers.sst,
    activeLayers.wind,
    weatherTileConfig,
    layerOpacity.precipitation,
    layerOpacity.clouds,
    layerOpacity.sst,
    layerOpacity.wind
  ]);

  // Memoize pollution WMS layer
  const pollutionLayer = useMemo(() => {
    if (!activeLayers.pollution) return null;

    return (
      <WMSLayer
        key="pollution"
        url="/api/biodiversity/pollution-wms"
        layers="chlorophyll,turbidity"
        opacity={layerOpacity.pollution / 100}
        dataset="cmems_mod_glo_bgc_my_0.25deg_P1D-m"
      />
    );
  }, [activeLayers.pollution, layerOpacity.pollution]);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Error banner */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-md">
          {error}
        </div>
      )}

      {/* Layer control panel */}
      <div className="absolute top-4 right-4 z-[999]">
        <LayerControlPanel
          activeLayers={activeLayers}
          layerOpacity={layerOpacity}
          onLayerToggle={handleLayerToggle}
          onOpacityChange={handleOpacityChange}
          loading={loading}
        />
      </div>

      {/* Map container */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        className="rounded-lg shadow-md"
      >
        {/* Base layer - OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Biodiversity grid layer */}
        {biodiversityLayer}

        {/* Weather tile layers */}
        {weatherLayers}

        {/* Pollution WMS layer */}
        {pollutionLayer}
      </MapContainer>

      {/* Temporal animation controls */}
      {enableAnimation && timeSlices.length > 0 && (
        <TemporalAnimationControls
          timeSlices={timeSlices}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onReset={reset}
          onSeek={goToIndex}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
        />
      )}
    </div>
  );
}

export default IntegratedEnvironmentalMap;
