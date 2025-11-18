import express from 'express';
import { uploadSequenceMemory, handleMulterError } from '../config/multer.config.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  uploadEDNASample,
  analyzeEDNASample,
  getEDNASamples,
  getEDNASampleById,
  deleteEDNASample,
  getEDNAStats,
  seedReferenceData,
  getSpeciesDetails,
} from '../controllers/edna.controller.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/species/details', protect, getSpeciesDetails);
router.post('/upload', protect, uploadSequenceMemory.single('sequenceFile'), handleMulterError, uploadEDNASample);
router.post('/analyze/:id', protect, analyzeEDNASample);
router.get('/samples', protect, getEDNASamples);
router.get('/samples/:id', protect, getEDNASampleById);
router.delete('/samples/:id', protect, deleteEDNASample);
router.get('/stats', protect, getEDNAStats);
router.post('/seed-reference', protect, seedReferenceData);

export default router;
