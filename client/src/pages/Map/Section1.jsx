import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axios.config';
import FilterPanel from '../../components/Map/FilterPanel';
import SpeciesMarker from '../../components/Map/SpeciesMarker';
import GridLayer from '../../components/Map/GridLayer';
import { FiInfo, FiGrid, FiMapPin } from 'react-icons/fi';

const Section1 = () => {
  const [viewMode, setViewMode] = useState('point'); // 'grid' or 'point'
  const [filters, setFilters] = useState({
    scientificName: '',
    country: '',
    countryId: '',
    startDepth: '',
    endDepth: '',
    precision: 3
  });
  const [occurrences, setOccurrences] = useState([]);
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Create persistent unique key for MapContainer to prevent double-initialization
  const mapKey = useMemo(() => `section1-map-${Date.now()}`, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    if (!filters.scientificName && !filters.country && !filters.countryId) {
      toast.warning('Please enter at least a species name, country, or country ID');
      return;
    }

    if (viewMode === 'grid') {
      await handleGridSearch();
    } else {
      await handlePointSearch();
    }
  };

  const handlePointSearch = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/map/obis/occurrences', {
        params: {
          scientificname: filters.scientificName || undefined,
          country: filters.country || undefined,
          countryid: filters.countryId || undefined,
          startdepth: filters.startDepth || undefined,
          enddepth: filters.endDepth || undefined,
          size: 500 // Limit results for performance
        }
      });

      const data = response.data.results || [];
      console.log('Point data:', data);
      setOccurrences(data);
      setGridData(null);
      setStats({
        total: response.data.total || data.length,
        displayed: data.length,
        type: 'points'
      });
      
      if (data.length === 0) {
        toast.info('No occurrences found for the given filters');
      } else {
        toast.success(`Found ${data.length} occurrences`);
      }
    } catch (error) {
      console.error('Error fetching OBIS data:', error);
      toast.error('Failed to fetch species data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGridSearch = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/map/obis/grid/${filters.precision}`, {
        params: {
          scientificname: filters.scientificName || undefined,
          country: filters.country || undefined,
          countryid: filters.countryId || undefined,
          startdepth: filters.startDepth || undefined,
          enddepth: filters.endDepth || undefined
        }
      });

      const data = response.data;
      console.log('Grid data:', data);
      setGridData(data);
      setOccurrences([]);
      
      const totalOccurrences = data.features?.reduce((sum, feature) => sum + (feature.properties?.n || 0), 0) || 0;
      setStats({
        total: totalOccurrences,
        displayed: data.features?.length || 0,
        type: 'grid'
      });
      
      if (!data.features || data.features.length === 0) {
        toast.info('No grid data found for the given filters');
      } else {
        toast.success(`Found ${data.features.length} grid cells with ${totalOccurrences} total occurrences`);
      }
    } catch (error) {
      console.error('Error fetching grid data:', error);
      toast.error('Failed to fetch grid data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFilters({
      scientificName: '',
      country: '',
      countryId: '',
      startDepth: '',
      endDepth: '',
      precision: 3
    });
    setOccurrences([]);
    setGridData(null);
    setStats(null);
  };

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Sidebar with filters */}
      <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
        {/* View Mode Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">View Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('point');
                setGridData(null);
                setStats(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'point'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiMapPin size={16} />
              <span>Point View</span>
            </button>
            <button
              onClick={() => {
                setViewMode('grid');
                setOccurrences([]);
                setStats(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiGrid size={16} />
              <span>Grid View</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {viewMode === 'point' 
              ? 'Shows individual occurrence markers (max 500)'
              : 'Shows aggregated density heatmap'}
          </p>
        </div>

        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClear}
          loading={loading}
          viewMode={viewMode}
        />
        
        {/* Stats */}
        {stats && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FiInfo className="text-blue-600 mt-0.5" size={18} />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Search Results</p>
                {stats.type === 'grid' ? (
                  <p className="text-blue-700 mt-1">
                    Displaying <span className="font-semibold">{stats.displayed}</span> grid cells
                    {' '}with <span className="font-semibold">{stats.total}</span> total occurrences
                  </p>
                ) : (
                  <p className="text-blue-700 mt-1">
                    Displaying <span className="font-semibold">{stats.displayed}</span> of{' '}
                    <span className="font-semibold">{stats.total}</span> total occurrences
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Info panel */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-2">About OBIS Data</p>
          <p>
            Data sourced from the Ocean Biodiversity Information System (OBIS), 
            a global open-access database of marine species distributions.
          </p>
          {viewMode === 'grid' && (
            <p className="mt-2 text-xs">
              <span className="font-medium">Grid precision:</span> Higher values show finer detail. 
              Use 3-4 for countries, 5-6 for regions, 7-8 for local areas.
            </p>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
        <MapContainer
          key={mapKey}
          center={[20, 80]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {viewMode === 'grid' && gridData && gridData.features && gridData.features.length > 0 && (
            <GridLayer 
              gridData={gridData} 
              filters={filters}
            />
          )}
          
          {viewMode === 'point' && occurrences.length > 0 && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
            >
              {occurrences.map((occurrence, index) => (
                occurrence.decimalLatitude && occurrence.decimalLongitude && (
                  <SpeciesMarker
                    key={occurrence.occurrenceID || index}
                    occurrence={occurrence}
                  />
                )
              ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default Section1;
