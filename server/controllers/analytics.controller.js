import Observation from '../models/Observation.model.js';
import OceanographicData from '../models/OceanographicData.model.js';

/**
 * Helper: Calculate Pearson correlation coefficient
 */
const calculateCorrelation = (xArray, yArray) => {
  const n = Math.min(xArray.length, yArray.length);
  if (n < 2) return 0;

  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (typeof xArray[i] === 'number' && typeof yArray[i] === 'number' && 
        !isNaN(xArray[i]) && !isNaN(yArray[i])) {
      validPairs.push({ x: xArray[i], y: yArray[i] });
    }
  }

  if (validPairs.length < 2) return 0;

  const sumX = validPairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = validPairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = validPairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = validPairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = validPairs.reduce((sum, p) => sum + p.y * p.y, 0);

  const len = validPairs.length;
  const numerator = len * sumXY - sumX * sumY;
  const denominator = Math.sqrt((len * sumX2 - sumX * sumX) * (len * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * Helper: Calculate moving average
 */
const calculateMovingAverage = (data, windowSize) => {
  if (data.length < windowSize) return data.map(d => d.value);
  
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(data[i].value);
    } else {
      const window = data.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((sum, d) => sum + d.value, 0) / windowSize;
      result.push(avg);
    }
  }
  return result;
};

/**
 * Helper: Detect anomalies (values > 2 standard deviations from mean)
 */
const detectAnomalies = (data, threshold = 2) => {
  const values = data.map(d => d.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = [];
  data.forEach((d, index) => {
    const zScore = Math.abs((d.value - mean) / stdDev);
    if (zScore > threshold) {
      anomalies.push({
        timestamp: d.timestamp,
        value: d.value,
        zScore: zScore.toFixed(2),
        severity: zScore > 3 ? 'high' : 'medium'
      });
    }
  });

  return anomalies;
};

/**
 * Helper: Aggregate observations by time buckets
 */
const aggregateByTime = (observations, intervalDays = 30) => {
  const buckets = new Map();
  
  observations.forEach(obs => {
    const date = new Date(obs.observedDate);
    const bucketKey = Math.floor(date.getTime() / (intervalDays * 24 * 60 * 60 * 1000));
    
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        timestamp: new Date(bucketKey * intervalDays * 24 * 60 * 60 * 1000),
        observations: [],
        temperature: [],
        salinity: [],
        pH: [],
        dissolvedOxygen: []
      });
    }
    
    const bucket = buckets.get(bucketKey);
    bucket.observations.push(obs);
    
    if (obs.environmentalContext?.temperature) {
      bucket.temperature.push(obs.environmentalContext.temperature);
    }
    if (obs.environmentalContext?.salinity) {
      bucket.salinity.push(obs.environmentalContext.salinity);
    }
  });

  return Array.from(buckets.values()).map(bucket => ({
    timestamp: bucket.timestamp,
    abundance: bucket.observations.length,
    diversity: new Set(bucket.observations.map(o => o.scientificName)).size,
    avgTemperature: bucket.temperature.length > 0 
      ? bucket.temperature.reduce((sum, t) => sum + t, 0) / bucket.temperature.length 
      : null,
    avgSalinity: bucket.salinity.length > 0
      ? bucket.salinity.reduce((sum, s) => sum + s, 0) / bucket.salinity.length
      : null
  }));
};

/**
 * GET /api/analytics/correlations
 * Analyze correlations between ocean parameters and species distribution
 */
export const getCorrelations = async (req, res) => {
  try {
    // Extract query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);
    const radiusKm = parseFloat(req.query.radiusKm) || 500;

    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before endDate'
      });
    }

    // Build query for observations
    const observationQuery = {
      observedDate: { $gte: startDate, $lte: endDate }
    };

    // Add location filter if provided
    if (!isNaN(latitude) && !isNaN(longitude)) {
      observationQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000 // Convert km to meters
        }
      };
    }

    // Query observations
    const observations = await Observation.find(observationQuery)
      .limit(1000)
      .select('scientificName observedDate environmentalContext location')
      .lean();

    // If insufficient data, return synthetic fallback
    if (observations.length < 10) {
      return res.json({
        correlations: generateSyntheticCorrelations(),
        scatterData: generateSyntheticScatterData(),
        insights: [
          {
            parameter: 'Temperature',
            metric: 'Abundance',
            correlation: 0.72,
            description: 'Strong positive correlation - species abundance increases with temperature',
            significance: 'high'
          },
          {
            parameter: 'Salinity',
            metric: 'Diversity',
            correlation: -0.45,
            description: 'Moderate negative correlation - species diversity decreases with higher salinity',
            significance: 'medium'
          },
          {
            parameter: 'pH',
            metric: 'Abundance',
            correlation: 0.38,
            description: 'Weak positive correlation - slight increase in abundance with higher pH',
            significance: 'low'
          }
        ],
        dataPoints: 150,
        synthetic: true,
        message: 'Insufficient real data. Showing synthetic patterns for demonstration.'
      });
    }

    // Aggregate data by time buckets
    const aggregatedData = aggregateByTime(observations, 30);

    // Calculate correlations with aligned pairs (Comment 1 fix)
    const validTemp = aggregatedData.filter(d => d.avgTemperature != null);
    const tempVsAbundance = calculateCorrelation(
      validTemp.map(d => d.avgTemperature),
      validTemp.map(d => d.abundance)
    );
    const tempVsDiversity = calculateCorrelation(
      validTemp.map(d => d.avgTemperature),
      validTemp.map(d => d.diversity)
    );

    const validSal = aggregatedData.filter(d => d.avgSalinity != null);
    const salVsAbundance = calculateCorrelation(
      validSal.map(d => d.avgSalinity),
      validSal.map(d => d.abundance)
    );
    const salVsDiversity = calculateCorrelation(
      validSal.map(d => d.avgSalinity),
      validSal.map(d => d.diversity)
    );

    const correlations = {
      'Temperature vs Abundance': tempVsAbundance,
      'Temperature vs Diversity': tempVsDiversity,
      'Salinity vs Abundance': salVsAbundance,
      'Salinity vs Diversity': salVsDiversity
    };

    // Generate scatter plot data from the same filtered set
    const scatterData = validTemp.map(d => ({
      x: d.avgTemperature,
      y: d.abundance,
      timestamp: d.timestamp
    }));

    // Generate insights
    const insights = Object.entries(correlations)
      .map(([key, value]) => {
        const [parameter, metric] = key.split(' vs ');
        const absValue = Math.abs(value);
        const direction = value > 0 ? 'positive' : 'negative';
        const strength = absValue > 0.7 ? 'Strong' : absValue > 0.4 ? 'Moderate' : 'Weak';
        const significance = absValue > 0.7 ? 'high' : absValue > 0.4 ? 'medium' : 'low';

        return {
          parameter,
          metric,
          correlation: parseFloat(value.toFixed(2)),
          description: `${strength} ${direction} correlation - ${metric.toLowerCase()} ${value > 0 ? 'increases' : 'decreases'} with ${parameter.toLowerCase()}`,
          significance
        };
      })
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    res.json({
      correlations,
      scatterData,
      insights: insights.slice(0, 3),
      dataPoints: observations.length,
      synthetic: false
    });

  } catch (error) {
    console.error('Error fetching correlations:', error.message);
    res.status(500).json({
      error: 'Failed to fetch correlation analysis',
      message: error.message
    });
  }
};

/**
 * GET /api/analytics/predictions
 * Generate time-series predictions for biodiversity metrics
 */
export const getPredictions = async (req, res) => {
  try {
    // Extract query parameters
    const metric = req.query.metric || 'abundance';
    const forecastDays = Math.min(60, Math.max(7, parseInt(req.query.forecastDays) || 30));
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);
    const radiusKm = parseFloat(req.query.radiusKm) || 500;

    // Validate metric
    const validMetrics = ['abundance', 'diversity', 'temperature', 'salinity'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        error: 'Invalid metric',
        message: `Metric must be one of: ${validMetrics.join(', ')}`
      });
    }

    // Query historical data (last 90 days)
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const query = {
      observedDate: { $gte: startDate, $lte: endDate }
    };

    if (!isNaN(latitude) && !isNaN(longitude)) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000
        }
      };
    }

    const observations = await Observation.find(query)
      .limit(1000)
      .select('scientificName observedDate environmentalContext')
      .sort({ observedDate: 1 })
      .lean();

    // If insufficient data, return synthetic predictions
    if (observations.length < 10) {
      return res.json(generateSyntheticPredictions(metric, forecastDays));
    }

    // Aggregate data by daily buckets
    const dailyData = aggregateByTime(observations, 1);

    // Prepare historical data based on metric
    const historicalData = dailyData.map(d => ({
      timestamp: d.timestamp,
      value: metric === 'abundance' ? d.abundance :
             metric === 'diversity' ? d.diversity :
             metric === 'temperature' ? d.avgTemperature :
             metric === 'salinity' ? d.avgSalinity : 0
    })).filter(d => d.value !== null);

    // Guard against insufficient data (Comment 2 fix)
    if (historicalData.length < 2) {
      return res.json(generateSyntheticPredictions(metric, forecastDays));
    }

    // Calculate moving averages
    const sma7 = calculateMovingAverage(historicalData, 7);
    const sma30 = calculateMovingAverage(historicalData, 30);

    // Calculate trend using linear regression on recent data (hardened)
    const recentData = historicalData.slice(-30);
    let slope = 0;
    let intercept = 0;

    if (recentData.length >= 2) {
      const n = recentData.length;
      const sumX = recentData.reduce((sum, d, i) => sum + i, 0);
      const sumY = recentData.reduce((sum, d) => sum + d.value, 0);
      const sumXY = recentData.reduce((sum, d, i) => sum + i * d.value, 0);
      const sumX2 = recentData.reduce((sum, d, i) => sum + i * i, 0);

      const denom = (n * sumX2 - sumX * sumX);
      if (denom !== 0) {
        slope = (n * sumXY - sumX * sumY) / denom;
        intercept = (sumY - slope * sumX) / n;
      } else {
        // Denominator is zero, use mean as intercept
        slope = 0;
        intercept = sumY / n;
      }
    } else {
      // Too few data points, use mean
      const mean = recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length;
      slope = 0;
      intercept = mean;
    }

    // Generate forecast
    const lastValue = historicalData.length > 0 ? historicalData[historicalData.length - 1].value : 0;
    const forecastData = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].timestamp);

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedValue = intercept + slope * (recentData.length + i);
      const confidenceInterval = Math.abs(predictedValue * 0.1); // ±10% for demo

      forecastData.push({
        timestamp: forecastDate,
        predicted: Math.max(0, predictedValue),
        lower: Math.max(0, predictedValue - confidenceInterval),
        upper: predictedValue + confidenceInterval
      });
    }

    // Determine trend direction
    const trendDirection = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    const trendPercentage = lastValue !== 0 ? ((slope * 30 / lastValue) * 100).toFixed(1) : '0.0';

    // Detect anomalies
    const anomalies = detectAnomalies(historicalData);

    res.json({
      historical: historicalData,
      forecast: forecastData,
      trend: {
        direction: trendDirection,
        percentage: parseFloat(trendPercentage),
        slope: parseFloat(slope.toFixed(4))
      },
      anomalies,
      movingAverages: {
        sma7: sma7.slice(-7),
        sma30: sma30.slice(-30)
      },
      metric,
      forecastDays,
      synthetic: false
    });

  } catch (error) {
    console.error('Error generating predictions:', error.message);
    res.status(500).json({
      error: 'Failed to generate predictions',
      message: error.message
    });
  }
};

/**
 * POST /api/analytics/query
 * Handle natural language queries using Langchain
 */
export const handleQuery = async (req, res) => {
  try {
    const { question, filters } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Question is required and must be a string'
      });
    }

    // Check for API key
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      return res.status(503).json({
        error: 'AI query unavailable',
        message: 'AI query requires API key configuration. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to environment variables.',
        answer: 'AI-powered queries are currently unavailable. Please configure an API key to use this feature.',
        confidence: 0
      });
    }

    // Build query for relevant data
    const query = {};
    if (filters?.startDate && filters?.endDate) {
      query.observedDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    // Query MongoDB for relevant observations
    const observations = await Observation.find(query)
      .limit(50)
      .populate('speciesRef', 'scientificName commonName taxonomicStatus')
      .select('scientificName commonName observedDate location depth environmentalContext')
      .lean();

    // Format data as context
    const dataContext = observations.map(obs => {
      return `Species: ${obs.speciesRef?.scientificName || obs.scientificName || 'Unknown'}, ` +
             `Date: ${obs.observedDate ? new Date(obs.observedDate).toISOString().split('T')[0] : 'Unknown'}, ` +
             `Location: [${obs.location?.coordinates?.[1]?.toFixed(2)}, ${obs.location?.coordinates?.[0]?.toFixed(2)}], ` +
             `Depth: ${obs.depth?.value || 'N/A'}m, ` +
             `Temperature: ${obs.environmentalContext?.temperature || 'N/A'}°C, ` +
             `Salinity: ${obs.environmentalContext?.salinity || 'N/A'} PSU`;
    }).join('\n');

    // Initialize Langchain (dynamic import to handle optional dependency)
    let answer = '';
    const sources = observations.slice(0, 5).map(obs => ({
      id: obs._id,
      species: obs.speciesRef?.scientificName || obs.scientificName || 'Unknown',
      date: obs.observedDate
    }));

    try {
      // Try to use Langchain with OpenAI
      if (openaiKey) {
        const { ChatOpenAI } = await import('@langchain/openai');
        const model = new ChatOpenAI({
          modelName: process.env.AI_MODEL || 'gpt-4o-mini',
          temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
          openAIApiKey: openaiKey
        });

        const prompt = `You are a marine biologist AI assistant. Answer the following question based on the oceanographic observation data provided. Be concise and scientific.

Observation Data:
${dataContext}

Question: ${question}

Provide a clear, data-driven answer based on the observations above. If the data is insufficient, acknowledge this limitation.`;

        const response = await model.invoke(prompt);
        answer = response.content;
      } else if (anthropicKey) {
        // Fallback to Anthropic
        const { ChatAnthropic } = await import('@langchain/anthropic');
        const model = new ChatAnthropic({
          modelName: 'claude-3-haiku-20240307',
          temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
          anthropicApiKey: anthropicKey
        });

        const prompt = `You are a marine biologist AI assistant. Answer the following question based on the oceanographic observation data provided. Be concise and scientific.

Observation Data:
${dataContext}

Question: ${question}

Provide a clear, data-driven answer based on the observations above. If the data is insufficient, acknowledge this limitation.`;

        const response = await model.invoke(prompt);
        answer = response.content;
      }

      // Calculate confidence based on data availability
      const confidence = Math.min(1, observations.length / 50);

      res.json({
        answer,
        sources,
        confidence: parseFloat(confidence.toFixed(2)),
        dataPoints: observations.length,
        timestamp: new Date().toISOString()
      });

    } catch (llmError) {
      console.error('LLM Error:', llmError.message);
      
      // Fallback response if LLM fails
      res.json({
        answer: `I found ${observations.length} relevant observations in the database. However, I encountered an error processing your query with AI. Here's what I can tell you: The data includes ${new Set(observations.map(o => o.scientificName)).size} unique species observed between ${filters?.startDate || 'various dates'}. For detailed analysis, please try again or reformulate your question.`,
        sources,
        confidence: 0.5,
        dataPoints: observations.length,
        error: 'LLM processing failed, showing basic summary',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error handling query:', error.message);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message
    });
  }
};

/**
 * Helper: Generate synthetic correlation data for fallback
 */
function generateSyntheticCorrelations() {
  return {
    'Temperature vs Abundance': 0.72,
    'Temperature vs Diversity': 0.58,
    'Salinity vs Abundance': -0.45,
    'Salinity vs Diversity': -0.38
  };
}

/**
 * Helper: Generate synthetic scatter data for fallback
 */
function generateSyntheticScatterData() {
  const data = [];
  for (let i = 0; i < 50; i++) {
    data.push({
      x: 15 + Math.random() * 10, // Temperature 15-25°C
      y: Math.floor(20 + Math.random() * 80), // Abundance 20-100
      timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
    });
  }
  return data;
}

/**
 * Helper: Generate synthetic predictions for fallback
 */
function generateSyntheticPredictions(metric, forecastDays) {
  const historical = [];
  const baseValue = metric === 'temperature' ? 20 : metric === 'salinity' ? 35 : 50;
  const now = new Date();

  // Generate 90 days of historical data
  for (let i = -90; i <= 0; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const noise = (Math.random() - 0.5) * baseValue * 0.2;
    const trend = i * 0.01;
    historical.push({
      timestamp: date,
      value: Math.max(0, baseValue + noise + trend)
    });
  }

  // Generate forecast
  const forecast = [];
  const lastValue = historical[historical.length - 1].value;
  for (let i = 1; i <= forecastDays; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const predicted = lastValue + (i * 0.05);
    const confidence = predicted * 0.1;
    forecast.push({
      timestamp: date,
      predicted: Math.max(0, predicted),
      lower: Math.max(0, predicted - confidence),
      upper: predicted + confidence
    });
  }

  return {
    historical,
    forecast,
    trend: {
      direction: 'increasing',
      percentage: 5.2,
      slope: 0.05
    },
    anomalies: [],
    movingAverages: {
      sma7: historical.slice(-7).map(h => h.value),
      sma30: historical.slice(-30).map(h => h.value)
    },
    metric,
    forecastDays,
    synthetic: true,
    message: 'Insufficient real data. Showing synthetic predictions for demonstration.'
  };
}
