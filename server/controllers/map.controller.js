import axios from 'axios';
import { geohashToWKT, isValidGeohash, latLonToGeohash, getPolygonCentroid, getMultiPolygonCentroid } from '../utils/geohash.js';

// OBIS API base URL
const OBIS_API_BASE = 'https://api.obis.org/v3';

// Open-Meteo Marine Weather API base URL
const OPEN_METEO_MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

let countryMap = null;

async function loadCountryMap() {
  if (!countryMap) {
    const resp = await axios.get(`${OBIS_API_BASE}/country`);
    countryMap = resp.data.results.reduce((map, c) => {
      map[c.country.toLowerCase()] = c.id;
      return map;
    }, {});
  }
  return countryMap;
}

/**
 * Get species occurrences from OBIS
 * Proxies requests to avoid CORS issues and enable caching
 */
export const getOBISOccurrences = async (req, res) => {
  try {
    const { scientificname, countryid, country, startdepth, enddepth, size = 500, offset = 0 } = req.query;
    const params = { size, offset };

    if (scientificname) params.scientificname = scientificname;

    // Handle country filtering - countryid takes precedence
    if (countryid) {
      params.areaid = countryid;
    } else if (country) {
      // Translate country name to areaid
      const map = await loadCountryMap();
      const areaid = map[country.toLowerCase()];
      if (!areaid) {
        return res.status(400).json({ error: `Unknown country: ${country}` });
      }
    //   console.log(`Country "${country}" mapped to areaid: ${areaid}`);
      params.areaid = areaid;
    }

    if (startdepth) params.startdepth = startdepth;
    if (enddepth) params.enddepth = enddepth;

    const response = await axios.get(`${OBIS_API_BASE}/occurrence`, {
      params,
      timeout: 30000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching OBIS data:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch species occurrence data',
      message: error.message
    });
  }
};

/**
 * Get species occurrences for a specific grid cell by geohash
 * Returns detailed occurrence data for a grid cell
 */
export const getOBISCellOccurrences = async (req, res) => {
  try {
    const { geohash } = req.params;
    const { size = 100, offset = 0, scientificname, startdepth, enddepth } = req.query;

    if (!geohash) {
      return res.status(400).json({
        error: 'Missing geohash parameter',
        message: 'Geohash is required to fetch cell occurrences'
      });
    }

    // Validate geohash format
    if (!isValidGeohash(geohash)) {
      return res.status(400).json({
        error: 'Invalid geohash format',
        message: 'Geohash must be 1-12 characters using base32 encoding (0-9, b-z except a, i, l, o)'
      });
    }

    // Convert geohash to WKT polygon
    const wktPolygon = geohashToWKT(geohash);

    const params = {
      geometry: wktPolygon,
      size,
      offset
    };

    // Add optional filters if provided
    if (scientificname) params.scientificname = scientificname;
    if (startdepth) params.startdepth = startdepth;
    if (enddepth) params.enddepth = enddepth;

    // console.log(`Fetching OBIS occurrences for geohash: ${geohash} (WKT: ${wktPolygon}) with params:`, params);

    const response = await axios.get(`${OBIS_API_BASE}/occurrence`, {
      params,
      timeout: 30000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching OBIS cell occurrences:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch grid cell occurrence data',
      message: error.message
    });
  }
};

/**
 * Get species occurrence grid from OBIS
 * Returns aggregated GeoJSON grid cells for heatmap visualization
 */
export const getOBISGrid = async (req, res) => {
  try {
    const { precision } = req.params;
    const { scientificname, countryid, country, startdepth, enddepth, startdate, enddate } = req.query;

    // Validate precision
    const precisionNum = parseInt(precision);
    if (isNaN(precisionNum) || precisionNum < 1 || precisionNum > 12) {
      return res.status(400).json({
        error: 'Invalid precision',
        message: 'Precision must be between 1 and 12'
      });
    }

    const params = {};

    if (scientificname) params.scientificname = scientificname;

    // Handle country filtering - countryid takes precedence
    if (countryid) {
      params.countryid = countryid;
      console.log(`Using direct countryid: ${countryid}`);
    } else if (country) {
      // Translate country name to MRGID and send as countryid (not areaid)
      const map = await loadCountryMap();
      const mrgid = map[country.toLowerCase()];
      if (!mrgid) {
        return res.status(400).json({ error: `Unknown country: ${country}` });
      }
      console.log(`Country "${country}" mapped to MRGID: ${mrgid}, sending as countryid for grid endpoint`);
      params.countryid = mrgid;
    }

    if (startdepth) params.startdepth = startdepth;
    if (enddepth) params.enddepth = enddepth;
    if (startdate) params.startdate = startdate;
    if (enddate) params.enddate = enddate;

    console.log(`Fetching OBIS grid at precision ${precision} with params:`, params);

    // Make request to OBIS grid API
    const response = await axios.get(`${OBIS_API_BASE}/occurrence/grid/${precision}`, {
      params,
      timeout: 30000 // 30 second timeout
    });

    // Enrich features with computed geohash values
    let enrichedCount = 0;
    let errorCount = 0;
    
    if (response.data && response.data.features && Array.isArray(response.data.features)) {
      response.data.features.forEach(feature => {
        try {
          if (feature.geometry && feature.geometry.coordinates) {
            let centroid;
            
            // Handle both Polygon and MultiPolygon geometries
            if (feature.geometry.type === 'Polygon') {
              centroid = getPolygonCentroid(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiPolygon') {
              centroid = getMultiPolygonCentroid(feature.geometry.coordinates);
            } else {
              // Skip unsupported geometry types
              console.warn(`Skipping unsupported geometry type: ${feature.geometry.type}`);
              return;
            }
            
            // Encode centroid as geohash at requested precision
            const geohash = latLonToGeohash(centroid.lat, centroid.lon, precisionNum);
            
            // Add geohash to feature properties
            if (!feature.properties) {
              feature.properties = {};
            }
            feature.properties.geohash = geohash;
            
            enrichedCount++;
          }
        } catch (err) {
          console.error('Error enriching feature with geohash:', err.message);
          errorCount++;
        }
      });
      
      console.log(`Enriched ${enrichedCount} features with geohash, ${errorCount} errors`);
    }

    // Return enriched GeoJSON FeatureCollection
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching OBIS grid data:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch species grid data',
      message: error.message
    });
  }
};

/**
 * Get marine weather data from Open-Meteo
 * Includes SST, currents, wind, and wave data
 */
export const getMarineWeather = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      layer // Optional: specific layer (sst, currents, wind, waves)
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    // Define all marine variables to fetch
    const allMarineVariables = [
      'wave_height',
      'wave_direction',
      'wave_period',
      'ocean_current_velocity',
      'ocean_current_direction',
      'wind_speed_10m',
      'wind_direction_10m'
    ];

    // Add SST from hourly variables (Open-Meteo Marine API)
    const allVariables = [...allMarineVariables, 'sea_surface_temperature'];

    // Filter by layer if specified
    let variablesToFetch = allVariables;
    if (layer) {
      const layerMap = {
        sst: ['sea_surface_temperature'],
        currents: ['ocean_current_velocity', 'ocean_current_direction'],
        wind: ['wind_speed_10m', 'wind_direction_10m'],
        waves: ['wave_height', 'wave_direction', 'wave_period']
      };
      variablesToFetch = layerMap[layer] || allVariables;
    }

    const params = {
      latitude,
      longitude,
      hourly: variablesToFetch.join(','),
      timezone: 'auto'
    };

    // Make request to Open-Meteo Marine API
    const response = await axios.get(OPEN_METEO_MARINE_BASE, {
      params,
      timeout: 15000 // 15 second timeout
    });

    // Process and structure the response
    const data = response.data;
    const processedData = {
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone
      },
      current: {
        time: data.hourly?.time?.[0],
        sst: data.hourly?.sea_surface_temperature?.[0],
        waveHeight: data.hourly?.wave_height?.[0],
        waveDirection: data.hourly?.wave_direction?.[0],
        wavePeriod: data.hourly?.wave_period?.[0],
        currentVelocity: data.hourly?.ocean_current_velocity?.[0],
        currentDirection: data.hourly?.ocean_current_direction?.[0],
        windSpeed: data.hourly?.wind_speed_10m?.[0],
        windDirection: data.hourly?.wind_direction_10m?.[0]
      },
      hourly: data.hourly,
      layer: layer || 'all'
    };

    res.json(processedData);
  } catch (error) {
    console.error('Error fetching marine weather data:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch marine weather data',
      message: error.message
    });
  }
};

/**
 * Get taxonomy data from WoRMS (World Register of Marine Species)
 * For future integration with taxonomic classification
 */
export const getWoRMSTaxonomy = async (req, res) => {
  try {
    const { scientificname } = req.query;

    if (!scientificname) {
      return res.status(400).json({
        error: 'Scientific name is required'
      });
    }

    // WoRMS API endpoint
    const response = await axios.get(
      `https://www.marinespecies.org/rest/AphiaRecordsByName/${encodeURIComponent(scientificname)}`,
      {
        params: { like: true, marine_only: true },
        timeout: 10000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching WoRMS data:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch taxonomy data',
      message: error.message
    });
  }
};

/**
 * Get species images from Unsplash API
 * Searches for marine species images based on scientific name
 * 
 * Alternative: If Unsplash API key is not available, this can be modified to use Pexels API
 * Pexels API endpoint: https://api.pexels.com/v1/search
 * Header: Authorization: YOUR_PEXELS_API_KEY
 */
export const getSpeciesImages = async (req, res) => {
  try {
    const { scientificname } = req.query;

    // Validate that scientificname is provided
    if (!scientificname) {
      return res.status(400).json({
        error: 'Scientific name is required',
        message: 'Please provide a scientificname query parameter'
      });
    }

    // Check if Unsplash API key is configured
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return res.status(500).json({
        error: 'Unsplash API key not configured',
        message: 'Please add UNSPLASH_ACCESS_KEY to environment variables'
      });
    }

    // Build search query - add "marine species" for better results
    const searchQuery = `${scientificname} marine species`;

    console.log(`Searching Unsplash for: ${searchQuery}`);

    // Make request to Unsplash API
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: searchQuery,
        per_page: 20,
        orientation: 'landscape'
      },
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      },
      timeout: 15000
    });

    // Process the response to extract relevant image data
    const images = response.data.results.map(image => ({
      id: image.id,
      url: image.urls.regular,
      thumb: image.urls.thumb,
      alt: image.alt_description || scientificname,
      photographer: image.user.name,
      photographerProfile: image.user.links.html,
      imagePage: image.links.html
    }));

    // Return structured response
    res.json({
      query: scientificname,
      total: response.data.total,
      images: images
    });

  } catch (error) {
    console.error('Error fetching species images:', error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Unsplash API key'
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Rate limit exceeded',
        message: 'Unsplash API rate limit reached. Please try again later.'
      });
    }

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch species images',
      message: error.message
    });
  }
};
