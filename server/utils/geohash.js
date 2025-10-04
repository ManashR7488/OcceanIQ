/**
 * Geohash utility functions
 * Converts geohash to bounding box and WKT polygon for OBIS API
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Decode geohash to bounding box
 * @param {string} geohash - The geohash string
 * @returns {Object} Bounding box with minLat, maxLat, minLon, maxLon
 */
export function geohashToBbox(geohash) {
  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let isEven = true;

  for (let i = 0; i < geohash.length; i++) {
    const char = geohash[i];
    const idx = BASE32.indexOf(char);
    
    if (idx === -1) {
      throw new Error(`Invalid geohash character: ${char}`);
    }

    for (let bit = 4; bit >= 0; bit--) {
      const bitValue = (idx >> bit) & 1;
      
      if (isEven) {
        // longitude
        const mid = (minLon + maxLon) / 2;
        if (bitValue === 1) {
          minLon = mid;
        } else {
          maxLon = mid;
        }
      } else {
        // latitude
        const mid = (minLat + maxLat) / 2;
        if (bitValue === 1) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Convert geohash to WKT polygon
 * @param {string} geohash - The geohash string
 * @returns {string} WKT polygon string
 */
export function geohashToWKT(geohash) {
  const bbox = geohashToBbox(geohash);
  
  // WKT polygon format: POLYGON((lon1 lat1, lon2 lat2, ...))
  // Need to close the polygon by repeating first coordinate
  const wkt = `POLYGON((${bbox.minLon} ${bbox.minLat}, ${bbox.maxLon} ${bbox.minLat}, ${bbox.maxLon} ${bbox.maxLat}, ${bbox.minLon} ${bbox.maxLat}, ${bbox.minLon} ${bbox.minLat}))`;
  
  return wkt;
}

/**
 * Validate geohash format
 * @param {string} geohash - The geohash string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidGeohash(geohash) {
  if (!geohash || typeof geohash !== 'string') {
    return false;
  }
  
  // Geohash should be 1-12 characters
  if (geohash.length < 1 || geohash.length > 12) {
    return false;
  }
  
  // All characters must be valid base32
  for (let i = 0; i < geohash.length; i++) {
    if (BASE32.indexOf(geohash[i]) === -1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get center coordinates from geohash
 * @param {string} geohash - The geohash string
 * @returns {Object} Center coordinates with lat, lon
 */
export function geohashToCenter(geohash) {
  const bbox = geohashToBbox(geohash);
  return {
    lat: (bbox.minLat + bbox.maxLat) / 2,
    lon: (bbox.minLon + bbox.maxLon) / 2
  };
}

/**
 * Encode latitude/longitude to geohash
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} precision - Number of characters in resulting geohash (1-12)
 * @returns {string} Geohash string
 */
export function latLonToGeohash(latitude, longitude, precision = 5) {
  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let geohash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  // Clamp precision to valid range
  precision = Math.max(1, Math.min(12, precision));

  while (geohash.length < precision) {
    if (isEven) {
      // longitude
      const mid = (minLon + maxLon) / 2;
      if (longitude > mid) {
        ch |= (1 << (4 - bit));
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      // latitude
      const mid = (minLat + maxLat) / 2;
      if (latitude > mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    
    isEven = !isEven;

    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Calculate centroid of a polygon from GeoJSON coordinates
 * Note: OBIS grid polygons are rectangular cells, so this uses a simple
 * bounding-box center for efficiency and reliability with rectangular shapes.
 * For non-rectangular polygons, consider using area-weighted centroid calculation.
 * @param {Array} coordinates - GeoJSON polygon coordinates array [[[lon, lat], ...]]
 * @returns {Object} Centroid with lat, lon properties
 */
export function getPolygonCentroid(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error('Invalid polygon coordinates');
  }

  // GeoJSON polygon coordinates are [[[lon, lat], [lon, lat], ...]]
  // Take the first ring (exterior ring)
  const ring = coordinates[0];
  
  if (!ring || ring.length === 0) {
    throw new Error('Polygon has no exterior ring');
  }

  // Use bounding box center for rectangular OBIS grid cells
  return getBboxCenter(coordinates);
}

/**
 * Calculate the center of a polygon's bounding box
 * Efficient and reliable method for rectangular shapes like OBIS grid cells
 * @param {Array} coordinates - GeoJSON polygon coordinates array [[[lon, lat], ...]]
 * @returns {Object} Center point with lat, lon properties
 */
export function getBboxCenter(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error('Invalid polygon coordinates');
  }

  // Get the exterior ring
  const ring = coordinates[0];
  
  if (!ring || ring.length === 0) {
    throw new Error('Polygon has no exterior ring');
  }

  // Initialize bounding box
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  // Find bounding box
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // Return center of bounding box
  return {
    lat: (minLat + maxLat) / 2,
    lon: (minLon + maxLon) / 2
  };
}

/**
 * Calculate centroid of a MultiPolygon from GeoJSON coordinates
 * Uses area-weighted average of individual polygon centroids
 * @param {Array} coordinates - GeoJSON MultiPolygon coordinates array [[[[lon, lat], ...]], ...]
 * @returns {Object} Centroid with lat, lon properties
 */
export function getMultiPolygonCentroid(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error('Invalid MultiPolygon coordinates');
  }

  // Calculate area and centroid for each polygon
  const polygonData = [];
  
  for (const polygonCoords of coordinates) {
    try {
      const centroid = getPolygonCentroid(polygonCoords);
      const area = calculatePolygonArea(polygonCoords[0]); // Use exterior ring for area
      polygonData.push({ centroid, area });
    } catch (err) {
      console.warn('Skipping invalid polygon in MultiPolygon:', err.message);
    }
  }

  if (polygonData.length === 0) {
    throw new Error('No valid polygons found in MultiPolygon');
  }

  // If only one valid polygon, return its centroid
  if (polygonData.length === 1) {
    return polygonData[0].centroid;
  }

  // Calculate area-weighted centroid
  let totalArea = 0;
  let weightedLat = 0;
  let weightedLon = 0;

  for (const { centroid, area } of polygonData) {
    const absArea = Math.abs(area); // Use absolute area for weighting
    totalArea += absArea;
    weightedLat += centroid.lat * absArea;
    weightedLon += centroid.lon * absArea;
  }

  return {
    lat: weightedLat / totalArea,
    lon: weightedLon / totalArea
  };
}

/**
 * Calculate the area of a polygon ring using the shoelace formula
 * @param {Array} ring - Array of [lon, lat] coordinates
 * @returns {number} Signed area (positive for counter-clockwise, negative for clockwise)
 */
function calculatePolygonArea(ring) {
  if (!ring || ring.length < 3) {
    return 0;
  }

  let area = 0;
  const n = ring.length;

  // Shoelace formula
  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}
