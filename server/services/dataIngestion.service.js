import csv from "csv-parser";
import { Readable } from "stream";
import Species from "../models/Species.model.js";
import Observation from "../models/Observation.model.js";
import OceanographicData from "../models/OceanographicData.model.js";
import { latLonToGeohash } from "../utils/geohash.js";

/**
 * Helper to convert string/value to boolean
 * @param {*} v - Value to convert
 * @returns {boolean} Boolean value
 */
const toBool = (v) => (typeof v === 'string' ? v.toLowerCase() === 'true' : Boolean(v));

/**
 * Helper to safely parse numbers, returns undefined for NaN
 * @param {*} v - Value to parse
 * @returns {number|undefined} Number or undefined
 */
const toNum = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Helper to safely parse integers, returns undefined for NaN
 * @param {*} v - Value to parse
 * @returns {number|undefined} Integer or undefined
 */
const toInt = (v) => {
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return Number.isInteger(n) ? n : undefined;
};

/**
 * Parse CSV buffer to array of objects
 * @param {Buffer} buffer - CSV file buffer
 * @returns {Promise<Array>} Array of row objects
 */
export const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

/**
 * Parse JSON buffer to array of objects
 * @param {Buffer} buffer - JSON file buffer
 * @returns {Array} Array of objects
 */
export const parseJSONBuffer = (buffer) => {
  try {
    const jsonString = buffer.toString("utf-8");
    const parsed = JSON.parse(jsonString);

    // Wrap single object in array for consistent processing
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    throw new Error(`JSON parsing error: ${error.message}`);
  }
};

/**
 * Transform raw species data to match Species model schema
 * @param {Object} rawData - Raw species data from CSV/JSON
 * @returns {Object} Transformed species object
 */
export const transformSpeciesData = (rawData) => {
  const transformed = {
    scientificName: rawData.scientificName || rawData.scientific_name,
    commonNames: [],
    taxonomicHierarchy: {
      kingdom: rawData.kingdom || rawData["taxonomicHierarchy.kingdom"],
      phylum: rawData.phylum || rawData["taxonomicHierarchy.phylum"],
      class: rawData.class || rawData["taxonomicHierarchy.class"],
      order: rawData.order || rawData["taxonomicHierarchy.order"],
      family: rawData.family || rawData["taxonomicHierarchy.family"],
      genus: rawData.genus || rawData["taxonomicHierarchy.genus"],
      species: rawData.species || rawData["taxonomicHierarchy.species"],
    },
    taxonomicStatus: rawData.taxonomicStatus || "accepted",
    description: rawData.description || "",
    habitat: rawData.habitat || "",
    distribution: rawData.distribution || "",
    conservationStatus: rawData.conservationStatus || null,
  };

  // Parse commonNames from comma-separated string or array
  if (rawData.commonNames) {
    if (typeof rawData.commonNames === "string") {
      transformed.commonNames = rawData.commonNames
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
    } else if (Array.isArray(rawData.commonNames)) {
      transformed.commonNames = rawData.commonNames;
    }
  }

  // Parse wormsMetadata if provided
  if (rawData["wormsMetadata.aphiaId"] || rawData.wormsMetadata) {
    const isMarine = rawData["wormsMetadata.isMarine"] !== undefined 
      ? toBool(rawData["wormsMetadata.isMarine"]) 
      : (rawData.wormsMetadata?.isMarine !== undefined ? toBool(rawData.wormsMetadata.isMarine) : false);
    const isBrackish = rawData["wormsMetadata.isBrackish"] !== undefined 
      ? toBool(rawData["wormsMetadata.isBrackish"]) 
      : (rawData.wormsMetadata?.isBrackish !== undefined ? toBool(rawData.wormsMetadata.isBrackish) : false);
    const isFreshwater = rawData["wormsMetadata.isFreshwater"] !== undefined 
      ? toBool(rawData["wormsMetadata.isFreshwater"]) 
      : (rawData.wormsMetadata?.isFreshwater !== undefined ? toBool(rawData.wormsMetadata.isFreshwater) : false);

    transformed.wormsMetadata = {
      aphiaId: rawData["wormsMetadata.aphiaId"] || rawData.wormsMetadata?.aphiaId,
      url: rawData["wormsMetadata.url"] || rawData.wormsMetadata?.url,
      authority: rawData["wormsMetadata.authority"] || rawData.wormsMetadata?.authority,
      isMarine,
      isBrackish,
      isFreshwater,
      status: rawData["wormsMetadata.status"] || rawData.wormsMetadata?.status,
      rank: rawData["wormsMetadata.rank"] || rawData.wormsMetadata?.rank,
    };
  }

  // Parse synonyms if provided
  if (rawData.synonyms) {
    if (typeof rawData.synonyms === "string") {
      try {
        transformed.synonyms = JSON.parse(rawData.synonyms);
      } catch (e) {
        // Fallback: split by comma and create synonym objects
        transformed.synonyms = rawData.synonyms
          .split(",")
          .map((name) => ({ name: name.trim(), authority: "" }))
          .filter((syn) => syn.name.length > 0);
      }
    } else if (Array.isArray(rawData.synonyms)) {
      transformed.synonyms = rawData.synonyms;
    }
  }

  // Parse externalLinks if provided
  if (rawData["externalLinks.wikipedia"] || rawData.externalLinks) {
    transformed.externalLinks = {
      wikipedia: rawData["externalLinks.wikipedia"] || rawData.externalLinks?.wikipedia,
      gbif: rawData["externalLinks.gbif"] || rawData.externalLinks?.gbif,
      fishbase: rawData["externalLinks.fishbase"] || rawData.externalLinks?.fishbase,
      iNaturalist: rawData["externalLinks.iNaturalist"] || rawData.externalLinks?.iNaturalist,
    };
  }

  // Parse morphology if provided
  if (rawData["morphology.maxLength"] || rawData.morphology) {
    const maxLength = toNum(rawData["morphology.maxLength"]) ?? toNum(rawData.morphology?.maxLength);
    const maxWeight = toNum(rawData["morphology.maxWeight"]) ?? toNum(rawData.morphology?.maxWeight);

    transformed.morphology = {
      distinctiveFeatures: [],
    };

    if (maxLength !== undefined) transformed.morphology.maxLength = maxLength;
    if (maxWeight !== undefined) transformed.morphology.maxWeight = maxWeight;

    if (rawData["morphology.distinctiveFeatures"]) {
      if (typeof rawData["morphology.distinctiveFeatures"] === "string") {
        transformed.morphology.distinctiveFeatures = rawData["morphology.distinctiveFeatures"]
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f.length > 0);
      }
    } else if (rawData.morphology?.distinctiveFeatures) {
      transformed.morphology.distinctiveFeatures = rawData.morphology.distinctiveFeatures;
    }
  }

  // Parse ecology if provided
  if (rawData["ecology.diet"] || rawData.ecology) {
    transformed.ecology = {
      diet: rawData["ecology.diet"] || rawData.ecology?.diet,
      behavior: rawData["ecology.behavior"] || rawData.ecology?.behavior,
      reproduction: rawData["ecology.reproduction"] || rawData.ecology?.reproduction,
      depthRange: {},
    };

    const minDepth = toNum(rawData["ecology.depthRange.min"]) ?? toNum(rawData.ecology?.depthRange?.min);
    const maxDepth = toNum(rawData["ecology.depthRange.max"]) ?? toNum(rawData.ecology?.depthRange?.max);

    if (minDepth !== undefined) transformed.ecology.depthRange.min = minDepth;
    if (maxDepth !== undefined) transformed.ecology.depthRange.max = maxDepth;
  }

  // Parse economicImportance if provided
  if (rawData.economicImportance) {
    transformed.economicImportance = rawData.economicImportance;
  }

  return transformed;
};

/**
 * Transform raw observation data to match Observation model schema
 * @param {Object} rawData - Raw observation data from CSV/JSON
 * @returns {Object} Transformed observation object
 */
export const transformObservationData = (rawData) => {
  const transformed = {
    scientificName: rawData.scientificName || rawData.scientific_name,
    speciesRef: rawData.speciesRef || rawData.species_ref,
    dataSource: rawData.dataSource || rawData.data_source || "manual",
    verificationStatus: rawData.verificationStatus || rawData.verification_status || "unverified",
  };

  // Generate observationId if not provided
  if (rawData.observationId || rawData.observation_id) {
    transformed.observationId = rawData.observationId || rawData.observation_id;
  }

  // Parse location (required)
  if (rawData.longitude && rawData.latitude) {
    transformed.location = {
      type: "Point",
      coordinates: [parseFloat(rawData.longitude), parseFloat(rawData.latitude)],
    };
  } else if (rawData["location.coordinates"]) {
    const coords = typeof rawData["location.coordinates"] === "string"
      ? JSON.parse(rawData["location.coordinates"])
      : rawData["location.coordinates"];
    transformed.location = {
      type: "Point",
      coordinates: coords,
    };
  } else if (rawData.location?.coordinates) {
    transformed.location = rawData.location;
  }

  // Parse observedDate (required)
  if (rawData.observedDate || rawData.observed_date) {
    transformed.observedDate = new Date(rawData.observedDate || rawData.observed_date);
  }

  // Parse optional fields
  if (rawData.commonName || rawData.common_name) {
    transformed.commonName = rawData.commonName || rawData.common_name;
  }

  if (rawData.locality) transformed.locality = rawData.locality;
  if (rawData.country) transformed.country = rawData.country;
  if (rawData.marineRegion || rawData.marine_region) {
    transformed.marineRegion = rawData.marineRegion || rawData.marine_region;
  }

  // Parse depth if provided
  if (rawData["depth.value"] || rawData.depth) {
    const depthValue = toNum(rawData["depth.value"]) ?? toNum(rawData.depth?.value);
    const depthMin = toNum(rawData["depth.min"]) ?? toNum(rawData.depth?.min);
    const depthMax = toNum(rawData["depth.max"]) ?? toNum(rawData.depth?.max);
    
    transformed.depth = {
      unit: rawData["depth.unit"] || rawData.depth?.unit || "meters",
    };
    
    if (depthValue !== undefined) transformed.depth.value = depthValue;
    if (depthMin !== undefined) transformed.depth.min = depthMin;
    if (depthMax !== undefined) transformed.depth.max = depthMax;
  }

  // Parse date accuracy
  if (rawData.dateAccuracy || rawData.date_accuracy) {
    transformed.dateAccuracy = rawData.dateAccuracy || rawData.date_accuracy;
  }

  // Parse data provenance
  if (rawData.datasetId || rawData.dataset_id) {
    transformed.datasetId = rawData.datasetId || rawData.dataset_id;
  }
  if (rawData.datasetName || rawData.dataset_name) {
    transformed.datasetName = rawData.datasetName || rawData.dataset_name;
  }
  if (rawData.institutionCode || rawData.institution_code) {
    transformed.institutionCode = rawData.institutionCode || rawData.institution_code;
  }
  if (rawData.collectionCode || rawData.collection_code) {
    transformed.collectionCode = rawData.collectionCode || rawData.collection_code;
  }
  if (rawData.catalogNumber || rawData.catalog_number) {
    transformed.catalogNumber = rawData.catalogNumber || rawData.catalog_number;
  }
  if (rawData.basisOfRecord || rawData.basis_of_record) {
    transformed.basisOfRecord = rawData.basisOfRecord || rawData.basis_of_record;
  }

  // Parse observer information
  if (rawData.recordedBy || rawData.recorded_by) {
    transformed.recordedBy = rawData.recordedBy || rawData.recorded_by;
  }
  if (rawData.identifiedBy || rawData.identified_by) {
    transformed.identifiedBy = rawData.identifiedBy || rawData.identified_by;
  }

  // Parse quality fields
  if (rawData.confidenceLevel || rawData.confidence_level) {
    const confidence = toNum(rawData.confidenceLevel || rawData.confidence_level);
    if (confidence !== undefined) transformed.confidenceLevel = confidence;
  }
  if (rawData.identificationRemarks || rawData.identification_remarks) {
    transformed.identificationRemarks = rawData.identificationRemarks || rawData.identification_remarks;
  }
  if (rawData.occurrenceRemarks || rawData.occurrence_remarks) {
    transformed.occurrenceRemarks = rawData.occurrenceRemarks || rawData.occurrence_remarks;
  }

  // Parse abundance fields
  if (rawData.individualCount || rawData.individual_count) {
    const count = toInt(rawData.individualCount || rawData.individual_count);
    if (count !== undefined) transformed.individualCount = count;
  }
  if (rawData.samplingProtocol || rawData.sampling_protocol) {
    transformed.samplingProtocol = rawData.samplingProtocol || rawData.sampling_protocol;
  }
  if (rawData.samplingEffort || rawData.sampling_effort) {
    transformed.samplingEffort = rawData.samplingEffort || rawData.sampling_effort;
  }

  // Parse environmental context
  if (rawData["environmentalContext.temperature"] || rawData.environmentalContext) {
    transformed.environmentalContext = {};
    
    const temp = toNum(rawData["environmentalContext.temperature"]) ?? toNum(rawData.environmentalContext?.temperature);
    const sal = toNum(rawData["environmentalContext.salinity"]) ?? toNum(rawData.environmentalContext?.salinity);
    const habitat = rawData["environmentalContext.habitat"] || rawData.environmentalContext?.habitat;
    
    if (temp !== undefined) transformed.environmentalContext.temperature = temp;
    if (sal !== undefined) transformed.environmentalContext.salinity = sal;
    if (habitat) transformed.environmentalContext.habitat = habitat;
  }

  // Parse external links
  if (rawData["externalLinks.obisUrl"] || rawData.externalLinks) {
    transformed.externalLinks = {
      obisUrl: rawData["externalLinks.obisUrl"] || rawData.externalLinks?.obisUrl,
      gbifUrl: rawData["externalLinks.gbifUrl"] || rawData.externalLinks?.gbifUrl,
      originalSource: rawData["externalLinks.originalSource"] || rawData.externalLinks?.originalSource,
    };
  }

  // Parse metadata
  if (rawData.license) transformed.license = rawData.license;
  if (rawData.rightsHolder || rawData.rights_holder) {
    transformed.rightsHolder = rawData.rightsHolder || rawData.rights_holder;
  }

  return transformed;
};

/**
 * Transform raw oceanographic data to match OceanographicData model schema
 * @param {Object} rawData - Raw oceanographic data from CSV/JSON
 * @returns {Object} Transformed oceanographic object
 */
export const transformOceanographicData = (rawData) => {
  const transformed = {
    dataSource: rawData.dataSource || rawData.data_source || "manual",
    temporalGranularity: rawData.temporalGranularity || rawData.temporal_granularity || "daily",
  };

  // Generate measurementId if not provided
  if (rawData.measurementId || rawData.measurement_id) {
    transformed.measurementId = rawData.measurementId || rawData.measurement_id;
  }

  // Parse location (required)
  if (rawData.longitude && rawData.latitude) {
    transformed.location = {
      type: "Point",
      coordinates: [parseFloat(rawData.longitude), parseFloat(rawData.latitude)],
    };
  } else if (rawData["location.coordinates"]) {
    const coords = typeof rawData["location.coordinates"] === "string"
      ? JSON.parse(rawData["location.coordinates"])
      : rawData["location.coordinates"];
    transformed.location = {
      type: "Point",
      coordinates: coords,
    };
  } else if (rawData.location?.coordinates) {
    transformed.location = rawData.location;
  }

  // Parse timestamp (required)
  if (rawData.timestamp) {
    transformed.timestamp = new Date(rawData.timestamp);
  }

  // Parse depth (required) - don't default to 0, let validation handle missing values
  const depthValue = toNum(rawData["depth.value"]) ?? toNum(rawData.depth?.value);
  if (depthValue !== undefined) {
    transformed.depth = {
      value: depthValue,
      layer: rawData["depth.layer"] || rawData.depth?.layer,
      unit: rawData["depth.unit"] || rawData.depth?.unit || "meters",
    };
  }

  // Parse temperature measurements
  const sst = toNum(rawData["temperature.seaSurfaceTemperature"]) ?? toNum(rawData.temperature?.seaSurfaceTemperature);
  const wt = toNum(rawData["temperature.waterTemperature"]) ?? toNum(rawData.temperature?.waterTemperature);
  if (sst !== undefined || wt !== undefined) {
    transformed.temperature = {
      unit: rawData["temperature.unit"] || rawData.temperature?.unit || "celsius",
      measurementMethod: rawData["temperature.measurementMethod"] || rawData.temperature?.measurementMethod,
    };
    if (sst !== undefined) transformed.temperature.seaSurfaceTemperature = sst;
    if (wt !== undefined) transformed.temperature.waterTemperature = wt;
  }

  // Parse salinity measurements
  const sal = toNum(rawData["salinity.value"]) ?? toNum(rawData.salinity?.value);
  if (sal !== undefined) {
    transformed.salinity = {
      value: sal,
      unit: rawData["salinity.unit"] || rawData.salinity?.unit || "PSU",
      measurementMethod: rawData["salinity.measurementMethod"] || rawData.salinity?.measurementMethod,
    };
  }

  // Parse wave data
  const waveHeight = toNum(rawData["waves.height"]) ?? toNum(rawData.waves?.height);
  const waveDirection = toNum(rawData["waves.direction"]) ?? toNum(rawData.waves?.direction);
  const wavePeriod = toNum(rawData["waves.period"]) ?? toNum(rawData.waves?.period);
  if (waveHeight !== undefined || waveDirection !== undefined || wavePeriod !== undefined) {
    transformed.waves = {
      unit: rawData["waves.unit"] || rawData.waves?.unit || "meters",
    };
    if (waveHeight !== undefined) transformed.waves.height = waveHeight;
    if (waveDirection !== undefined) transformed.waves.direction = waveDirection;
    if (wavePeriod !== undefined) transformed.waves.period = wavePeriod;
  }

  // Parse current data
  const currentVelocity = toNum(rawData["currents.velocity"]) ?? toNum(rawData.currents?.velocity);
  const currentDirection = toNum(rawData["currents.direction"]) ?? toNum(rawData.currents?.direction);
  const uComponent = toNum(rawData["currents.uComponent"]) ?? toNum(rawData.currents?.uComponent);
  const vComponent = toNum(rawData["currents.vComponent"]) ?? toNum(rawData.currents?.vComponent);
  if (currentVelocity !== undefined || currentDirection !== undefined || uComponent !== undefined || vComponent !== undefined) {
    transformed.currents = {
      unit: rawData["currents.unit"] || rawData.currents?.unit || "m/s",
    };
    if (currentVelocity !== undefined) transformed.currents.velocity = currentVelocity;
    if (currentDirection !== undefined) transformed.currents.direction = currentDirection;
    if (uComponent !== undefined) transformed.currents.uComponent = uComponent;
    if (vComponent !== undefined) transformed.currents.vComponent = vComponent;
  }

  // Parse wind data
  const windSpeed = toNum(rawData["wind.speed"]) ?? toNum(rawData.wind?.speed);
  const windDirection = toNum(rawData["wind.direction"]) ?? toNum(rawData.wind?.direction);
  const gustSpeed = toNum(rawData["wind.gustSpeed"]) ?? toNum(rawData.wind?.gustSpeed);
  if (windSpeed !== undefined || windDirection !== undefined || gustSpeed !== undefined) {
    transformed.wind = {
      unit: rawData["wind.unit"] || rawData.wind?.unit || "m/s",
    };
    if (windSpeed !== undefined) transformed.wind.speed = windSpeed;
    if (windDirection !== undefined) transformed.wind.direction = windDirection;
    if (gustSpeed !== undefined) transformed.wind.gustSpeed = gustSpeed;
  }

  // Parse chemistry data
  const dissolvedOxygen = toNum(rawData["chemistry.dissolvedOxygen"]) ?? toNum(rawData.chemistry?.dissolvedOxygen);
  const pH = toNum(rawData["chemistry.pH"]) ?? toNum(rawData.chemistry?.pH);
  const chlorophyll = toNum(rawData["chemistry.chlorophyll"]) ?? toNum(rawData.chemistry?.chlorophyll);
  
  // Parse nutrients
  const nitrate = toNum(rawData["chemistry.nutrients.nitrate"]) ?? toNum(rawData.chemistry?.nutrients?.nitrate);
  const phosphate = toNum(rawData["chemistry.nutrients.phosphate"]) ?? toNum(rawData.chemistry?.nutrients?.phosphate);
  const silicate = toNum(rawData["chemistry.nutrients.silicate"]) ?? toNum(rawData.chemistry?.nutrients?.silicate);
  
  if (dissolvedOxygen !== undefined || pH !== undefined || chlorophyll !== undefined || 
      nitrate !== undefined || phosphate !== undefined || silicate !== undefined) {
    transformed.chemistry = {};
    if (dissolvedOxygen !== undefined) transformed.chemistry.dissolvedOxygen = dissolvedOxygen;
    if (pH !== undefined) transformed.chemistry.pH = pH;
    if (chlorophyll !== undefined) transformed.chemistry.chlorophyll = chlorophyll;
    
    if (nitrate !== undefined || phosphate !== undefined || silicate !== undefined) {
      transformed.chemistry.nutrients = {};
      if (nitrate !== undefined) transformed.chemistry.nutrients.nitrate = nitrate;
      if (phosphate !== undefined) transformed.chemistry.nutrients.phosphate = phosphate;
      if (silicate !== undefined) transformed.chemistry.nutrients.silicate = silicate;
    }
  }

  // Parse pressure data
  const seaLevelPressure = toNum(rawData["pressure.seaLevelPressure"]) ?? toNum(rawData.pressure?.seaLevelPressure);
  if (seaLevelPressure !== undefined) {
    transformed.pressure = {
      seaLevelPressure: seaLevelPressure,
      unit: rawData["pressure.unit"] || rawData.pressure?.unit || "hPa",
    };
  }

  // Parse provenance
  if (rawData.dataProvider || rawData.data_provider) {
    transformed.dataProvider = rawData.dataProvider || rawData.data_provider;
  }
  if (rawData.datasetId || rawData.dataset_id) {
    transformed.datasetId = rawData.datasetId || rawData.dataset_id;
  }
  if (rawData.instrumentType || rawData.instrument_type) {
    transformed.instrumentType = rawData.instrumentType || rawData.instrument_type;
  }
  if (rawData.platformType || rawData.platform_type) {
    transformed.platformType = rawData.platformType || rawData.platform_type;
  }

  // Parse quality flags
  if (rawData["qualityFlags.overall"] || rawData.qualityFlags) {
    transformed.qualityFlags = {
      overall: rawData["qualityFlags.overall"] || rawData.qualityFlags?.overall || "good",
      temperatureQC: rawData["qualityFlags.temperatureQC"] || rawData.qualityFlags?.temperatureQC,
      salinityQC: rawData["qualityFlags.salinityQC"] || rawData.qualityFlags?.salinityQC,
      notes: rawData["qualityFlags.notes"] || rawData.qualityFlags?.notes,
    };
  }

  const dq = toNum(rawData.dataQuality ?? rawData.data_quality);
  if (dq !== undefined) {
    transformed.dataQuality = dq;
  }

  // Parse metadata
  if (rawData.measurementRemarks || rawData.measurement_remarks) {
    transformed.measurementRemarks = rawData.measurementRemarks || rawData.measurement_remarks;
  }
  if (rawData.processingLevel || rawData.processing_level) {
    transformed.processingLevel = rawData.processingLevel || rawData.processing_level;
  }
  if (rawData.standardsCompliance || rawData.standards_compliance) {
    if (typeof rawData.standardsCompliance === "string") {
      transformed.standardsCompliance = rawData.standardsCompliance.split(",").map((s) => s.trim());
    } else {
      transformed.standardsCompliance = rawData.standardsCompliance || rawData.standards_compliance;
    }
  }

  // Parse external links
  if (rawData["externalLinks.sourceUrl"] || rawData.externalLinks) {
    transformed.externalLinks = {
      sourceUrl: rawData["externalLinks.sourceUrl"] || rawData.externalLinks?.sourceUrl,
      metadataUrl: rawData["externalLinks.metadataUrl"] || rawData.externalLinks?.metadataUrl,
    };
  }

  return transformed;
};

/**
 * Validate and batch insert species data
 * @param {Array} dataArray - Array of species data objects
 * @returns {Promise<Object>} Result with success count and errors
 */
export const validateAndInsertSpecies = async (dataArray) => {
  const results = {
    success: true,
    inserted: 0,
    failed: 0,
    errors: [],
    warnings: [],
  };

  let transformedData = [];

  try {
    // Transform all records
    transformedData = dataArray.map((rawData, index) => {
      try {
        return transformSpeciesData(rawData);
      } catch (error) {
        results.errors.push({
          index,
          data: rawData,
          error: `Transformation error: ${error.message}`,
        });
        return null;
      }
    }).filter((item) => item !== null);

    // Batch insert with ordered: false (allows partial success)
    if (transformedData.length > 0) {
      const insertResult = await Species.insertMany(transformedData, { ordered: false });
      results.inserted = insertResult.length;
    }
  } catch (error) {
    // Handle MongoDB bulk write errors
    if (error?.writeErrors?.length) {
      results.inserted = error.insertedDocs?.length || 0;

      for (const we of error.writeErrors) {
        const isDuplicate = we.code === 11000 || /E11000/.test(we.errmsg || '');
        
        if (isDuplicate) {
          results.warnings.push({
            index: we.index,
            data: transformedData[we.index],
            error: 'Duplicate key',
            duplicate: true,
          });
        } else {
          results.errors.push({
            index: we.index,
            data: transformedData[we.index],
            error: we.errmsg || we.err?.errmsg || String(we),
          });
        }
      }
    } else {
      results.success = false;
      results.errors.push({
        error: error.message,
      });
    }
  }

  results.failed = results.errors.length;
  return results;
};

/**
 * Validate and batch insert observation data
 * @param {Array} dataArray - Array of observation data objects
 * @returns {Promise<Object>} Result with success count and errors
 */
export const validateAndInsertObservations = async (dataArray) => {
  const results = {
    success: true,
    inserted: 0,
    failed: 0,
    errors: [],
    warnings: [],
  };

  let transformedData = [];

  try {
    // Transform all records
    transformedData = dataArray.map((rawData, index) => {
      try {
        return transformObservationData(rawData);
      } catch (error) {
        results.errors.push({
          index,
          data: rawData,
          error: `Transformation error: ${error.message}`,
        });
        return null;
      }
    }).filter((item) => item !== null);

    // Batch insert with ordered: false
    if (transformedData.length > 0) {
      const insertResult = await Observation.insertMany(transformedData, { ordered: false });
      results.inserted = insertResult.length;
    }
  } catch (error) {
    // Handle MongoDB bulk write errors
    if (error?.writeErrors?.length) {
      results.inserted = error.insertedDocs?.length || 0;

      for (const we of error.writeErrors) {
        const isDuplicate = we.code === 11000 || /E11000/.test(we.errmsg || '');
        
        if (isDuplicate) {
          results.warnings.push({
            index: we.index,
            data: transformedData[we.index],
            error: 'Duplicate key',
            duplicate: true,
          });
        } else {
          results.errors.push({
            index: we.index,
            data: transformedData[we.index],
            error: we.errmsg || we.err?.errmsg || String(we),
          });
        }
      }
    } else {
      results.success = false;
      results.errors.push({
        error: error.message,
      });
    }
  }

  results.failed = results.errors.length;
  return results;
};

/**
 * Validate and batch insert oceanographic data
 * @param {Array} dataArray - Array of oceanographic data objects
 * @returns {Promise<Object>} Result with success count and errors
 */
export const validateAndInsertOceanographicData = async (dataArray) => {
  const results = {
    success: true,
    inserted: 0,
    failed: 0,
    errors: [],
    warnings: [],
  };

  let transformedData = [];

  try {
    // Transform all records
    transformedData = dataArray.map((rawData, index) => {
      try {
        return transformOceanographicData(rawData);
      } catch (error) {
        results.errors.push({
          index,
          data: rawData,
          error: `Transformation error: ${error.message}`,
        });
        return null;
      }
    }).filter((item) => item !== null);

    // Batch insert with ordered: false
    if (transformedData.length > 0) {
      const insertResult = await OceanographicData.insertMany(transformedData, { ordered: false });
      results.inserted = insertResult.length;
    }
  } catch (error) {
    // Handle MongoDB bulk write errors
    if (error?.writeErrors?.length) {
      results.inserted = error.insertedDocs?.length || 0;

      for (const we of error.writeErrors) {
        const isDuplicate = we.code === 11000 || /E11000/.test(we.errmsg || '');
        
        if (isDuplicate) {
          results.warnings.push({
            index: we.index,
            data: transformedData[we.index],
            error: 'Duplicate key',
            duplicate: true,
          });
        } else {
          results.errors.push({
            index: we.index,
            data: transformedData[we.index],
            error: we.errmsg || we.err?.errmsg || String(we),
          });
        }
      }
    } else {
      results.success = false;
      results.errors.push({
        error: error.message,
      });
    }
  }

  results.failed = results.errors.length;
  return results;
};
