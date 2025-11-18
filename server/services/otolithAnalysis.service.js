import sharp from "sharp";
import axios from "axios";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateThumbnailUrl,
} from "../config/cloudinary.config.js";
import OtolithMeasurement from "../models/OtolithMeasurement.model.js";

// Constants
const PIXELS_TO_MM_RATIO = 100; // 100 pixels = 1mm (adjust based on calibration)
const CLOUDINARY_FOLDER = "occeaniq/otoliths";
const THUMBNAIL_SIZE = 200;

/**
 * Upload otolith image to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {String} userId - User ID
 * @param {String} sampleId - Sample ID
 * @returns {Promise<Object>} Upload result with URLs
 */
export const uploadImageToCloudinary = async (buffer, userId, sampleId) => {
  try {
    // Generate unique public ID
    const publicId = `${userId}/${sampleId}_${Date.now()}`;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      public_id: publicId,
      folder: CLOUDINARY_FOLDER,
      tags: ["otolith", userId, sampleId],
    });

    // Generate thumbnail URL
    const thumbnailUrl = generateThumbnailUrl(
      uploadResult.public_id,
      THUMBNAIL_SIZE,
      THUMBNAIL_SIZE
    );

    return {
      imageUrl: uploadResult.secure_url,
      thumbnailUrl,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      size: uploadResult.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Analyze otolith morphometrics using sharp
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Morphometric measurements
 */
export const analyzeMorphometrics = async (buffer) => {
  try {
    // Load image with sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Get image dimensions in pixels
    const widthPx = metadata.width;
    const heightPx = metadata.height;

    // Convert pixels to millimeters
    const length = heightPx / PIXELS_TO_MM_RATIO;
    const width = widthPx / PIXELS_TO_MM_RATIO;

    // Calculate area (approximation)
    const area = length * width;

    // Calculate perimeter (approximation for ellipse)
    const perimeter =
      Math.PI * (3 * (length + width) - Math.sqrt((3 * length + width) * (length + 3 * width)));

    // Calculate circularity (4π × area / perimeter²)
    const circularity = (4 * Math.PI * area) / Math.pow(perimeter, 2);

    // Calculate aspect ratio
    const aspectRatio = length / width;

    // Calculate shape descriptors
    const compactness = Math.sqrt(area) / perimeter;
    const elongation = 1 - (width / length);

    return {
      length: parseFloat(length.toFixed(3)),
      width: parseFloat(width.toFixed(3)),
      area: parseFloat(area.toFixed(3)),
      perimeter: parseFloat(perimeter.toFixed(3)),
      circularity: parseFloat(circularity.toFixed(4)),
      aspectRatio: parseFloat(aspectRatio.toFixed(3)),
      shapeDescriptors: {
        compactness: parseFloat(compactness.toFixed(4)),
        elongation: parseFloat(elongation.toFixed(4)),
      },
    };
  } catch (error) {
    console.error("Morphometric analysis error:", error);
    throw new Error(`Failed to analyze morphometrics: ${error.message}`);
  }
};

/**
 * Identify species using AI (placeholder for ML model)
 * @param {Object} morphometrics - Morphometric measurements
 * @returns {Promise<Object>} Species identification results
 */
export const identifySpecies = async (morphometrics) => {
  // TODO: Replace with actual ML model (TensorFlow, PyTorch API, or Langchain)
  // This is a mock implementation based on simple size rules

  try {
    let primarySpecies = {
      name: "Unknown",
      confidence: 50,
    };
    let alternativeSpecies = [];

    // Simple rule-based classification (placeholder)
    if (morphometrics.length > 15) {
      primarySpecies = {
        name: "Gadus morhua (Atlantic Cod)",
        confidence: 85,
      };
      alternativeSpecies = [
        { name: "Pollachius virens (Saithe)", confidence: 65 },
        { name: "Melanogrammus aeglefinus (Haddock)", confidence: 55 },
      ];
    } else if (morphometrics.length > 10 && morphometrics.length <= 15) {
      primarySpecies = {
        name: "Clupea harengus (Atlantic Herring)",
        confidence: 78,
      };
      alternativeSpecies = [
        { name: "Sprattus sprattus (European Sprat)", confidence: 62 },
        { name: "Sardina pilchardus (European Pilchard)", confidence: 48 },
      ];
    } else {
      primarySpecies = {
        name: "Sprattus sprattus (European Sprat)",
        confidence: 72,
      };
      alternativeSpecies = [
        { name: "Clupea harengus (Atlantic Herring)", confidence: 58 },
        { name: "Engraulis encrasicolus (European Anchovy)", confidence: 45 },
      ];
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      primarySpecies,
      alternativeSpecies,
    };
  } catch (error) {
    console.error("Species identification error:", error);
    throw new Error(`Failed to identify species: ${error.message}`);
  }
};

/**
 * Orchestrate full otolith analysis
 * @param {String} otolithId - OtolithMeasurement document ID
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Complete analysis results
 */
export const analyzeOtolith = async (otolithId, buffer) => {
  const startTime = Date.now();

  try {
    console.log(`Starting analysis for otolith ${otolithId}...`);

    // Step 1: Analyze morphometrics
    console.log("Analyzing morphometrics...");
    const morphometrics = await analyzeMorphometrics(buffer);

    // Step 2: Identify species
    console.log("Identifying species...");
    const speciesIdentification = await identifySpecies(morphometrics);

    const processingTime = Date.now() - startTime;
    console.log(`Analysis completed in ${processingTime}ms`);

    return {
      morphometrics,
      speciesIdentification,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Analysis failed after ${processingTime}ms:`, error);
    throw error;
  }
};

/**
 * Delete otolith image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteOtolithImage = async (publicId) => {
  try {
    const result = await deleteFromCloudinary(publicId);
    console.log(`Deleted image from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    // Don't throw - log error but allow DB deletion to proceed
    return { error: error.message };
  }
};

/**
 * Fetch image buffer from Cloudinary URL for analysis
 * @param {String} url - Cloudinary image URL
 * @returns {Promise<Buffer>} Image buffer
 */
export const fetchImageBuffer = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Failed to fetch image from Cloudinary:", error);
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
};
