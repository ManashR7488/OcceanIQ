import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import authRoute from "./routes/auth.route.js";
import mapRoute from './routes/map.route.js';
import dashboardRoute from './routes/dashboard.route.js';
import biodiversityRoute from './routes/biodiversity.route.js';
import otolithRoute from './routes/otolith.route.js';
import taxonomyRoute from './routes/taxonomy.route.js';
import ednaRoute from './routes/edna.route.js';
import dataRoute from './routes/data.route.js';
import aiRoute from './routes/ai.route.js';
import analyticsRoute from './routes/analytics.route.js';
import communityRoute from './routes/community.route.js';
import { cacheMiddleware } from './middleware/cache.middleware.js';
import { 
  generalLimiter, 
  strictLimiter, 
  authLimiter, 
  uploadLimiter, 
  analyticsLimiter 
} from './middleware/rateLimit.middleware.js';
import { getRedisClient, isConnected as isRedisConnected, disconnect as disconnectRedis } from './config/redis.js';
import connectDB from "./config/db.js";
import { validateProviderConfig, getProviderStatus } from './config/speciesProviders.config.js';





const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const origin =
  process.env.NODE_ENV !== "development"
    ? process.env.CORS_ORIGIN
    : "http://localhost:5173";

app.use(
  cors({
    origin: origin,
    credentials: true,
  })
);

// HTTP request logging with Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Colored output for development
} else {
  app.use(morgan('combined')); // Standard Apache combined log format for production
}

// Apply general rate limiter to all routes
// app.use(generalLimiter);

let isConnected = false;

const connectInServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
    isConnected = true;
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectInServer();
    isConnected = true;
  }
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "API is running...",
    greet: "Hello from Oceaniq Backend",
    time: new Date().toLocaleString(),
  });
});

app.use("/api/auth", authLimiter, authRoute);
app.use('/api/map', strictLimiter, cacheMiddleware(300000), mapRoute); // 5 min cache, strict rate limit
app.use('/api/dashboard', dashboardRoute);
app.use('/api/biodiversity', strictLimiter, cacheMiddleware(600000), biodiversityRoute); // 10 min cache, strict rate limit
app.use('/api/otolith', otolithRoute);
app.use('/api/taxonomy', taxonomyRoute);
app.use('/api/edna', ednaRoute); // eDNA Processing module
app.use('/api/data', uploadLimiter, dataRoute); // Data ingestion endpoints with upload rate limit
app.use('/api/analytics', analyticsLimiter, analyticsRoute); // AI-powered analytics endpoints with compute rate limit
app.use('/api/ai', aiRoute); // AI chat and text generation with strict rate limit
app.use('/api/community', communityRoute); // Community discussion forum with rate limiting on posts

// Health check endpoint for provider status
app.get("/api/health/providers", (req, res) => {
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  
  const status = getProviderStatus();
  
  res.json({
    success: true,
    cloudinary: {
      configured: cloudinaryConfigured,
      status: cloudinaryConfigured ? "operational" : "not configured"
    },
    speciesIdentification: {
      enabledProviders: status.enabled,
      preferredMode: status.primaryProvider,
      roboflow: {
        enabled: status.details.roboflow.enabled,
        configured: status.details.roboflow.enabled
      },
      google: {
        enabled: status.details.google.enabled,
        configured: status.details.google.enabled
      },
      fallback: {
        enabled: status.details.fallback.enabled,
        configured: status.details.fallback.enabled
      }
    },
    redis: {
      connected: isRedisConnected(),
      status: isRedisConnected() ? "connected" : "disconnected",
      mode: isRedisConnected() ? "redis" : "in-memory"
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  // await connectDB();
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  
  // Log Redis connection status on startup
  // if (isRedisConnected()) {
  //   console.log('✅ Redis cache is active');
  // } else {
  //   console.log('📝 Using in-memory cache (Redis not available)');
  // }
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  try {
    // Close Redis connection
    if (isRedisConnected()) {
      await disconnectRedis();
    }
    
    // Close MongoDB connection
    if (isConnected) {
      const mongoose = (await import('mongoose')).default;
      await mongoose.connection.close();
      console.log('✅ MongoDB: Disconnected gracefully');
    }
    
    console.log('✅ Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;