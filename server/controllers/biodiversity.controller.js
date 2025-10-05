import axios from 'axios';
import {
  latLonToGeohash,
  getPolygonCentroid,
  getMultiPolygonCentroid,
} from '../utils/geohash.js';

const OBIS_API_BASE = 'https://api.obis.org/v3';
const COPERNICUS_WMS_BASE = 'https://nrt.cmems-du.eu/thredds/wms/';

/**
 * Get biodiversity grid data with optional temporal slicing
 * Returns array of time-sliced GeoJSON FeatureCollections or single aggregated GeoJSON
 */
export const getBiodiversityGrid = async (req, res) => {
  try {
    const {
      precision = 4,
      startdate,
      enddate,
      interval,
      scientificname,
      startdepth,
      enddepth,
      size = 10000
    } = req.query;

    // Validate precision
    const precisionNum = parseInt(precision);
    if (isNaN(precisionNum) || precisionNum < 1 || precisionNum > 12) {
      return res.status(400).json({
        error: 'Invalid precision',
        message: 'Precision must be between 1 and 12'
      });
    }

    // Validate date order if both provided
    if (startdate && enddate) {
      const start = new Date(startdate);
      const end = new Date(enddate);
      
      if (start > end) {
        return res.status(400).json({
          error: 'Invalid date range',
          message: 'Start date must be before or equal to end date'
        });
      }

      // Check if range exceeds 2 years when using interval
      if (interval) {
        const diffYears = (end - start) / (1000 * 60 * 60 * 24 * 365);
        if (diffYears > 2) {
          return res.status(400).json({
            error: 'Date range too large',
            message: 'Maximum date range for time-slicing is 2 years. Please reduce the date range or disable temporal animation.'
          });
        }
      }
    }

    // If interval is provided, fetch time-sliced data
    if (interval && startdate && enddate) {
      const timeSlices = await fetchTimeSlicedGrid(
        precisionNum,
        startdate,
        enddate,
        interval,
        scientificname,
        startdepth,
        enddepth
      );
      return res.json({ timeSlices });
    }

    // Otherwise, fetch single aggregated grid
    const params = {};
    if (scientificname) params.scientificname = scientificname;
    if (startdate) params.startdate = startdate;
    if (enddate) params.enddate = enddate;
    if (startdepth) params.startdepth = startdepth;
    if (enddepth) params.enddepth = enddepth;

    const response = await axios.get(
      `${OBIS_API_BASE}/occurrence/grid/${precisionNum}`,
      {
        params,
        timeout: 30000
      }
    );

    // Enrich features with geohash
    const enrichedData = enrichGridWithGeohash(response.data, precisionNum);
    res.json(enrichedData);

  } catch (error) {
    console.error('Error fetching biodiversity grid:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch biodiversity grid data',
      message: error.message
    });
  }
};

/**
 * Fetch time-sliced grid data for temporal animation with calendar-based bucketing
 * Uses parallel fetching with concurrency limit for better performance
 */
async function fetchTimeSlicedGrid(
  precision,
  startdate,
  enddate,
  interval,
  scientificname,
  startdepth,
  enddepth
) {
  const start = new Date(startdate);
  const end = new Date(enddate);
  const buckets = [];

  // Generate calendar-based time buckets
  let currentStart = new Date(start);
  
  while (currentStart <= end) {
    let currentEnd;
    
    switch (interval) {
      case 'day':
        currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + 1);
        currentEnd.setMilliseconds(currentEnd.getMilliseconds() - 1);
        break;
      case 'week':
        currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + 7);
        currentEnd.setMilliseconds(currentEnd.getMilliseconds() - 1);
        break;
      case 'month':
        currentEnd = new Date(currentStart);
        currentEnd.setMonth(currentEnd.getMonth() + 1);
        currentEnd.setMilliseconds(currentEnd.getMilliseconds() - 1);
        break;
      case 'year':
        currentEnd = new Date(currentStart);
        currentEnd.setFullYear(currentEnd.getFullYear() + 1);
        currentEnd.setMilliseconds(currentEnd.getMilliseconds() - 1);
        break;
      default:
        throw new Error(`Invalid interval: ${interval}. Must be day, week, month, or year.`);
    }

    // Clamp to overall end date
    if (currentEnd > end) {
      currentEnd = new Date(end);
    }

    buckets.push({
      startdate: currentStart.toISOString().split('T')[0],
      enddate: currentEnd.toISOString().split('T')[0],
    });

    // Break if we've reached the end
    if (currentEnd >= end) break;

    // Move to next bucket
    switch (interval) {
      case 'day':
        currentStart.setDate(currentStart.getDate() + 1);
        break;
      case 'week':
        currentStart.setDate(currentStart.getDate() + 7);
        break;
      case 'month':
        currentStart.setMonth(currentStart.getMonth() + 1);
        break;
      case 'year':
        currentStart.setFullYear(currentStart.getFullYear() + 1);
        break;
    }

    // Safety limit: max 50 buckets
    if (buckets.length >= 50) {
      console.warn(`Time-slicing limited to 50 buckets. Consider using larger interval.`);
      break;
    }
  }

  // Parallel fetch with concurrency limit
  const CONCURRENCY_LIMIT = 5;
  const results = [];
  
  for (let i = 0; i < buckets.length; i += CONCURRENCY_LIMIT) {
    const chunk = buckets.slice(i, i + CONCURRENCY_LIMIT);
    const chunkPromises = chunk.map(async (bucket) => {
      try {
        const params = {
          startdate: bucket.startdate,
          enddate: bucket.enddate,
        };
        if (scientificname) params.scientificname = scientificname;
        if (startdepth) params.startdepth = startdepth;
        if (enddepth) params.enddepth = enddepth;

        const response = await axios.get(
          `${OBIS_API_BASE}/occurrence/grid/${precision}`,
          { params, timeout: 30000 }
        );

        return {
          status: 'fulfilled',
          value: {
            startdate: bucket.startdate,
            enddate: bucket.enddate,
            data: enrichGridWithGeohash(response.data, precision)
          }
        };
      } catch (error) {
        console.error(`Failed to fetch bucket ${bucket.startdate} to ${bucket.enddate}:`, error.message);
        return {
          status: 'rejected',
          reason: error.message,
          bucket
        };
      }
    });

    const chunkResults = await Promise.allSettled(chunkPromises);
    results.push(...chunkResults);
  }

  // Extract successful results and preserve order
  return results
    .map((result, index) => {
      if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
        return result.value.value;
      } else {
        // Return empty GeoJSON for failed buckets to maintain order
        const bucket = buckets[index];
        return {
          startdate: bucket.startdate,
          enddate: bucket.enddate,
          data: {
            type: 'FeatureCollection',
            features: []
          }
        };
      }
    });
}

/**
 * Enrich GeoJSON features with geohash values
 */
function enrichGridWithGeohash(geoJsonData, precision) {
  if (!geoJsonData?.features || !Array.isArray(geoJsonData.features.slice(0, 10000))) {
    return geoJsonData;
  }

  let enrichedCount = 0;

  geoJsonData.features.forEach((feature) => {
    try {
      if (feature.geometry?.coordinates) {
        let centroid;

        if (feature.geometry.type === 'Polygon') {
          centroid = getPolygonCentroid(feature.geometry.coordinates);
        } else if (feature.geometry.type === 'MultiPolygon') {
          centroid = getMultiPolygonCentroid(feature.geometry.coordinates);
        } else {
          return;
        }

        const geohash = latLonToGeohash(centroid.lat, centroid.lon, precision);

        if (!feature.properties) {
          feature.properties = {};
        }
        feature.properties.geohash = geohash;

        enrichedCount++;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error enriching feature:', err.message);
      }
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`Enriched ${enrichedCount} features with geohash`);
  }

  return geoJsonData;
}

/**
 * Proxy endpoint for WMS pollution data with dataset support and validation
 * Supports both WMS 1.1.1 and 1.3.0 with proper bbox axis ordering
 */
export const getPollutionWMS = async (req, res) => {
  try {
    const {
      service = 'WMS',
      request = 'GetMap',
      dataset,
      layers,
      bbox,
      width,
      height,
      format = 'image/png',
      time,
      version = '1.3.0',
      crs,
      srs
    } = req.query;

    // Validate required parameters for GetMap
    if (request === 'GetMap') {
      if (!dataset) {
        return res.status(400).json({
          error: 'Missing required parameter',
          message: 'dataset parameter is required (e.g., cmems_mod_glo_bgc_my_0.25deg_P1D-m)'
        });
      }

      if (!layers) {
        return res.status(400).json({
          error: 'Missing required parameter',
          message: 'layers parameter is required'
        });
      }

      if (!bbox) {
        return res.status(400).json({
          error: 'Missing required parameter',
          message: 'bbox parameter is required'
        });
      }

      if (!width || !height) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'width and height parameters are required'
        });
      }

      // Validate bbox format and axis ordering
      const bboxParts = bbox.split(',').map(parseFloat);
      if (bboxParts.length !== 4 || bboxParts.some(isNaN)) {
        return res.status(400).json({
          error: 'Invalid bbox format',
          message: 'bbox must be 4 comma-separated numbers'
        });
      }

      // WMS 1.3.0 uses CRS and lat,lon ordering for EPSG:4326
      // WMS 1.1.1 uses SRS and lon,lat ordering
      const coordinateSystem = crs || srs || 'EPSG:4326';
      
      if (version === '1.3.0' && coordinateSystem === 'EPSG:4326') {
        const [minLat, minLon, maxLat, maxLon] = bboxParts;
        
        if (minLat >= maxLat) {
          return res.status(400).json({
            error: 'Invalid bbox',
            message: 'For WMS 1.3.0 with EPSG:4326, bbox should be minLat,minLon,maxLat,maxLon. Ensure minLat < maxLat.'
          });
        }
        
        if (minLon >= maxLon) {
          return res.status(400).json({
            error: 'Invalid bbox',
            message: 'For WMS 1.3.0 with EPSG:4326, bbox should be minLat,minLon,maxLat,maxLon. Ensure minLon < maxLon.'
          });
        }
      } else if (version === '1.1.1') {
        const [minLon, minLat, maxLon, maxLat] = bboxParts;
        
        if (minLat >= maxLat || minLon >= maxLon) {
          return res.status(400).json({
            error: 'Invalid bbox',
            message: 'For WMS 1.1.1, bbox should be minLon,minLat,maxLon,maxLat'
          });
        }
      }
    }

    // Map friendly layer names to actual WMS layer IDs
    const layerMapping = {
      'chlorophyll': 'chl',
      'turbidity': 'atot_412',
      'suspended-matter': 'spm'
    };

    const mappedLayers = layers ? layerMapping[layers] || layers : null;

    // Build full WMS URL with dataset
    const wmsUrl = `${COPERNICUS_WMS_BASE}${dataset}`.replace(/\/+/g, '/').replace(':/', '://');

    // Build WMS request parameters
    const wmsParams = {
      service,
      request,
      version,
      format,
      transparent: true
    };

    // Use crs for WMS 1.3.0, srs for WMS 1.1.1
    if (version === '1.3.0') {
      wmsParams.crs = crs || 'EPSG:4326';
    } else {
      wmsParams.srs = srs || 'EPSG:4326';
    }

    if (mappedLayers) wmsParams.layers = mappedLayers;
    if (bbox) wmsParams.bbox = bbox;
    if (width) wmsParams.width = width;
    if (height) wmsParams.height = height;
    if (time) wmsParams.time = time;

    // Add authentication if available
    const authHeaders = {};
    if (process.env.COPERNICUS_WMS_USERNAME && process.env.COPERNICUS_WMS_PASSWORD) {
      authHeaders.Authorization = `Basic ${Buffer.from(
        `${process.env.COPERNICUS_WMS_USERNAME}:${process.env.COPERNICUS_WMS_PASSWORD}`
      ).toString('base64')}`;
    }

    const response = await axios.get(wmsUrl, {
      params: wmsParams,
      headers: authHeaders,
      timeout: 15000,
      responseType: request === 'GetMap' ? 'arraybuffer' : 'text'
    });

    // Set appropriate content type
    const contentType = request === 'GetMap' ? format : 'text/xml';
    res.set('Content-Type', contentType);
    res.send(response.data);

  } catch (error) {
    console.error('Error fetching WMS data:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch WMS pollution data',
      message: error.message
    });
  }
};

/**
 * Get OpenWeatherMap tile layer configuration
 */
export const getWeatherTileInfo = async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    console.log(apiKey);
    if (!apiKey) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'OpenWeatherMap API key not configured'
      });
    }

    const tileConfig = {
      baseUrl: 'https://tile.openweathermap.org/map',
      apiKey,
      layers: {
        precipitation: {
          id: 'precipitation_new',
          name: 'Precipitation',
          url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`
        },
        clouds: {
          id: 'clouds_new',
          name: 'Cloud Cover',
          url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`
        },
        temperature: {
          id: 'temp_new',
          name: 'Temperature',
          url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`
        },
        wind: {
          id: 'wind_new',
          name: 'Wind Speed',
          url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`
        }
      },
      attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
    };

    res.json(tileConfig);

  } catch (error) {
    console.error('Error fetching weather tile config:', error.message);
    res.status(500).json({
      error: 'Failed to fetch weather tile configuration',
      message: error.message
    });
  }
};
