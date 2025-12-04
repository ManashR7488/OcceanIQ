import mongoose from "mongoose";
import axios from "axios";
import Species from "../models/Species.model.js";
import {
  uploadImageToCloudinary,
  deleteOtolithImage,
} from "../services/otolithAnalysis.service.js";
import { callN8nTaxonomyWebhook } from "../services/n8nTaxonomy.service.js";

/**
 * Identify species from name or image using n8n webhook integration
 * Supports dual input: species name (text) OR image upload
 * POST /api/taxonomy/identify
 */
export const identifySpecies = async (req, res) => {
  let publicId;
  let imageUrl = null;
  let thumbnailUrl = null;

  try {
    // Validate input: require at least one (name OR image)
    if (!req.body.speciesName && !req.file) {
      return res.status(400).json({
        error: "Missing input",
        message: "Please provide either a species name or upload an image",
      });
    }

    let inputForN8n;
    let inputType;

    // Process image upload if provided
    if (req.file) {
      inputType = "image";

      // Generate unique identification ID
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const identificationId = `SPECIES-${timestamp}-${randomStr}`;

      // Upload image to Cloudinary
      const uploadResult = await uploadImageToCloudinary(
        req.file.buffer,
        req.user._id,
        identificationId
      );

      // Track for cleanup on failure
      publicId = uploadResult.publicId;
      imageUrl = uploadResult.imageUrl;
      thumbnailUrl = uploadResult.thumbnailUrl;

      // Pass image URL to n8n
      inputForN8n = imageUrl;

      console.log(
        `[Taxonomy] Image uploaded to Cloudinary: ${imageUrl.substring(0, 60)}...`
      );
    }
    // Process species name if provided (and no image)
    else if (req.body.speciesName) {
      inputType = "name";

      // Validate and sanitize species name
      const speciesName = req.body.speciesName.trim();
      if (speciesName.length < 2) {
        return res.status(400).json({
          error: "Invalid species name",
          message: "Species name must be at least 2 characters long",
        });
      }

      inputForN8n = speciesName;

      console.log(`[Taxonomy] Identifying species by name: ${speciesName}`);
    }

    // Call n8n taxonomy webhook
    console.log(`[Taxonomy] Calling n8n webhook with ${inputType} input...`);
    let n8nResponse;

    try {
      n8nResponse = await callN8nTaxonomyWebhook(inputForN8n);
    } catch (webhookError) {
      console.error("[Taxonomy] n8n webhook error:", webhookError.message);

      // Clean up Cloudinary image if uploaded
      if (publicId) {
        await deleteOtolithImage(publicId).catch((err) =>
          console.error("Cloudinary cleanup failed:", err)
        );
      }

      // Handle specific webhook errors
      if (webhookError.message.includes("timeout")) {
        return res.status(504).json({
          error: "Identification timeout",
          message:
            "The n8n identification service is taking too long. Please try again or check your n8n workflow.",
        });
      }

      if (webhookError.message.includes("unreachable")) {
        return res.status(503).json({
          error: "Service unavailable",
          message:
            "Cannot connect to n8n taxonomy service. Please check that n8n is running.",
        });
      }

      if (webhookError.message.includes("not configured")) {
        return res.status(500).json({
          error: "Configuration error",
          message:
            "N8N_TAXONOMY_WEBHOOK_URL is not configured. Please contact the administrator.",
        });
      }

      // Generic webhook error
      return res.status(500).json({
        error: "Identification failed",
        message: webhookError.message || "Failed to identify species via n8n",
      });
    }

    // Map n8n response to Species model schema
    
    // Map full IUCN conservation status labels to short enum codes
    const mapConservationStatus = (status) => {
      if (!status) return "NE";
      const statusMap = {
        "Least Concern": "LC",
        "Near Threatened": "NT",
        "Vulnerable": "VU",
        "Endangered": "EN",
        "Critically Endangered": "CR",
        "Extinct in the Wild": "EW",
        "Extinct": "EX",
        "Data Deficient": "DD",
        "Not Evaluated": "NE",
        // Also support short codes directly
        "LC": "LC",
        "NT": "NT",
        "VU": "VU",
        "EN": "EN",
        "CR": "CR",
        "EW": "EW",
        "EX": "EX",
        "DD": "DD",
        "NE": "NE",
      };
      return statusMap[status] || "NE";
    };
    
    // Check if species already exists to preserve createdBy
    const existingSpecies = await Species.findOne({
      scientificName: n8nResponse.scientificName,
    });

    const speciesData = {
      scientificName: n8nResponse.scientificName,
      commonNames: n8nResponse.commonNames || [],
      taxonomicHierarchy: n8nResponse.taxonomicHierarchy || {},
      description: n8nResponse.description || "",
      habitat: n8nResponse.habitat || "",
      distribution: n8nResponse.distribution || "",
      morphology: n8nResponse.morphology || {},
      ecology: n8nResponse.ecology || {},
      conservationStatus: mapConservationStatus(n8nResponse.conservationStatus),
      economicImportance: n8nResponse.economicImportance || "",
      externalLinks: n8nResponse.externalLinks || {},
      // Use uploaded image or n8n-provided image
      uploadedImageUrl: imageUrl || n8nResponse.imageUrl || null,
      thumbnailUrl: thumbnailUrl || n8nResponse.thumbnailUrl || null,
      // User tracking - preserve original createdBy if updating, otherwise set to current user
      createdBy: existingSpecies ? existingSpecies.createdBy : req.user._id,
      identificationSource: "n8n-webhook",
      // Store original n8n response for debugging/auditing
      identificationMetadata: {
        n8nResponse,
        inputType,
        timestamp: new Date(),
        identifiedBy: req.user._id, // Track who performed this identification
      },
    };

    // Save or update species in database (upsert by scientificName)
    const savedSpecies = await Species.findOneAndUpdate(
      { scientificName: n8nResponse.scientificName },
      speciesData,
      {
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true,
      }
    );

    const isNew = !savedSpecies.createdAt || 
      savedSpecies.createdAt.getTime() === savedSpecies.updatedAt.getTime();

    console.log(
      `[Taxonomy] Species ${isNew ? "created" : "updated"}: ${savedSpecies.scientificName}`
    );

    // Return success response
    res.status(isNew ? 201 : 200).json({
      success: true,
      message: `Species identified successfully via n8n webhook`,
      data: {
        species: savedSpecies,
        isNew,
        source: "n8n-webhook",
      },
    });
  } catch (error) {
    console.error("[Taxonomy] Identification error:", error);

    // Clean up Cloudinary if image was uploaded
    if (publicId) {
      await deleteOtolithImage(publicId).catch((err) =>
        console.error("Cloudinary cleanup failed:", err)
      );
    }

    // Handle specific errors
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return res.status(504).json({
        error: "Request timeout",
        message: "The identification service is taking too long. Please try again.",
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "Too many requests. Please wait a moment and try again.",
      });
    }

    // Handle duplicate key error (shouldn't happen with upsert, but just in case)
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Duplicate species",
        message: "This species already exists in the database",
      });
    }

    res.status(500).json({
      error: "Identification failed",
      message: error.message || "Failed to identify species. Please try again.",
    });
  }
};

/**
 * Get user's identification history
 * GET /api/taxonomy/identify/history
 */
export const getIdentificationHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Query species identified by this user
    const identifications = await Species.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v") // Exclude version key
      .lean();

    const total = await Species.countDocuments({ createdBy: userId });

    res.status(200).json({
      success: true,
      message: "Identification history retrieved successfully",
      data: {
        identifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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

// Note: PDF generation has been moved to client-side (jsPDF) for better
// performance and scalability. The generateSpeciesPDF server function has
// been removed to avoid code duplication and maintenance overhead.
// See: client/src/utils/pdfGenerator.js
