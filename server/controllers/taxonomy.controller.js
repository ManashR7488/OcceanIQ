import mongoose from "mongoose";
import axios from "axios";
import Species from "../models/Species.model.js";
import {
  uploadImageToCloudinary,
  deleteOtolithImage,
} from "../services/otolithAnalysis.service.js";
import { identifySpeciesHybrid } from "../services/speciesIdentification.service.js";
import { enrichSpeciesWithFishBase } from "../services/fishbase.service.js";

/**
 * Identify species from uploaded image using iNaturalist Computer Vision API
 * POST /api/taxonomy/identify/image
 */
export const identifySpeciesFromImage = async (req, res) => {
  let publicId;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
        message: "Please upload a fish species image",
      });
    }

    // Generate unique sample ID for species identification
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const identificationId = `SPECIES-${timestamp}-${randomStr}`;

    // Upload image to Cloudinary with taxonomy-specific folder
    // Note: uploadImageToCloudinary will use folder: occeaniq/taxonomy/species
    const uploadResult = await uploadImageToCloudinary(
      req.file.buffer,
      req.user?._id || "anonymous",
      identificationId
    );

    // Track publicId for potential cleanup
    publicId = uploadResult.publicId;

    // Call species identification service with hybrid provider support
    const identificationCandidates = await identifySpeciesHybrid(req.file.buffer, req.file.originalname);

    if (identificationCandidates.length === 0) {
      return res.status(400).json({
        error: "No identification results",
        message:
          "Unable to identify species from image. Fishial.AI could not recognize this fish. Please try a clearer photo with the fish clearly visible.",
      });
    }

    // Process candidates with WoRMS and FishBase enrichment
    const identificationResults = [];

    for (let i = 0; i < identificationCandidates.length; i++) {
      const candidate = identificationCandidates[i];
      const scientificName = candidate.scientificName;
      const confidence = Math.round(candidate.confidence);
      
      // Normalize provider source casing for UI consistency
      const providerMap = { 
        fishial: 'Fishial.AI',
        fallback: 'Fallback' 
      };
      const source = providerMap[candidate.source] || candidate.source;

      // Fetch FishBase enrichment data
      const fishbaseData = await enrichSpeciesWithFishBase(scientificName);
      if (fishbaseData) {
        console.log(`FishBase enrichment successful for ${scientificName}`);
      }

      // Try to find species in local database
      let speciesData = await Species.findOne({
        scientificName: scientificName,
      }).lean();

      // If not found in local DB, fetch from WoRMS
      if (!speciesData) {
        try {
          const wormsResponse = await axios.get(
            `https://www.marinespecies.org/rest/AphiaRecordsByName/${encodeURIComponent(
              scientificName
            )}`,
            {
              params: { like: false, marine_only: false },
            }
          );

          if (wormsResponse.data && wormsResponse.data.length > 0) {
            const wormsData = wormsResponse.data[0];

            // Fetch full classification
            const classificationResponse = await axios.get(
              `https://www.marinespecies.org/rest/AphiaClassificationByAphiaID/${wormsData.AphiaID}`
            );

            const classification = classificationResponse.data;

            // Build taxonomic hierarchy
            const taxonomicHierarchy = {};
            let current = classification;
            while (current) {
              if (current.rank) {
                taxonomicHierarchy[current.rank.toLowerCase()] =
                  current.scientificname;
              }
              current = current.child;
            }

            // Create species data object
            speciesData = {
              scientificName: wormsData.scientificname,
              commonNames: wormsData.valid_name
                ? [wormsData.valid_name]
                : [],
              taxonomicHierarchy,
              taxonomicStatus: wormsData.status,
              description: wormsData.citation || "No description available",
              wormsMetadata: {
                aphiaId: wormsData.AphiaID,
                url: wormsData.url,
                authority: wormsData.authority,
                isMarine: wormsData.isMarine === 1,
                isBrackish: wormsData.isBrackish === 1,
                isFreshwater: wormsData.isFreshwater === 1,
              },
            };
          }
        } catch (wormsError) {
          console.error("WoRMS API error:", wormsError);
          // Continue with minimal data
          speciesData = {
            scientificName: scientificName,
            commonNames: candidate.commonName ? [candidate.commonName] : [],
            taxonomicHierarchy: {},
            description: "Species data not available",
            morphology: {},
            ecology: {},
            habitat: null,
            distribution: null,
          };
        }
      }

      // Merge FishBase data if available
      if (fishbaseData) {
        speciesData = {
          ...speciesData,
          morphology: fishbaseData.morphology || speciesData.morphology || {},
          ecology: fishbaseData.ecology || speciesData.ecology || {},
          habitat: fishbaseData.habitat || speciesData.habitat || null,
          distribution: fishbaseData.distribution || speciesData.distribution || null,
          conservationStatus: fishbaseData.conservationStatus || speciesData.conservationStatus || "Not Evaluated",
          economicImportance: fishbaseData.economicImportance || speciesData.economicImportance || null,
          externalLinks: {
            ...(speciesData.externalLinks || {}),
            ...(fishbaseData.externalLinks || {}),
          },
        };
        console.log(`Merged FishBase data for ${scientificName}`);
      }

      identificationResults.push({
        rank: i + 1,
        scientificName: scientificName,
        commonName: candidate.commonName || "Unknown",
        confidence,
        source, // Provider source
        speciesData,
      });
    }

    // Return response
    res.status(201).json({
      success: true,
      message: "Species identification completed successfully",
      data: {
        uploadedImageUrl: uploadResult.imageUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        identificationResults,
        identificationId,
      },
    });
  } catch (error) {
    console.error("Species identification error:", error);

    // Clean up Cloudinary if identification failed
    // Note: deleteOtolithImage is a generic function that handles any publicId
    // and works for both otolith and species identification images
    if (publicId) {
      await deleteOtolithImage(publicId).catch((err) =>
        console.error("Cleanup failed:", err)
      );
    }

    // Handle specific errors
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return res.status(504).json({
        error: "Request timeout",
        message:
          "The identification service is taking too long. Please try again.",
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "Too many requests. Please wait a moment and try again.",
      });
    }

    res.status(500).json({
      error: "Identification failed",
      message:
        error.message || "Failed to identify species. Please try again.",
    });
  }
};

/**
 * Get user's identification history
 * GET /api/taxonomy/identify/history
 * 
 * TODO: This is a placeholder endpoint for MVP. 
 * Future implementation requires:
 * 1. Create IdentificationHistory model with schema:
 *    - userId, imageUrl, identificationResults, timestamp, feedback
 * 2. Store identification records in database during upload
 * 3. Implement pagination, filtering, and sorting
 * 4. Add user feedback mechanism (correct/incorrect)
 * 
 * For now, this endpoint is disabled in routes and returns coming soon message.
 */
export const getIdentificationHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // TODO: Uncomment when IdentificationHistory model is created
    // const identifications = await IdentificationHistory
    //   .find({ userId })
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(limit)
    //   .lean();
    //
    // const total = await IdentificationHistory.countDocuments({ userId });

    res.status(200).json({
      success: true,
      message: "Identification history feature coming soon",
      data: {
        identifications: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get identification history error:", error);
    res.status(500).json({
      error: "Failed to fetch history",
      message: error.message || "Failed to retrieve identification history",
    });
  }
};

// Note: PDF generation has been moved to client-side (jsPDF) for better
// performance and scalability. The generateSpeciesPDF server function has
// been removed to avoid code duplication and maintenance overhead.
// See: client/src/utils/pdfGenerator.js

