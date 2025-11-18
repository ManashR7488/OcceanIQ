import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import uploadOtolithMemory, {
  handleMulterError,
} from "../config/multer.config.js";
import {
  uploadOtolith,
  analyzeOtolithController,
  getOtolithMeasurements,
  getOtolithById,
  deleteOtolith,
  getOtolithStats,
} from "../controllers/otolith.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Upload otolith image to Cloudinary (Step 1 - No analysis)
// POST /api/otolith/upload
router.post(
  "/upload",
  uploadOtolithMemory.single("otolithImage"),
  handleMulterError,
  uploadOtolith
);

// Analyze uploaded otolith (Step 2 - Perform morphometric analysis)
// POST /api/otolith/analyze/:id
router.post("/analyze/:id", analyzeOtolithController);

// Get all otolith measurements with pagination and filters
// GET /api/otolith/measurements?page=1&limit=12&species=cod&status=completed
router.get("/measurements", getOtolithMeasurements);

// Get single otolith measurement by ID
// GET /api/otolith/measurements/:id
router.get("/measurements/:id", getOtolithById);

// Delete otolith measurement
// DELETE /api/otolith/measurements/:id
router.delete("/measurements/:id", deleteOtolith);

// Get user statistics
// GET /api/otolith/stats
router.get("/stats", getOtolithStats);

export default router;
