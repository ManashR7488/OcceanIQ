import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { uploadDataMemory, handleMulterError } from "../config/multer.config.js";
import { uploadLimiter } from "../middleware/rateLimit.middleware.js";
import {
  uploadSpeciesData,
  uploadObservationsData,
  uploadOceanographicData,
  getUserDatasets,
  deleteUserDataset,
} from "../controllers/data.controller.js";

const router = express.Router();

// Middleware to set file size limit for error messages
const setUploadLimitMB = (mb) => (req, _res, next) => {
  req.multerLimitMB = mb;
  next();
};

// Apply authentication middleware to all routes
router.use(verifyToken);

// POST /api/data/species/upload - Upload species data (CSV/JSON) - Requires authentication
router.post(
  "/species/upload",
  uploadLimiter,
  setUploadLimitMB(50),
  uploadDataMemory.single("file"),
  handleMulterError,
  uploadSpeciesData
);

// POST /api/data/observations/upload - Upload observation data (CSV/JSON) - Requires authentication
router.post(
  "/observations/upload",
  uploadLimiter,
  setUploadLimitMB(50),
  uploadDataMemory.single("file"),
  handleMulterError,
  uploadObservationsData
);

// POST /api/data/oceanographic/upload - Upload oceanographic data (CSV/JSON) - Requires authentication
router.post(
  "/oceanographic/upload",
  uploadLimiter,
  setUploadLimitMB(50),
  uploadDataMemory.single("file"),
  handleMulterError,
  uploadOceanographicData
);

// GET /api/data/datasets - List user's datasets
router.get("/datasets", getUserDatasets);

// DELETE /api/data/datasets/:id - Delete dataset
router.delete("/datasets/:id", deleteUserDataset);

export default router;
