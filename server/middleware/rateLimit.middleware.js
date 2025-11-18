import rateLimit from 'express-rate-limit';
import { isConnected, getRedisClient } from '../config/redis.js';

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * Key generator using IP address
 */
const keyGenerator = (req) => {
  return req.ip || req.connection.remoteAddress;
};

/**
 * General rate limiter for all routes
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/api/health' || req.path === '/api/health/providers';
  }
});

/**
 * Strict rate limiter for external API proxy routes
 * 30 requests per 15 minutes
 * Applied to OBIS, WoRMS, iNaturalist proxies
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many API requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler
});

/**
 * Authentication rate limiter
 * 5 login/signup attempts per 15 minutes
 * Applied to /api/auth/login and /api/auth/signup
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Upload rate limiter for file uploads
 * 10 uploads per 60 minutes
 * Applied to otolith, edna, and data upload routes
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 10,
  message: 'Upload limit reached, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler
});

/**
 * Analytics rate limiter for AI/compute-intensive endpoints
 * 20 requests per 60 minutes
 * Applied to /api/analytics/*
 */
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 20,
  message: 'Analytics request limit reached',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler
});

/**
 * Optional: Redis store for distributed rate limiting
 * Uncomment and install 'rate-limit-redis' if needed for multi-server setup
 * 
 * import RedisStore from 'rate-limit-redis';
 * 
 * const createRedisStore = () => {
 *   if (isConnected()) {
 *     return new RedisStore({
 *       client: getRedisClient(),
 *       prefix: 'rl:' // Rate limit key prefix
 *     });
 *   }
 *   return undefined; // Use default memory store
 * };
 * 
 * Then add to each limiter:
 * store: createRedisStore()
 */

// Export default general limiter
export default generalLimiter;
