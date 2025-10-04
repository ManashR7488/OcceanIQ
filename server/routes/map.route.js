import express from 'express';
import {
  getOBISOccurrences,
  getOBISCellOccurrences,
  getOBISGrid,
  getMarineWeather,
  getWoRMSTaxonomy,
  getSpeciesImages
} from '../controllers/map.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All map routes require authentication
router.use(verifyToken);

// OBIS species occurrence data for a specific grid cell by geohash
router.get('/obis/cell/:geohash', getOBISCellOccurrences);

// OBIS species occurrence data
router.get('/obis/occurrences', getOBISOccurrences);

// OBIS species occurrence grid data (aggregated by geohash)
router.get('/obis/grid/:precision', getOBISGrid);

// Marine weather data (SST, currents, wind, waves)
router.get('/marine-weather', getMarineWeather);

// WoRMS taxonomy data
router.get('/worms/taxonomy', getWoRMSTaxonomy);

// Species images from Unsplash API
router.get('/species-images', getSpeciesImages);

export default router;
