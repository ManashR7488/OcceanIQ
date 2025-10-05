import axios from 'axios';
import User from '../models/User.model.js';

// Open-Meteo Marine API base URL
const OPEN_METEO_MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

/**
 * Get dashboard statistics
 * Returns total species, observations, data sources, and total users
 */
export const getStats = async (req, res) => {
  try {
    // Count total registered users from database
    const totalUsers = await User.countDocuments();

    // Return statistics
    // Note: totalSpecies and totalObservations are representative numbers
    // In future, these can be computed from OBIS API
    const stats = {
      totalSpecies: 10247,        // Representative number
      totalObservations: 156823,  // Representative number
      dataSources: 4,             // OBIS, Open-Meteo, WoRMS, iNaturalist
      totalUsers: totalUsers      // Total registered users
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    });
  }
};

/**
 * Get oceanographic trends data for charts
 * Fetches real-time data from Open-Meteo Marine API
 */
export const getOceanographicTrends = async (req, res) => {
  try {
    // Get query parameters with defaults
    let days = parseInt(req.query.days) || 7;
    let latitude = parseFloat(req.query.latitude) || 55.0;
    let longitude = parseFloat(req.query.longitude) || 4.0;

    // Validate and clamp parameters
    if (isNaN(days) || days < 1 || days > 14) {
      return res.status(400).json({
        error: 'Invalid parameter',
        details: 'days must be between 1 and 14'
      });
    }

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Invalid parameter',
        details: 'latitude must be between -90 and 90'
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid parameter',
        details: 'longitude must be between -180 and 180'
      });
    }

    if (process.env.NODE_ENV === 'development') {
    //   console.log(`Fetching oceanographic trends for lat: ${latitude}, lon: ${longitude}, days: ${days}`);
    }

    try {
      // Make request to Open-Meteo Marine API
      const response = await axios.get(OPEN_METEO_MARINE_BASE, {
        params: {
          latitude: latitude,
          longitude: longitude,
          hourly: 'wave_height,wave_direction,wave_period,sea_surface_temperature',
          past_days: days,
          timezone: 'auto'
        },
        timeout: 10000
      });

    //   console.log(response.data);
      // Extract data from response
      const hourlyData = response.data.hourly;
      let timestamps = hourlyData.time || [];
      let temperature = hourlyData.sea_surface_temperature || [];

      // Generate demo data for parameters not available from Open-Meteo
      // These would be replaced with real API calls in production
      const dataLength = timestamps.length;
      
      // Generate synthetic salinity data (typical ocean range: 33-37 PSU)
      let salinity = Array.from({ length: dataLength }, (_, i) => 
        35 + Math.sin(i / 24) * 1.5 + (Math.random() - 0.5) * 0.3
      );

      // Generate synthetic pH data (typical ocean range: 7.9-8.2)
      let ph = Array.from({ length: dataLength }, (_, i) => 
        8.05 + Math.cos(i / 24) * 0.1 + (Math.random() - 0.5) * 0.05
      );

      // Generate synthetic dissolved oxygen data (typical range: 6-9 mg/L)
      let dissolvedOxygen = Array.from({ length: dataLength }, (_, i) => 
        7.5 + Math.sin(i / 12) * 1 + (Math.random() - 0.5) * 0.4
      );

      // Align all arrays to the same length to prevent undefined chart values
      const n = Math.min(
        timestamps.length,
        temperature.length,
        salinity.length,
        ph.length,
        dissolvedOxygen.length
      );

      timestamps = timestamps.slice(0, n);
      temperature = temperature.slice(0, n);
      salinity = salinity.slice(0, n);
      ph = ph.slice(0, n);
      dissolvedOxygen = dissolvedOxygen.slice(0, n);

      // Return structured response
      res.json({
        timestamps: timestamps,
        temperature: temperature,
        salinity: salinity.map(val => parseFloat(val.toFixed(2))),
        ph: ph.map(val => parseFloat(val.toFixed(3))),
        dissolvedOxygen: dissolvedOxygen.map(val => parseFloat(val.toFixed(2)))
      });

    } catch (apiError) {
      // If Open-Meteo API fails, return demo data
      if (process.env.NODE_ENV === 'development') {
        console.warn('Open-Meteo API failed, returning demo data:', apiError.message);
      }
      
      // Generate demo data for the specified days with hourly intervals
      const now = new Date();
      let timestamps = [];
      let temperature = [];
      let salinity = [];
      let ph = [];
      let dissolvedOxygen = [];

      for (let i = days * 24; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 60 * 60 * 1000);
        timestamps.push(date.toISOString());
        
        // Generate synthetic oceanographic data
        const hourOfDay = i % 24;
        temperature.push(parseFloat((25 + Math.sin(i / 24) * 3 + (Math.random() - 0.5)).toFixed(2)));
        salinity.push(parseFloat((35 + Math.sin(i / 24) * 1.5 + (Math.random() - 0.5) * 0.3).toFixed(2)));
        ph.push(parseFloat((8.05 + Math.cos(i / 24) * 0.1 + (Math.random() - 0.5) * 0.05).toFixed(3)));
        dissolvedOxygen.push(parseFloat((7.5 + Math.sin(i / 12) * 1 + (Math.random() - 0.5) * 0.4).toFixed(2)));
      }

      // Align all arrays to consistent length
      const n = Math.min(
        timestamps.length,
        temperature.length,
        salinity.length,
        ph.length,
        dissolvedOxygen.length
      );

      res.json({
        timestamps: timestamps.slice(0, n),
        temperature: temperature.slice(0, n),
        salinity: salinity.slice(0, n),
        ph: ph.slice(0, n),
        dissolvedOxygen: dissolvedOxygen.slice(0, n)
      });
    }

  } catch (error) {
    console.error('Error fetching oceanographic trends:', error.message);
    res.status(500).json({
      error: 'Failed to fetch oceanographic trends',
      message: error.message
    });
  }
};

/**
 * Get biodiversity heatmap data
 * Proxies to OBIS grid endpoint with temporal filtering
 */
export const getBiodiversityHeatmap = async (req, res) => {
  try {
    // Get query parameters with defaults
    const precision = parseInt(req.query.precision) || 4;
    const { scientificname, startdate, enddate, startdepth, enddepth } = req.query;

    // Validate precision
    if (isNaN(precision) || precision < 1 || precision > 12) {
      return res.status(400).json({
        error: 'Invalid precision',
        message: 'Precision must be between 1 and 12'
      });
    }

    // Validate date formats if provided (ISO 8601)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (startdate && !isoDatePattern.test(startdate)) {
      return res.status(400).json({
        error: 'Invalid start date format',
        message: 'Start date must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }
    if (enddate && !isoDatePattern.test(enddate)) {
      return res.status(400).json({
        error: 'Invalid end date format',
        message: 'End date must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }

    // Build params for OBIS API
    const params = {};
    if (scientificname) params.scientificname = scientificname;
    if (startdate) params.startdate = startdate;
    if (enddate) params.enddate = enddate;
    if (startdepth) params.startdepth = startdepth;
    if (enddepth) params.enddepth = enddepth;

    const OBIS_API_BASE = 'https://api.obis.org/v3';

    // Make request to OBIS grid API
    const response = await axios.get(
      `${OBIS_API_BASE}/occurrence/grid/${precision}`,
      {
        params,
        timeout: 30000
      }
    );

    // Enrich features with geohash (reuse logic from map.controller.js)
    const { latLonToGeohash, getPolygonCentroid, getMultiPolygonCentroid } = await import('../utils/geohash.js');
    
    let enrichedCount = 0;
    let errorCount = 0;

    if (response.data?.features && Array.isArray(response.data.features)) {
      response.data.features.forEach((feature) => {
        try {
          if (feature.geometry?.coordinates) {
            let centroid;

            // Handle both Polygon and MultiPolygon geometries
            if (feature.geometry.type === 'Polygon') {
              centroid = getPolygonCentroid(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiPolygon') {
              centroid = getMultiPolygonCentroid(feature.geometry.coordinates);
            } else {
              return;
            }

            // Encode centroid as geohash
            const geohash = latLonToGeohash(centroid.lat, centroid.lon, precision);

            // Add geohash to feature properties
            if (!feature.properties) {
              feature.properties = {};
            }
            feature.properties.geohash = geohash;

            enrichedCount++;
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error enriching feature with geohash:', err.message);
          }
          errorCount++;
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Enriched ${enrichedCount} features with geohash, ${errorCount} errors`);
      }
    }

    // Return enriched GeoJSON FeatureCollection
    res.json(response.data);

  } catch (error) {
    console.error('Error fetching biodiversity heatmap:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch biodiversity heatmap data',
      message: error.message
    });
  }
};

/**
 * Get time-series data for biodiversity trends
 * Aggregates OBIS data into time buckets for visualization
 */
export const getTimeSeriesData = async (req, res) => {
  try {
    const { scientificname, startdate, enddate, interval = 'month', startdepth, enddepth } = req.query;

    // Validate date range (max 2 years)
    if (startdate && enddate) {
      const start = new Date(startdate);
      const end = new Date(enddate);
      const diffYears = (end - start) / (1000 * 60 * 60 * 24 * 365);
      
      if (diffYears > 2) {
        return res.status(400).json({
          error: 'Date range too large',
          message: 'Maximum date range is 2 years'
        });
      }
    }

    // Validate interval
    const validIntervals = ['day', 'week', 'month', 'year'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval',
        message: `Interval must be one of: ${validIntervals.join(', ')}`
      });
    }

    const OBIS_API_BASE = 'https://api.obis.org/v3';
    const now = new Date();
    const start = startdate ? new Date(startdate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = enddate ? new Date(enddate) : now;

    // Calculate time buckets
    const diffMs = end - start;
    let bucketCount;
    let bucketSize;

    switch (interval) {
      case 'day':
        bucketCount = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        bucketSize = 1000 * 60 * 60 * 24;
        break;
      case 'week':
        bucketCount = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
        bucketSize = 1000 * 60 * 60 * 24 * 7;
        break;
      case 'month':
        bucketCount = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
        bucketSize = 1000 * 60 * 60 * 24 * 30;
        break;
      case 'year':
        bucketCount = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 365));
        bucketSize = 1000 * 60 * 60 * 24 * 365;
        break;
    }

    // Cap bucket count to prevent excessive API calls
    const maxBuckets = 50;
    bucketCount = Math.min(bucketCount, maxBuckets);

    try {
      // Attempt to fetch real OBIS data for each bucket
      const timeSeries = [];
      const allSpecies = new Map(); // Track all species across buckets
      const depthData = [];
      const seasonalData = Array(12).fill(0).map((_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        occurrenceCount: 0,
        count: 0
      }));

      // Fetch data for each time bucket
      for (let i = 0; i < bucketCount; i++) {
        const bucketStart = new Date(start.getTime() + i * bucketSize);
        const bucketEnd = new Date(Math.min(bucketStart.getTime() + bucketSize, end.getTime()));
        
        const params = {
          startdate: bucketStart.toISOString().split('T')[0],
          enddate: bucketEnd.toISOString().split('T')[0],
          size: 1000, // Limit per bucket
          offset: 0
        };

        if (scientificname) params.scientificname = scientificname;
        if (startdepth) params.startdepth = startdepth;
        if (enddepth) params.enddepth = enddepth;

        try {
          const response = await axios.get(`${OBIS_API_BASE}/occurrence`, {
            params,
            timeout: 10000 // 10 second timeout per bucket
          });

          const results = response.data.results || [];
          const uniqueSpecies = new Set();
          const depths = [];

          results.forEach(record => {
            if (record.scientificName) {
              uniqueSpecies.add(record.scientificName);
              
              // Track species count globally
              const currentCount = allSpecies.get(record.scientificName) || 0;
              allSpecies.set(record.scientificName, currentCount + 1);
            }
            
            if (record.depth != null) {
              depths.push(record.depth);
            }
          });

          const occurrenceCount = results.length;
          const speciesCount = uniqueSpecies.size;
          const avgDepth = depths.length > 0 
            ? parseFloat((depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1))
            : 0;
          const minDepth = depths.length > 0 ? Math.min(...depths) : 0;
          const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;

          timeSeries.push({
            date: bucketStart.toISOString().split('T')[0],
            occurrenceCount,
            speciesCount,
            avgDepth,
            minDepth,
            maxDepth
          });

          // Aggregate seasonal data
          const monthIndex = bucketStart.getMonth();
          seasonalData[monthIndex].occurrenceCount += occurrenceCount;
          seasonalData[monthIndex].count++;

          // Collect depth data
          depths.forEach(depth => depthData.push(depth));

        } catch (bucketError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Bucket ${i} failed:`, bucketError.message);
          }
          
          // Add empty bucket on failure
          timeSeries.push({
            date: bucketStart.toISOString().split('T')[0],
            occurrenceCount: 0,
            speciesCount: 0,
            avgDepth: 0,
            minDepth: 0,
            maxDepth: 0
          });
        }
      }

      // Calculate depth distribution from collected depths
      const depthRanges = [
        { label: '0-50m', min: 0, max: 50 },
        { label: '50-100m', min: 50, max: 100 },
        { label: '100-200m', min: 100, max: 200 },
        { label: '200-500m', min: 200, max: 500 },
        { label: '500-1000m', min: 500, max: 1000 },
        { label: '1000+m', min: 1000, max: Infinity }
      ];

      const depthDistribution = depthRanges.map(range => ({
        depthRange: range.label,
        count: depthData.filter(d => d >= range.min && d < range.max).length
      }));

      // Average seasonal patterns
      const seasonalPatterns = seasonalData.map(data => ({
        month: data.month,
        occurrenceCount: data.count > 0 
          ? Math.floor(data.occurrenceCount / data.count) 
          : 0
      }));

      // Sort species by count and get top 10
      const topSpecies = Array.from(allSpecies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([scientificName, count]) => ({
          scientificName,
          count
        }));

      res.json({
        timeSeries,
        depthDistribution,
        seasonalPatterns,
        topSpecies
      });

    } catch (apiError) {
      // Fallback to synthetic data on OBIS failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('OBIS API failed, using synthetic data:', apiError.message);
      }

      const timeSeries = [];
      const seasonalPatterns = Array(12).fill(0).map((_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        occurrenceCount: 0
      }));

      // Generate synthetic time-series data
      for (let i = 0; i < Math.min(bucketCount, 50); i++) {
        const bucketDate = new Date(start.getTime() + i * bucketSize);
        const occurrenceCount = Math.floor(500 + Math.random() * 1000 + Math.sin(i / 5) * 300);
        const speciesCount = Math.floor(50 + Math.random() * 100 + Math.sin(i / 3) * 20);
        
        timeSeries.push({
          date: bucketDate.toISOString().split('T')[0],
          occurrenceCount,
          speciesCount,
          avgDepth: parseFloat((50 + Math.random() * 150).toFixed(1)),
          minDepth: parseFloat((5 + Math.random() * 20).toFixed(1)),
          maxDepth: parseFloat((200 + Math.random() * 300).toFixed(1))
        });

        const monthIndex = bucketDate.getMonth();
        seasonalPatterns[monthIndex].occurrenceCount += occurrenceCount;
      }

      const depthRanges = ['0-50m', '50-100m', '100-200m', '200-500m', '500-1000m', '1000+m'];
      const depthDistribution = depthRanges.map((range, i) => ({
        depthRange: range,
        count: Math.floor(1000 + Math.random() * 3000 - i * 200)
      }));

      const speciesNames = [
        'Thunnus albacares', 'Katsuwonus pelamis', 'Auxis thazard',
        'Scomber scombrus', 'Clupea harengus', 'Engraulis encrasicolus',
        'Sardinella longiceps', 'Decapterus russelli', 'Rastrelliger kanagurta',
        'Scomberomorus commerson'
      ];

      const topSpecies = speciesNames.map((name, i) => ({
        scientificName: name,
        count: Math.floor(5000 - i * 400 + Math.random() * 200)
      }));

      seasonalPatterns.forEach(pattern => {
        pattern.occurrenceCount = Math.floor(pattern.occurrenceCount / Math.max(1, bucketCount / 12));
      });

      res.json({
        timeSeries,
        depthDistribution,
        seasonalPatterns,
        topSpecies
      });
    }

  } catch (error) {
    console.error('Error fetching time-series data:', error.message);
    res.status(500).json({
      error: 'Failed to fetch time-series data',
      message: error.message
    });
  }
};

/**
 * Get bathymetry data for 3D ocean depth visualization
 * Generates synthetic bathymetry data (can be replaced with real GEBCO API)
 */
export const getBathymetry = async (req, res) => {
  try {
    // Get query parameters with defaults
    const latitude = parseFloat(req.query.latitude) || 20.0;
    const longitude = parseFloat(req.query.longitude) || 70.0;
    let resolution = parseInt(req.query.resolution) || 50;
    let extent = parseFloat(req.query.extent) || 10;

    // Validate parameters
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'Longitude must be between -180 and 180'
      });
    }

    if (isNaN(resolution) || resolution < 10 || resolution > 100) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'Resolution must be between 10 and 100'
      });
    }

    if (isNaN(extent) || extent < 1 || extent > 50) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'Extent must be between 1 and 50'
      });
    }

    // Generate synthetic bathymetry data
    // TODO: Replace with real GEBCO API or other bathymetry data source
    const grid = [];
    let minDepth = 0;
    let maxDepth = -10000;

    // Generate grid of depth values
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const lat = latitude + (i / (resolution - 1) - 0.5) * extent;
        const lon = longitude + (j / (resolution - 1) - 0.5) * extent;

        // Generate realistic-looking bathymetry using multiple sine waves
        // Base depth varies with latitude (deeper at higher latitudes)
        const baseDepth = -2000 - Math.abs(lat - latitude) * 200;

        // Add ridge-like features using sine/cosine
        const ridge1 = Math.sin(lat * 0.5) * 500;
        const ridge2 = Math.cos(lon * 0.3) * 300;

        // Add some random variation (Perlin-like noise)
        const noise1 = Math.sin(lat * 2.5 + lon * 1.3) * 200;
        const noise2 = Math.cos(lat * 1.7 + lon * 2.2) * 150;

        // Continental shelf effect (shallower near center)
        const distanceFromCenter = Math.sqrt(
          Math.pow(lat - latitude, 2) + Math.pow(lon - longitude, 2)
        );
        const shelfEffect = Math.max(0, (extent / 2 - distanceFromCenter) * 100);

        // Combine all components
        let depth = baseDepth + ridge1 + ridge2 + noise1 + noise2 + shelfEffect;

        // Add random variation
        depth += (Math.random() - 0.5) * 500;

        // Clamp depth to reasonable ocean values
        depth = Math.max(-6000, Math.min(-500, depth));

        grid.push({
          lat: parseFloat(lat.toFixed(6)),
          lon: parseFloat(lon.toFixed(6)),
          depth: parseFloat(depth.toFixed(2))
        });

        // Track min/max for metadata
        minDepth = Math.min(minDepth, depth);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    // Return bathymetry data with metadata
    res.json({
      metadata: {
        centerLatitude: latitude,
        centerLongitude: longitude,
        resolution: resolution,
        extent: extent,
        minDepth: parseFloat(minDepth.toFixed(2)),
        maxDepth: parseFloat(maxDepth.toFixed(2)),
        dataPoints: grid.length,
        source: 'Synthetic (Replace with GEBCO API)',
        units: 'meters'
      },
      grid: grid
    });
  } catch (error) {
    console.error('Error generating bathymetry data:', error.message);
    res.status(500).json({
      error: 'Failed to generate bathymetry data',
      message: error.message
    });
  }
};

/**
 * Get ecosystem health metrics
 * Calculates composite health score, trends, and generates alerts
 */
export const getEcosystemHealth = async (req, res) => {
  try {
    // Get query parameters with defaults
    const latitude = parseFloat(req.query.latitude) || 0.0;
    const longitude = parseFloat(req.query.longitude) || 0.0;
    const radius = parseFloat(req.query.radius) || 500; // km

    // Fetch OBIS data for the region
    let speciesData = [];
    let observationCount = 0;
    let depthRange = { min: 0, max: 0 };
    let temperatureData = [];
    
    try {
      // Try to fetch real OBIS data
      const obisUrl = `https://api.obis.org/v3/occurrence?geometry=POINT(${longitude} ${latitude})&size=1000`;
      const obisResponse = await axios.get(obisUrl, { timeout: 5000 });
      
      if (obisResponse.data && obisResponse.data.results) {
        const results = obisResponse.data.results;
        observationCount = results.length;
        
        // Extract species for diversity calculation
        const speciesSet = new Set();
        const depthValues = [];
        const tempValues = [];
        
        results.forEach(record => {
          if (record.scientificName) speciesSet.add(record.scientificName);
          if (record.depth) depthValues.push(Math.abs(record.depth));
          if (record.temperature) tempValues.push(record.temperature);
        });
        
        speciesData = Array.from(speciesSet);
        temperatureData = tempValues;
        
        if (depthValues.length > 0) {
          depthRange.min = Math.min(...depthValues);
          depthRange.max = Math.max(...depthValues);
        }
      }
    } catch (obisError) {
      console.log('OBIS API unavailable, using synthetic data');
    }
    
    // Fallback to synthetic data if OBIS fails or returns no data
    if (speciesData.length === 0) {
      speciesData = Array.from({ length: 45 + Math.floor(Math.random() * 30) }, (_, i) => `Species_${i + 1}`);
      observationCount = 500 + Math.floor(Math.random() * 500);
      depthRange = { min: 10, max: 2500 };
      temperatureData = Array.from({ length: 50 }, () => 15 + Math.random() * 12);
    }

    // Calculate Species Diversity Index (Shannon Index)
    const speciesCount = speciesData.length;
    const shannonIndex = Math.log(speciesCount) * 0.85 + Math.random() * 0.3; // Simplified Shannon Index
    const maxShannon = Math.log(100); // Max possible for normalization
    const speciesDiversityIndex = Math.min(100, (shannonIndex / maxShannon) * 100);

    // Calculate Water Quality Index
    const avgTemperature = temperatureData.length > 0 
      ? temperatureData.reduce((a, b) => a + b, 0) / temperatureData.length 
      : 18;
    
    // Synthetic water quality parameters
    const pH = 7.9 + Math.random() * 0.4;
    const dissolvedOxygen = 6.5 + Math.random() * 2.5;
    const salinity = 33 + Math.random() * 4;
    
    // Water quality scoring (0-100)
    let waterQualityScore = 100;
    if (pH < 7.9 || pH > 8.2) waterQualityScore -= 20;
    if (dissolvedOxygen < 6) waterQualityScore -= 30;
    if (Math.abs(avgTemperature - 18) > 5) waterQualityScore -= 15;
    waterQualityScore = Math.max(0, waterQualityScore + (Math.random() * 10 - 5));

    // Calculate Habitat Integrity
    const observationDensity = observationCount / (Math.PI * radius * radius); // per km²
    const depthCoverage = (depthRange.max - depthRange.min) / 4000 * 100; // normalized to 4000m max depth
    const habitatIntegrity = Math.min(100, (observationDensity * 50 + depthCoverage * 0.5));

    // Calculate overall health score (weighted average)
    const overallHealthScore = Math.round(
      speciesDiversityIndex * 0.4 + 
      waterQualityScore * 0.35 + 
      habitatIntegrity * 0.25
    );

    // Calculate trend (compare with simulated previous period)
    const previousScore = overallHealthScore - (Math.random() * 10 - 5);
    const scoreDiff = overallHealthScore - previousScore;
    let trend = 'stable';
    if (scoreDiff > 3) trend = 'improving';
    else if (scoreDiff < -3) trend = 'declining';
    const trendPercentage = previousScore > 0 ? ((scoreDiff / previousScore) * 100).toFixed(1) : 0;

    // Generate alerts
    const alerts = [];
    
    // Species decline alert
    if (speciesCount < 30) {
      alerts.push({
        type: 'Species Decline',
        severity: 'critical',
        message: `Low species count detected (${speciesCount} species). Indicates potential ecosystem stress.`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Temperature spike alert
    if (Math.abs(avgTemperature - 18) > 4) {
      alerts.push({
        type: 'Temperature Anomaly',
        severity: 'warning',
        message: `Temperature deviation detected: ${avgTemperature.toFixed(1)}°C (expected ~18°C)`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Dissolved oxygen alert
    if (dissolvedOxygen < 6) {
      alerts.push({
        type: 'Low Oxygen',
        severity: 'critical',
        message: `Dissolved oxygen below threshold: ${dissolvedOxygen.toFixed(1)} mg/L (minimum: 6 mg/L)`,
        timestamp: new Date().toISOString()
      });
    }
    
    // pH anomaly alert
    if (pH < 7.9 || pH > 8.2) {
      alerts.push({
        type: 'pH Anomaly',
        severity: 'warning',
        message: `pH outside normal range: ${pH.toFixed(2)} (normal: 7.9-8.2)`,
        timestamp: new Date().toISOString()
      });
    }

    // Habitat integrity alert
    if (habitatIntegrity < 40) {
      alerts.push({
        type: 'Habitat Degradation',
        severity: 'warning',
        message: `Low habitat integrity score: ${habitatIntegrity.toFixed(0)}/100`,
        timestamp: new Date().toISOString()
      });
    }

    // Return health data
    res.json({
      overallHealthScore,
      trend,
      trendPercentage: parseFloat(trendPercentage),
      metrics: {
        speciesDiversityIndex: parseFloat(speciesDiversityIndex.toFixed(1)),
        waterQualityIndex: parseFloat(waterQualityScore.toFixed(1)),
        habitatIntegrity: parseFloat(habitatIntegrity.toFixed(1))
      },
      details: {
        speciesCount,
        observationCount,
        avgTemperature: parseFloat(avgTemperature.toFixed(1)),
        pH: parseFloat(pH.toFixed(2)),
        dissolvedOxygen: parseFloat(dissolvedOxygen.toFixed(1)),
        salinity: parseFloat(salinity.toFixed(1)),
        depthRange
      },
      alerts,
      timestamp: new Date().toISOString(),
      region: { latitude, longitude, radius }
    });
  } catch (error) {
    console.error('Error fetching ecosystem health:', error.message);
    res.status(500).json({
      error: 'Failed to fetch ecosystem health data',
      message: error.message
    });
  }
};

/**
 * Get comparative analysis data
 * Compares health metrics across regions, time periods, or species
 */
export const getCompareData = async (req, res) => {
  try {
    const { type, entities } = req.query;
    
    // Validate parameters
    if (!type || !entities) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'Both type and entities parameters are required'
      });
    }

    const validTypes = ['region', 'timeperiod', 'species'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be one of: region, timeperiod, species'
      });
    }

    const entityList = entities.split(',').map(e => e.trim()).filter(e => e);
    if (entityList.length < 2) {
      return res.status(400).json({
        error: 'Invalid entities',
        message: 'At least 2 entities are required for comparison'
      });
    }

    // Calculate health metrics for each entity
    const comparisonResults = [];

    for (const entity of entityList) {
      let healthData = {};
      
      if (type === 'region') {
        // Parse lat,lon from entity (e.g., "20.0,70.0")
        const coords = entity.split(',');
        if (coords.length !== 2) {
          return res.status(400).json({
            error: 'Invalid region format',
            message: `Region entity must be "lat,lon" format. Invalid: ${entity}`
          });
        }
        
        const lat = parseFloat(coords[0]);
        const lon = parseFloat(coords[1]);
        
        // Validate lat/lon are numbers and in valid ranges
        if (isNaN(lat) || isNaN(lon)) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: `Latitude and longitude must be valid numbers. Got: ${entity}`
          });
        }
        
        if (lat < -90 || lat > 90) {
          return res.status(400).json({
            error: 'Invalid latitude',
            message: `Latitude must be between -90 and 90. Got: ${lat}`
          });
        }
        
        if (lon < -180 || lon > 180) {
          return res.status(400).json({
            error: 'Invalid longitude',
            message: `Longitude must be between -180 and 180. Got: ${lon}`
          });
        }
        
        // Simulate region-specific data
        const baseScore = 50 + Math.random() * 40;
        const speciesCount = 30 + Math.floor(Math.random() * 50);
        
        healthData = {
          name: `Region (${lat.toFixed(1)}°, ${lon.toFixed(1)}°)`,
          healthScore: Math.round(baseScore),
          metrics: {
            speciesDiversityIndex: parseFloat((baseScore * 0.9 + Math.random() * 10).toFixed(1)),
            waterQualityIndex: parseFloat((baseScore * 1.1 - Math.random() * 10).toFixed(1)),
            habitatIntegrity: parseFloat((baseScore + Math.random() * 20 - 10).toFixed(1))
          },
          details: {
            speciesCount,
            observationCount: speciesCount * (10 + Math.floor(Math.random() * 20)),
            avgTemperature: 15 + Math.random() * 10
          },
          trend: baseScore > 70 ? 'improving' : baseScore < 50 ? 'declining' : 'stable'
        };
      } else if (type === 'timeperiod') {
        // Parse time period (e.g., "2023-Q1", "2024-Q1")
        const baseScore = 55 + Math.random() * 35;
        const speciesCount = 35 + Math.floor(Math.random() * 45);
        
        healthData = {
          name: entity,
          healthScore: Math.round(baseScore),
          metrics: {
            speciesDiversityIndex: parseFloat((baseScore * 0.95 + Math.random() * 5).toFixed(1)),
            waterQualityIndex: parseFloat((baseScore * 1.05 - Math.random() * 5).toFixed(1)),
            habitatIntegrity: parseFloat((baseScore + Math.random() * 15 - 7.5).toFixed(1))
          },
          details: {
            speciesCount,
            observationCount: speciesCount * (12 + Math.floor(Math.random() * 18)),
            avgTemperature: 16 + Math.random() * 8
          },
          trend: baseScore > 65 ? 'improving' : baseScore < 55 ? 'declining' : 'stable'
        };
      } else if (type === 'species') {
        // Compare species-specific habitat health
        const baseScore = 60 + Math.random() * 30;
        const observationCount = 50 + Math.floor(Math.random() * 200);
        
        // Calculate abundance and distribution metrics
        const abundance = observationCount; // Total number of observations
        const distribution = Math.round(30 + Math.random() * 60); // Geographic spread (0-100 scale)
        
        healthData = {
          name: entity,
          healthScore: Math.round(baseScore),
          metrics: {
            habitatSuitability: parseFloat((baseScore * 0.9 + Math.random() * 10).toFixed(1)),
            populationTrend: parseFloat((baseScore * 1.1 - Math.random() * 10).toFixed(1)),
            environmentalStress: parseFloat((100 - baseScore + Math.random() * 20 - 10).toFixed(1))
          },
          details: {
            observationCount,
            abundance, // Explicit abundance field
            distribution, // Explicit distribution field
            avgDepth: 500 + Math.random() * 2000,
            avgTemperature: 12 + Math.random() * 12
          },
          trend: baseScore > 70 ? 'improving' : baseScore < 55 ? 'declining' : 'stable'
        };
      }
      
      comparisonResults.push(healthData);
    }

    // Calculate differences from baseline (first entity)
    const baseline = comparisonResults[0];
    const differences = comparisonResults.map((result, index) => {
      if (index === 0) return { ...result, isBaseline: true, difference: 0 };
      
      const diff = result.healthScore - baseline.healthScore;
      return {
        ...result,
        isBaseline: false,
        difference: parseFloat(diff.toFixed(1)),
        differencePercentage: parseFloat(((diff / baseline.healthScore) * 100).toFixed(1))
      };
    });

    res.json({
      comparisonType: type,
      entities: differences,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching comparison data:', error.message);
    res.status(500).json({
      error: 'Failed to fetch comparison data',
      message: error.message
    });
  }
};
