import mongoose from "mongoose";
import axios from "axios";
import Species from "../models/Species.model.js";
import {
  uploadImageToCloudinary,
  deleteOtolithImage,
} from "../services/otolithAnalysis.service.js";
// Legacy n8n service - kept for reference, no longer used
// import { callN8nTaxonomyWebhook } from "../services/n8nTaxonomy.service.js";

/**
 * Identify species from name or image using FastAPI microservice
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

    let inputForMicroservice;
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

      // Pass image URL to microservice
      inputForMicroservice = imageUrl;

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

      inputForMicroservice = speciesName;

      console.log(`[Taxonomy] Identifying species by name: ${speciesName}`);
    }

    // Call FastAPI microservice taxonomy identification endpoint
    console.log(`[Taxonomy] Calling microservice with ${inputType} input...`);
    const microserviceUrl = process.env.MICROSERVICE_URL || 'http://localhost:8000';
    let microserviceResponse;

    try {
      const response = await axios.post(
        `${microserviceUrl}/taxonomy-identify`,
        {
          input: inputForMicroservice,
          input_type: inputType
        },
        {
          timeout: 120000 // 120 second timeout (vision + search + synthesis)
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response from microservice');
      }

      microserviceResponse = response.data.data;

    } catch (microserviceError) {
      console.error("[Taxonomy] Microservice error:", microserviceError.message);

      // Clean up Cloudinary image if uploaded
      if (publicId) {
        await deleteOtolithImage(publicId).catch((err) =>
          console.error("Cloudinary cleanup failed:", err)
        );
      }

      // Handle specific microservice errors
      if (microserviceError.code === 'ECONNABORTED' || microserviceError.message.includes("timeout")) {
        return res.status(504).json({
          error: "Identification timeout",
          message:
            "The species identification is taking too long. Please try with a clearer image or simpler query.",
        });
      }

      if (microserviceError.code === 'ECONNREFUSED' || microserviceError.message.includes("connect")) {
        return res.status(503).json({
          error: "Service unavailable",
          message:
            "Cannot connect to taxonomy identification service. Please ensure the microservice is running.",
        });
      }

      if (microserviceError.response?.status === 422) {
        return res.status(400).json({
          error: "Invalid input",
          message: microserviceError.response.data.detail || "Invalid species name or image URL",
        });
      }

      // Generic microservice error
      return res.status(500).json({
        error: "Identification failed",
        message: microserviceError.response?.data?.detail || microserviceError.message || "Failed to identify species",
      });
    }

    // Map microservice response to Species model schema
    
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
      scientificName: microserviceResponse.scientificName,
    });

    const speciesData = {
      scientificName: microserviceResponse.scientificName,
      commonNames: microserviceResponse.commonNames || [],
      taxonomicHierarchy: microserviceResponse.taxonomicHierarchy || {},
      description: microserviceResponse.description || "",
      habitat: microserviceResponse.habitat || "",
      distribution: microserviceResponse.distribution || "",
      morphology: microserviceResponse.morphology || {},
      ecology: microserviceResponse.ecology || {},
      conservationStatus: mapConservationStatus(microserviceResponse.conservationStatus),
      economicImportance: microserviceResponse.economicImportance || "",
      externalLinks: microserviceResponse.externalLinks || {},
      // Use uploaded image or microservice-provided image
      uploadedImageUrl: imageUrl || microserviceResponse.imageUrl || null,
      thumbnailUrl: thumbnailUrl || microserviceResponse.thumbnailUrl || null,
      // User tracking - preserve original createdBy if updating, otherwise set to current user
      createdBy: existingSpecies ? existingSpecies.createdBy : req.user._id,
      identificationSource: "microservice-langgraph",
      // Store original microservice response for debugging/auditing
      identificationMetadata: {
        microserviceResponse,
        inputType,
        timestamp: new Date(),
        identifiedBy: req.user._id, // Track who performed this identification
      },
    };

    // Save or update species in database (upsert by scientificName)
    const savedSpecies = await Species.findOneAndUpdate(
      { scientificName: microserviceResponse.scientificName },
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
      message: `Species identified successfully via taxonomy microservice (LangGraph agent)`,
      data: {
        species: savedSpecies,
        isNew,
        source: "microservice-langgraph",
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
