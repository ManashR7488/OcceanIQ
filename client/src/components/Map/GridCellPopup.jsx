import React, { useState, useEffect } from 'react';
import axiosInstance from '../../config/axios.config';

// Valid base32 geohash characters (excluding a, i, l, o)
const GEOHASH_REGEX = /^[0-9bcdefghjkmnpqrstuvwxyz]{1,12}$/;

/**
 * Validate geohash string format
 * @param {string} geohash - Geohash to validate
 * @returns {boolean} True if valid
 */
const isValidGeohash = (geohash) => {
  return typeof geohash === 'string' && GEOHASH_REGEX.test(geohash);
};

const GridCellPopup = ({ geohash, occurrenceCount, centerLat, centerLon, filters }) => {
  const [loading, setLoading] = useState(true);
  const [occurrences, setOccurrences] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('GridCellPopup received geohash:', geohash);
    console.log("hrllooo")
    
    const fetchOccurrences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query params with filters
        const params = { size: 100 };
        
        // Add filters if provided
        if (filters) {
          if (filters.scientificName) params.scientificname = filters.scientificName;
          if (filters.startDepth) params.startdepth = filters.startDepth;
          if (filters.endDepth) params.enddepth = filters.endDepth;
        }
        
        const response = await axiosInstance.get(`/map/obis/cell/${geohash}`, {
          params
        });
            console.log(response)
        setOccurrences(response.data.results || []);
      } catch (err) {
        console.error('Error fetching cell occurrences:', err);
        setError('Failed to load occurrence details');
      } finally {
        setLoading(false);
      }
    };

    // Validate geohash before fetching
    if (!geohash || geohash.length === 0 || geohash === 'N/A') {
      setLoading(false);
      setError('Grid cell data is incomplete (missing geohash)');
      return;
    }
    
    // Validate geohash format using base32 character set
    if (!isValidGeohash(geohash)) {
      setLoading(false);
      setError(`Invalid geohash format: ${geohash}`);
      return;
    }

    fetchOccurrences();
  }, [geohash, filters]);

  // Process occurrences to get statistics
  const getStatistics = () => {
    if (occurrences.length === 0) return null;

    // Unique species
    const uniqueSpecies = new Set(
      occurrences
        .map(o => o.scientificName)
        .filter(Boolean)
    ).size;

    // Date range
    const dates = occurrences
      .map(o => o.eventDate)
      .filter(Boolean)
      .map(d => new Date(d).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    const dateRange = dates.length > 0
      ? `${new Date(dates[0]).toLocaleDateString()} - ${new Date(dates[dates.length - 1]).toLocaleDateString()}`
      : 'N/A';

    // Depth range
    const depths = occurrences
      .map(o => Number(o.depth))
      .filter(d => Number.isFinite(d));
    const depthRange = depths.length > 0
      ? `${Math.min(...depths).toFixed(0)}m - ${Math.max(...depths).toFixed(0)}m`
      : 'N/A';

    return { uniqueSpecies, dateRange, depthRange };
  };

  // Get top species
  const getTopSpecies = () => {
    const speciesCounts = {};
    
    occurrences.forEach(o => {
      if (o.scientificName) {
        if (!speciesCounts[o.scientificName]) {
          speciesCounts[o.scientificName] = {
            count: 0,
            vernacularName: o.vernacularName
          };
        }
        speciesCounts[o.scientificName].count++;
      }
    });

    return Object.entries(speciesCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({
        scientificName: name,
        count: data.count,
        vernacularName: data.vernacularName
      }));
  };

  // Get top institutions
  const getTopInstitutions = () => {
    const institutionCounts = {};
    
    occurrences.forEach(o => {
      if (o.institutionCode) {
        institutionCounts[o.institutionCode] = (institutionCounts[o.institutionCode] || 0) + 1;
      }
    });

    return Object.entries(institutionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading occurrence details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600 mb-1">{error}</p>
        <p className="text-xs text-gray-500">Geohash: {geohash || 'undefined'}</p>
      </div>
    );
  }

  if (occurrences.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-600">No detailed occurrence data available</p>
      </div>
    );
  }

  const stats = getStatistics();
  const topSpecies = getTopSpecies();
  const topInstitutions = getTopInstitutions();

  return (
    <div className="p-3 space-y-3 max-w-md">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-blue-600">Grid Cell Details</h3>
        <p className="text-xs text-gray-600">Geohash: {geohash}</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="space-y-1 border-t pt-2">
          <h4 className="text-sm font-medium text-gray-800">Statistics</h4>
          <div className="text-xs space-y-0.5">
            <p><span className="font-medium">Total Occurrences:</span> {occurrenceCount.toLocaleString()}</p>
            <p><span className="font-medium">Unique Species:</span> {stats.uniqueSpecies}</p>
            <p><span className="font-medium">Date Range:</span> {stats.dateRange}</p>
            <p><span className="font-medium">Depth Range:</span> {stats.depthRange}</p>
          </div>
        </div>
      )}

      {/* Top Species */}
      {topSpecies.length > 0 && (
        <div className="space-y-1 border-t pt-2">
          <h4 className="text-sm font-medium text-gray-800">Top Species</h4>
          <div className="space-y-1">
            {topSpecies.map((species, idx) => (
              <div key={idx} className="text-xs">
                <p className="italic text-blue-700">{species.scientificName}</p>
                {species.vernacularName && (
                  <p className="text-gray-600 ml-2">({species.vernacularName})</p>
                )}
                <p className="text-gray-500 ml-2">{species.count} occurrence{species.count > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutions */}
      {topInstitutions.length > 0 && (
        <div className="space-y-1 border-t pt-2">
          <h4 className="text-sm font-medium text-gray-800">Top Institutions</h4>
          <div className="text-xs space-y-0.5">
            {topInstitutions.map((inst, idx) => (
              <p key={idx}>
                <span className="font-medium">{inst.name}:</span> {inst.count} occurrence{inst.count > 1 ? 's' : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info - Geographic Center */}
      {centerLat != null && centerLon != null && (
        <div className="space-y-1 border-t pt-2">
          <h4 className="text-sm font-medium text-gray-800">Additional Info</h4>
          <div className="text-xs">
            <p><span className="font-medium">Geographic Center:</span> {centerLat.toFixed(5)}, {centerLon.toFixed(5)}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      {occurrenceCount > 100 && (
        <div className="border-t pt-2">
          <p className="text-xs text-gray-500 italic">
            Showing details from 100 of {occurrenceCount.toLocaleString()} total occurrences
          </p>
        </div>
      )}
    </div>
  );
};

export default GridCellPopup;
