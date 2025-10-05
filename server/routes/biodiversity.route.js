import express from 'express';
import { 
  getBiodiversityGrid, 
  getPollutionWMS, 
  getWeatherTileInfo 
} from '../controllers/biodiversity.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All biodiversity routes require authentication
// router.use(verifyToken);

// Get biodiversity grid data with optional temporal slicing
router.get('/grid', getBiodiversityGrid);

// Proxy for WMS pollution layers
router.get('/pollution-wms', getPollutionWMS);

// Get OpenWeatherMap tile configuration
router.get('/weather-tiles', getWeatherTileInfo);

export default router;
