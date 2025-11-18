import axios from 'axios';

/**
 * iNaturalist Taxa API Service
 * Provides integration with iNaturalist API for species data enrichment
 */

const INATURALIST_API_BASE = 'https://api.inaturalist.org/v1';
const API_TIMEOUT = 10000; // 10 seconds
const USER_AGENT = 'OceanIQ-eDNA-Platform/1.0';

// Cache for API responses to avoid repeated calls
const taxonCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_SWEEP_INTERVAL = 60 * 60 * 1000; // 60 minutes

// Retry configuration
const RETRY_STATUS = new Set([429, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY = 300; // ms

/**
 * Helper function to make iNaturalist API requests with retry/backoff
 * @param {Object} config - Axios request configuration
 * @returns {Promise<Object>} Axios response
 */
async function inatRequest(config) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await axios({ timeout: API_TIMEOUT, headers: { 'User-Agent': USER_AGENT }, ...config });
    } catch (err) {
      const status = err?.response?.status;
      const isRetryable = status && RETRY_STATUS.has(status);
      if (!isRetryable || attempt === MAX_RETRIES) throw err;
      const jitter = Math.random() * 100;
      const delay = BASE_DELAY * Math.pow(2, attempt) + jitter; // 300, 700, 1500ms approx
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/**
 * Set cache entry with expiration
 * @param {String} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCache(key, data) {
  taxonCache.set(key, { data, timestamp: Date.now(), expiresAt: Date.now() + CACHE_DURATION });
}

/**
 * Get cache entry if not expired
 * @param {String} key - Cache key
 * @returns {Object|null} Cached data or null
 */
function getCache(key) {
  const entry = taxonCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    taxonCache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Start periodic cache sweeper to remove expired entries
 */
function startCacheSweeper() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of taxonCache.entries()) {
      if (entry.expiresAt <= now) {
        taxonCache.delete(key);
      }
    }
  }, CACHE_SWEEP_INTERVAL).unref?.();
}

// Start cache sweeper on module load
startCacheSweeper();

/**
 * Search for taxon by scientific name
 * @param {String} scientificName - Scientific name of the species
 * @returns {Promise<Object|null>} Taxon basic info with ID, or null if not found
 */
export const searchTaxonByName = async (scientificName) => {
  try {
    console.log(`iNaturalist: Searching for taxon "${scientificName}"`);

    const response = await inatRequest({
      method: 'GET',
      url: `${INATURALIST_API_BASE}/taxa/autocomplete`,
      params: {
        q: scientificName,
        is_active: true,
        rank: 'species,subspecies,variety',
      },
    });

    if (response.data && response.data.results && response.data.results.length > 0) {
      // Find exact match or best match
      const exactMatch = response.data.results.find(
        (r) => r.name.toLowerCase() === scientificName.toLowerCase()
      );
      const bestMatch = exactMatch || response.data.results[0];

      console.log(`iNaturalist: Found taxon ID ${bestMatch.id} for "${scientificName}"`);
      return {
        taxonId: bestMatch.id,
        name: bestMatch.name,
        rank: bestMatch.rank,
        preferredCommonName: bestMatch.preferred_common_name,
      };
    }

    console.log(`iNaturalist: No taxon found for "${scientificName}"`);
    return null;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`iNaturalist API timeout for "${scientificName}"`);
    } else if (error.response) {
      console.error(`iNaturalist API error: ${error.response.status}`, error.response.data);
    } else {
      console.error(`iNaturalist search error for "${scientificName}":`, error.message);
    }
    return null;
  }
};

/**
 * Fetch comprehensive taxon details
 * @param {Number} taxonId - iNaturalist taxon ID
 * @returns {Promise<Object|null>} Full taxon details or null if not found
 */
export const getTaxonDetails = async (taxonId) => {
  try {
    // Check cache first
    const cacheKey = `taxon_${taxonId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`iNaturalist: Using cached data for taxon ID ${taxonId}`);
      return cached;
    }

    console.log(`iNaturalist: Fetching details for taxon ID ${taxonId}`);

    const response = await inatRequest({
      method: 'GET',
      url: `${INATURALIST_API_BASE}/taxa/${taxonId}`,
    });

    if (response.data && response.data.results && response.data.results.length > 0) {
      const taxon = response.data.results[0];

      // Build taxonomy hierarchy
      const taxonomy = {
        kingdom: null,
        phylum: null,
        class: null,
        order: null,
        family: null,
        genus: null,
        species: null,
      };

      // Parse ancestor IDs to build full taxonomy
      if (taxon.ancestors) {
        taxon.ancestors.forEach((ancestor) => {
          const rank = ancestor.rank?.toLowerCase();
          if (rank && taxonomy.hasOwnProperty(rank)) {
            taxonomy[rank] = ancestor.name;
          }
        });
      }

      // Add current taxon to taxonomy
      const currentRank = taxon.rank?.toLowerCase();
      if (currentRank && taxonomy.hasOwnProperty(currentRank)) {
        taxonomy[currentRank] = taxon.name;
      }

      // Extract common names
      const commonNames = [];
      if (taxon.preferred_common_name) {
        commonNames.push({
          name: taxon.preferred_common_name,
          locale: 'en',
        });
      }
      if (taxon.names && Array.isArray(taxon.names)) {
        taxon.names.slice(0, 5).forEach((nameObj) => {
          if (nameObj.name && nameObj.name !== taxon.preferred_common_name) {
            commonNames.push({
              name: nameObj.name,
              locale: nameObj.locale || 'unknown',
            });
          }
        });
      }

      // Extract conservation status
      let conservationStatus = null;
      if (taxon.conservation_status || taxon.conservation_statuses) {
        const status = taxon.conservation_status || taxon.conservation_statuses?.[0];
        if (status) {
          conservationStatus = {
            status: status.status || 'Not Evaluated',
            authority: status.authority || 'Unknown',
            iucnStatus: status.iucn || status.status || 'NE',
          };
        }
      }

      // Extract Wikipedia info
      const wikipediaUrl = taxon.wikipedia_url || null;
      let wikipediaSummary = null;
      if (taxon.wikipedia_summary) {
        wikipediaSummary = taxon.wikipedia_summary.substring(0, 500) + '...';
      }

      const details = {
        taxonId: taxon.id,
        rank: taxon.rank,
        name: taxon.name,
        taxonomy,
        commonNames,
        conservationStatus,
        wikipediaUrl,
        wikipediaSummary,
        iconicTaxonName: taxon.iconic_taxon_name,
        isActive: taxon.is_active,
        ancestryString: taxon.ancestry,
      };

      // Cache the result
      setCache(cacheKey, details);

      console.log(`iNaturalist: Successfully fetched details for taxon ID ${taxonId}`);
      return details;
    }

    console.log(`iNaturalist: No details found for taxon ID ${taxonId}`);
    return null;
  } catch (error) {
    console.error(`iNaturalist details fetch error for taxon ${taxonId}:`, error.message);
    return null;
  }
};

/**
 * Fetch representative photos for a taxon
 * @param {Number} taxonId - iNaturalist taxon ID
 * @param {Number} limit - Maximum number of photos to fetch
 * @returns {Promise<Array>} Array of photo objects
 */
export const getTaxonPhotos = async (taxonId, limit = 5) => {
  try {
    console.log(`iNaturalist: Fetching photos for taxon ID ${taxonId}`);

    // Fetch observations with photos for this taxon
    const response = await inatRequest({
      method: 'GET',
      url: `${INATURALIST_API_BASE}/observations`,
      params: {
        taxon_id: taxonId,
        photos: true,
        per_page: limit,
        order_by: 'votes',
        quality_grade: 'research',
      },
    });

    const photos = [];

    if (response.data && response.data.results && response.data.results.length > 0) {
      response.data.results.forEach((observation) => {
        if (observation.photos && observation.photos.length > 0) {
          observation.photos.slice(0, 1).forEach((photo) => {
            if (photos.length < limit) {
              photos.push({
                url: photo.url?.replace('square', 'medium') || photo.url,
                attribution: photo.attribution || observation.user?.name || 'Unknown',
                license: photo.license_code || 'Unknown',
              });
            }
          });
        }
      });
    }

    console.log(`iNaturalist: Found ${photos.length} photos for taxon ID ${taxonId}`);
    return photos;
  } catch (error) {
    console.error(`iNaturalist photos fetch error for taxon ${taxonId}:`, error.message);
    return [];
  }
};

/**
 * Main enrichment function - fetch comprehensive species data from iNaturalist
 * @param {String} scientificName - Scientific name of the species
 * @returns {Promise<Object|null>} Enriched species data or null if not found
 */
export const enrichSpeciesWithINaturalist = async (scientificName) => {
  try {
    console.log(`iNaturalist: Starting enrichment for "${scientificName}"`);

    // Step 1: Search for taxon by name
    const taxonBasic = await searchTaxonByName(scientificName);
    if (!taxonBasic || !taxonBasic.taxonId) {
      console.log(`iNaturalist: Could not find taxon for "${scientificName}"`);
      return null;
    }

    // Step 2: Fetch full taxon details
    const taxonDetails = await getTaxonDetails(taxonBasic.taxonId);
    if (!taxonDetails) {
      console.log(`iNaturalist: Could not fetch details for taxon ID ${taxonBasic.taxonId}`);
      return null;
    }

    // Step 3: Fetch representative photos
    const photos = await getTaxonPhotos(taxonBasic.taxonId, 5);

    // Step 4: Combine all data into enrichment object
    const enrichment = {
      taxonId: taxonDetails.taxonId,
      rank: taxonDetails.rank,
      taxonomy: taxonDetails.taxonomy,
      commonNames: taxonDetails.commonNames,
      conservationStatus: taxonDetails.conservationStatus,
      wikipediaUrl: taxonDetails.wikipediaUrl,
      wikipediaSummary: taxonDetails.wikipediaSummary,
      photos,
      fetchedAt: new Date(),
    };

    console.log(`iNaturalist: Successfully enriched "${scientificName}" with ${photos.length} photos`);
    return enrichment;
  } catch (error) {
    console.error(`iNaturalist enrichment error for "${scientificName}":`, error.message);
    return null;
  }
};
