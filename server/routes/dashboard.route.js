import express from 'express';
import { getStats, getOceanographicTrends, getBiodiversityHeatmap, getTimeSeriesData, getBathymetry, getEcosystemHealth, getCompareData } from '../controllers/dashboard.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(verifyToken);

// Dashboard statistics
router.get('/stats', getStats);

// Oceanographic trends data for charts
router.get('/oceanographic-trends', getOceanographicTrends);

// Biodiversity heatmap data
router.get('/biodiversity-heatmap', getBiodiversityHeatmap);

// Time-series data for biodiversity trends
router.get('/time-series', getTimeSeriesData);

// Bathymetry data for 3D ocean depth visualization
router.get('/bathymetry', getBathymetry);

// Ecosystem health metrics
router.get('/ecosystem-health', getEcosystemHealth);

// Comparative analysis data
router.get('/compare', getCompareData);

export default router;
