import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import uploadOtolithMemory, {
  handleMulterError,
} from "../config/multer.config.js";
import {
  identifySpeciesFromImage,
  getIdentificationHistory,
} from "../controllers/taxonomy.controller.js";

const router = express.Router();

// Image Identification Routes
router.post(
  "/identify/image",
  uploadOtolithMemory.single("speciesImage"),
  handleMulterError,
  identifySpeciesFromImage
);

// TODO: Enable when IdentificationHistory model is implemented
// router.get("/identify/history", protect, getIdentificationHistory);

// Note: PDF export is handled client-side using jsPDF for better performance
// and scalability. See client/src/utils/pdfGenerator.js

export default router;
