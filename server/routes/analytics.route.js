import express from 'express';
import { getCorrelations, getPredictions, handleQuery } from '../controllers/analytics.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(verifyToken);

/**
 * GET /api/analytics/correlations
 * 
 * Purpose: Analyze correlations between ocean parameters and species distribution
 * 
 * Query Parameters:
 * - startDate (optional): Start date for analysis (ISO 8601 format)
 * - endDate (optional): End date for analysis (ISO 8601 format)
 * - latitude (optional): Center latitude for location filter
 * - longitude (optional): Center longitude for location filter
 * - radiusKm (optional): Radius in kilometers for location filter (default: 500)
 * 
 * Response:
 * {
 *   correlations: { "Temperature vs Abundance": 0.72, ... },
 *   scatterData: [{ x: number, y: number, timestamp: Date }],
 *   insights: [{ parameter, metric, correlation, description, significance }],
 *   dataPoints: number,
 *   synthetic: boolean
 * }
 * 
 * Example: GET /api/analytics/correlations?startDate=2024-01-01&endDate=2024-03-31
 */
router.get('/correlations', getCorrelations);

/**
 * GET /api/analytics/predictions
 * 
 * Purpose: Generate time-series predictions for biodiversity metrics
 * 
 * Query Parameters:
 * - metric (required): Metric to predict (abundance|diversity|temperature|salinity)
 * - forecastDays (optional): Number of days to forecast (7-60, default: 30)
 * - latitude (optional): Center latitude for location filter
 * - longitude (optional): Center longitude for location filter
 * - radiusKm (optional): Radius in kilometers for location filter (default: 500)
 * 
 * Response:
 * {
 *   historical: [{ timestamp: Date, value: number }],
 *   forecast: [{ timestamp: Date, predicted: number, lower: number, upper: number }],
 *   trend: { direction: string, percentage: number, slope: number },
 *   anomalies: [{ timestamp: Date, value: number, zScore: number, severity: string }],
 *   movingAverages: { sma7: number[], sma30: number[] },
 *   metric: string,
 *   forecastDays: number,
 *   synthetic: boolean
 * }
 * 
 * Example: GET /api/analytics/predictions?metric=abundance&forecastDays=30
 */
router.get('/predictions', getPredictions);

/**
 * POST /api/analytics/query
 * 
 * Purpose: Handle natural language queries about marine data using AI
 * 
 * Request Body:
 * {
 *   question: string (required) - Natural language question
 *   filters: {
 *     startDate: string (optional) - Filter start date
 *     endDate: string (optional) - Filter end date
 *     region: string (optional) - Region name filter
 *   }
 * }
 * 
 * Response:
 * {
 *   answer: string - AI-generated answer
 *   sources: [{ id: string, species: string, date: Date }] - Data sources used
 *   confidence: number - Confidence score (0-1)
 *   dataPoints: number - Number of observations used
 *   timestamp: string - Response timestamp
 * }
 * 
 * Example: POST /api/analytics/query
 * Body: { "question": "What is the correlation between temperature and species diversity?" }
 * 
 * Note: Requires OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable
 */
router.post('/query', handleQuery);

export default router;
