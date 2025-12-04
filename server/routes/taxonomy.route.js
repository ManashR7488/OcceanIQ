import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import uploadOtolithMemory, {
  handleMulterError,
} from "../config/multer.config.js";
import {
  identifySpecies,
  getIdentificationHistory,
} from "../controllers/taxonomy.controller.js";

const router = express.Router();

/**
 * Species Identification Route
 * POST /api/taxonomy/identify
 * 
 * Accepts either:
 * - speciesName in request body (text input) - scientific or common name
 * - speciesImage as multipart file (image upload)
 * - Or both (image takes precedence for identification)
 * 
 * Requires authentication to track user identification history
 */
router.post(
  "/identify",
  protect, // Require authentication
  uploadOtolithMemory.single("speciesImage"), // Optional image upload
  handleMulterError,
  identifySpecies
);

/**
 * Identification History Route
 * GET /api/taxonomy/identify/history
 * 
 * Returns user's species identification history with pagination
 */
router.get("/identify/history", protect, getIdentificationHistory);

// Note: PDF export is handled client-side using jsPDF for better performance
// and scalability. See client/src/utils/pdfGenerator.js

export default router;

