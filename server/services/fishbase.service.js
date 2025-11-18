import axios from "axios";
import { providerConfig } from "../config/speciesProviders.config.js";

/**
 * Parse binomial name into genus and species
 * @param {String} scientificName - Scientific name (e.g., "Thunnus albacares")
 * @returns {Object} Object with genus and species fields
 */
const parseBinomialName = (scientificName) => {
  if (!scientificName || typeof scientificName !== "string") {
    return { genus: null, species: null };
  }

  const parts = scientificName.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Single word - treat as genus
    return { genus: parts[0], species: null };
  }
  
  // Two or more words - take first two (genus and species)
  return {
    genus: parts[0],
    species: parts[1],
  };
};

/**
 * Fetch species data from FishBase API
 * @param {String} scientificName - Scientific name
 * @returns {Promise<Object|null>} Species data or null if not found
 */
const fetchSpeciesFromFishBase = async (scientificName) => {
  try {
    const { genus, species } = parseBinomialName(scientificName);
    
    if (!genus || !species) {
      console.log(`FishBase: Invalid scientific name format: ${scientificName}`);
      return null;
    }

    console.log(`FishBase: Fetching data for ${genus} ${species}`);

    const response = await axios.get(
      `${providerConfig.fishbase.apiBaseUrl}/species`,
      {
        params: {
          Genus: genus,
          Species: species,
          fields: "SpecCode,FBname,Genus,Species,BodyShapeI,DemersPelag,AnaCat,Vulnerability,Length,Weight,Importance,PriceCateg,Dangerous,Electrogenic,Complete,IUCN_Code,Habitat,DepthRangeShallow,DepthRangeDeep,Comments",
        },
        timeout: providerConfig.fishbase.timeout,
      }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      const speciesData = response.data.data[0];
      console.log(`FishBase: Found species data for ${genus} ${species}`);
      return speciesData;
    }

    console.log(`FishBase: No data found for ${genus} ${species}`);
    return null;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.error("FishBase API timeout:", error.message);
    } else if (error.response) {
      console.error("FishBase API error:", error.response.status, error.response.data);
    } else {
      console.error("FishBase fetch error:", error.message);
    }
    return null;
  }
};

/**
 * Fetch ecology data from FishBase API
 * @param {Number} specCode - FishBase species code
 * @returns {Promise<Object|null>} Ecology data or null if not found
 */
const fetchEcologyFromFishBase = async (specCode) => {
  try {
    console.log(`FishBase: Fetching ecology data for SpecCode ${specCode}`);

    const response = await axios.get(
      `${providerConfig.fishbase.apiBaseUrl}/ecology`,
      {
        params: {
          SpecCode: specCode,
          fields: "FeedingType,DietTroph,FoodTroph,FoodSeTroph,FoodRemark",
        },
        timeout: providerConfig.fishbase.timeout,
      }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log(`FishBase: Found ecology data for SpecCode ${specCode}`);
      return response.data.data[0];
    }

    console.log(`FishBase: No ecology data found for SpecCode ${specCode}`);
    return null;
  } catch (error) {
    console.error("FishBase ecology fetch error:", error.message);
    return null;
  }
};

/**
 * Map IUCN code to conservation status enum
 * @param {String} iucnCode - IUCN Red List code
 * @returns {String} Conservation status
 */
const mapIUCNCode = (iucnCode) => {
  const mapping = {
    EX: "Extinct",
    EW: "Extinct in the Wild",
    CR: "Critically Endangered",
    EN: "Endangered",
    VU: "Vulnerable",
    NT: "Near Threatened",
    LC: "Least Concern",
    DD: "Data Deficient",
    NE: "Not Evaluated",
  };
  
  return mapping[iucnCode] || "Not Evaluated";
};

/**
 * Enrich species data with FishBase information
 * @param {String} scientificName - Scientific name
 * @returns {Promise<Object|null>} Enriched species data or null if not found
 */
export const enrichSpeciesWithFishBase = async (scientificName) => {
  try {
    // Fetch species data from FishBase
    const speciesData = await fetchSpeciesFromFishBase(scientificName);
    
    if (!speciesData) {
      return null;
    }

    // Fetch ecology data if we have a SpecCode
    let ecologyData = null;
    if (speciesData.SpecCode) {
      ecologyData = await fetchEcologyFromFishBase(speciesData.SpecCode);
    }

    // Map FishBase fields to Species model structure
    const enrichedData = {
      morphology: {
        maxLength: speciesData.Length || null,
        maxWeight: speciesData.Weight || null,
        distinctiveFeatures: speciesData.Comments || null,
      },
      ecology: {
        diet: ecologyData?.FoodRemark || null,
        depthRange: {
          min: speciesData.DepthRangeShallow || null,
          max: speciesData.DepthRangeDeep || null,
        },
      },
      habitat: speciesData.Habitat || null,
      distribution: speciesData.Comments || null, // Comments often contain distribution info
      conservationStatus: speciesData.IUCN_Code
        ? mapIUCNCode(speciesData.IUCN_Code)
        : "Not Evaluated",
      economicImportance: speciesData.Importance || null,
      externalLinks: {
        fishbase: `https://www.fishbase.se/summary/${speciesData.SpecCode}`,
      },
    };

    console.log(`FishBase: Successfully enriched data for ${scientificName}`);
    return enrichedData;
  } catch (error) {
    console.error("FishBase enrichment error:", error.message);
    return null;
  }
};
