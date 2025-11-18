import axios from "axios";
import sharp from "sharp";
import { providerConfig } from "../config/speciesProviders.config.js";
import { getImageMetadata } from "../utils/checksum.js";

// Token management
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get Fishial.AI access token (with caching)
 * @returns {Promise<String>} Access token
 */
const getFishialAccessToken = async () => {
  try {
    // Check if cached token exists and is not expired
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      console.log("Fishial: Using cached access token");
      return cachedToken;
    }

    console.log("Fishial: Requesting new access token");

    // Request new token
    const response = await axios.post(
      providerConfig.fishial.authUrl,
      {
        client_id: providerConfig.fishial.clientId,
        client_secret: providerConfig.fishial.clientSecret,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const accessToken = response.data.access_token;

    if (!accessToken) {
      throw new Error("No access_token in response");
    }

    // Cache token with 9-minute expiry (buffer before 10-minute actual expiry)
    cachedToken = accessToken;
    tokenExpiry = Date.now() + 9 * 60 * 1000;

    console.log("Fishial: Access token obtained successfully");
    return accessToken;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error("Fishial: Invalid credentials (401)");
    } else {
      console.error("Fishial: Token request error:", error.message);
    }
    throw error;
  }
};

/**
 * Request upload URL from Fishial.AI
 * @param {String} token - Access token
 * @param {Object} imageMetadata - Image metadata (filename, contentType, byteSize, checksum)
 * @returns {Promise<String>} Signed ID for recognition
 */
const requestFishialUploadUrl = async (token, imageMetadata) => {
  try {
    console.log("Fishial: Requesting upload URL");

    const response = await axios.post(
      `${providerConfig.fishial.apiBaseUrl}/recognition/upload`,
      {
        blob: {
          filename: imageMetadata.filename,
          content_type: imageMetadata.contentType,
          byte_size: imageMetadata.byteSize,
          checksum: imageMetadata.checksum,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000,
      }
    );

    const signedId = response.data.signed_id;

    if (!signedId) {
      throw new Error("No signed_id in response");
    }

    console.log("Fishial: Upload URL obtained, signed_id:", signedId);
    return signedId;
  } catch (error) {
    console.error("Fishial: Upload URL request error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

/**
 * Run Fishial.AI recognition
 * @param {String} token - Access token
 * @param {String} signedId - Signed ID from upload
 * @returns {Promise<Array>} Recognition results
 */
const runFishialRecognition = async (token, signedId) => {
  try {
    console.log("Fishial: Running recognition with signed_id:", signedId);

    const response = await axios.get(
      `${providerConfig.fishial.apiBaseUrl}/recognition/image`,
      {
        params: {
          q: signedId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      }
    );

    const results = response.data.results || [];
    console.log(`Fishial: Recognition completed, found ${results.length} detections`);

    return results;
  } catch (error) {
    console.error("Fishial: Recognition error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

/**
 * Extract common name from scientific name (simple heuristic)
 * @param {String} scientificName - Scientific name
 * @returns {String} Common name or scientific name
 */
const extractCommonName = (scientificName) => {
  // For now, just return the scientific name
  // In a real implementation, you'd have a lookup table or use the species field from API
  return scientificName;
};

/**
 * Identify species using Fishial.AI
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} filename - Original filename
 * @returns {Promise<Array>} Array of candidates with species info
 */
export const identifySpeciesWithFishial = async (imageBuffer, filename) => {
  try {
    if (!providerConfig.fishial.enabled) {
      console.log("Fishial.AI provider not configured, skipping...");
      return [];
    }

    console.log("Attempting identification with Fishial.AI...");

    // Get image metadata
    const imageMetadata = getImageMetadata(imageBuffer, filename);
    console.log("Image metadata:", imageMetadata);

    // Get access token
    const token = await getFishialAccessToken();

    // Request upload URL
    const signedId = await requestFishialUploadUrl(token, imageMetadata);

    // Run recognition
    const results = await runFishialRecognition(token, signedId);

    if (results.length === 0) {
      console.log("Fishial: No detections found");
      return [];
    }

    // Parse results and map to candidate format
    const candidates = [];
    
    for (const detection of results) {
      if (detection.species && Array.isArray(detection.species)) {
        for (const species of detection.species) {
          const confidence = Math.round(species.accuracy * 100);
          
          // Filter by minimum confidence
          if (confidence >= providerConfig.fishial.minConfidence * 100) {
            candidates.push({
              scientificName: species.name,
              commonName: extractCommonName(species.name),
              confidence,
              source: "fishial",
            });
          }
        }
      }
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    // Return top 5 candidates
    const topCandidates = candidates.slice(0, 5);
    console.log(`Fishial: Returning ${topCandidates.length} candidates`);

    return topCandidates;
  } catch (error) {
    console.error("Fishial identification error:", error.message);
    return [];
  }
};

/**
 * Fallback identification using image analysis
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Array>} Array of generic candidates
 */
export const identifySpeciesWithFallback = async (imageBuffer) => {
  try {
    console.log("Using fallback identification method...");

    // Analyze image properties with Sharp
    const metadata = await sharp(imageBuffer).metadata();

    console.log("Image analysis:", {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
    });

    // Return generic low-confidence result
    return [
      {
        scientificName: "Unknown species",
        commonName: "Fish (unidentified)",
        confidence: 20,
        source: "fallback",
      },
    ];
  } catch (error) {
    console.error("Fallback identification error:", error.message);
    return [
      {
        scientificName: "Unknown species",
        commonName: "Unknown",
        confidence: 10,
        source: "fallback",
      },
    ];
  }
};

/**
 * Validate identification result
 * @param {Object} result - Identification result
 * @returns {Boolean} Whether result is valid
 */
export const validateIdentificationResult = (result) => {
  if (!result || typeof result !== "object") return false;
  if (!result.scientificName || typeof result.scientificName !== "string")
    return false;
  if (
    typeof result.confidence !== "number" ||
    result.confidence < 0 ||
    result.confidence > 100
  )
    return false;

  return true;
};

/**
 * Hybrid species identification orchestrator
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} filename - Original filename
 * @returns {Promise<Array>} Array of candidates with species info
 */
export const identifySpeciesHybrid = async (imageBuffer, filename) => {
  const allCandidates = [];

  try {
    // Try Fishial.AI first
    const fishialCandidates = await identifySpeciesWithFishial(imageBuffer, filename);
    
    if (fishialCandidates.length > 0) {
      allCandidates.push(...fishialCandidates);
      
      // If we have high confidence results (>= 60%), return immediately
      const highConfidence = fishialCandidates.filter(c => c.confidence >= 60);
      if (highConfidence.length > 0) {
        console.log("High confidence results found, returning immediately");
        return highConfidence;
      }
    }

    // If Fishial failed or returned low confidence, try fallback
    if (allCandidates.length === 0) {
      console.log("No results from Fishial, trying fallback...");
      const fallbackCandidates = await identifySpeciesWithFallback(imageBuffer);
      allCandidates.push(...fallbackCandidates);
    }

    // Deduplicate by scientific name (keep highest confidence)
    const deduped = [];
    const seen = new Set();

    for (const candidate of allCandidates) {
      const key = candidate.scientificName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(candidate);
      }
    }

    // Sort by confidence descending
    deduped.sort((a, b) => b.confidence - a.confidence);

    console.log(`Hybrid identification complete: ${deduped.length} candidates`);
    return deduped;
  } catch (error) {
    console.error("Hybrid identification error:", error.message);
    // Always return something, even if it's fallback
    return await identifySpeciesWithFallback(imageBuffer);
  }
};
