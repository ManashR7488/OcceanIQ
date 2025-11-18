import { getRedisClient, isConnected } from '../config/redis.js';

// Simple in-memory cache for API responses (fallback when Redis unavailable)
const cache = new Map();

// Cache statistics
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Cache middleware for API responses (supports JSON and binary data)
 * Uses Redis when available, falls back to in-memory cache
 * @param {number} ttl - Time to live in milliseconds (default 5 minutes)
 */
export const cacheMiddleware = (ttl = 300000) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `${req.method}:${req.originalUrl}`;
    const useRedis = isConnected();

    try {
      // Check cache (Redis or in-memory)
      let cachedEntry = null;

      if (useRedis) {
        // Try Redis cache
        const redisClient = getRedisClient();
        let cachedData = await redisClient.get(cacheKey);
        
        if (cachedData) {
          cachedEntry = JSON.parse(cachedData);
          cacheHits++;
          res.locals.cached = true;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Redis Cache HIT: ${cacheKey}`);
          }

          // Restore cached response
          if (cachedEntry.isBinary) {
            // Binary response (convert from base64 back to Buffer)
            const buffer = Buffer.from(cachedEntry.value, 'base64');
            if (cachedEntry.contentType) {
              res.set('Content-Type', cachedEntry.contentType);
            }
            return res.send(buffer);
          } else {
            // JSON response
            return res.json(cachedEntry.value);
          }
        }
        
        // If not found, try with binary prefix
        const binaryCachedData = await redisClient.get(`binary:${cacheKey}`);
        if (binaryCachedData) {
          cachedEntry = JSON.parse(binaryCachedData);
          cacheHits++;
          res.locals.cached = true;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Redis Cache HIT (Binary): binary:${cacheKey}`);
          }

          // Restore binary response
          if (cachedEntry.isBinary) {
            const buffer = Buffer.from(cachedEntry.value, 'base64');
            if (cachedEntry.contentType) {
              res.set('Content-Type', cachedEntry.contentType);
            }
            return res.send(buffer);
          }
        }
      } else {
        // Try in-memory cache
        cachedEntry = cache.get(cacheKey);
        
        if (cachedEntry && Date.now() - cachedEntry.timestamp < ttl) {
          cacheHits++;
          res.locals.cached = true;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Memory Cache HIT: ${cacheKey}`);
          }

          // Restore cached response
          if (cachedEntry.isBinary) {
            if (cachedEntry.contentType) {
              res.set('Content-Type', cachedEntry.contentType);
            }
            return res.send(cachedEntry.value);
          } else {
            return res.json(cachedEntry.value);
          }
        }
      }

      // Cache miss
      cacheMisses++;

      // Intercept res.json for JSON responses
      const originalJson = res.json.bind(res);
      res.json = async function (data) {
        const cacheEntry = {
          value: data,
          timestamp: Date.now(),
          isBinary: false
        };

        // Store in cache (Redis or in-memory)
        if (useRedis) {
          try {
            const redisClient = getRedisClient();
            const ttlSeconds = Math.floor(ttl / 1000);
            await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(cacheEntry));
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`📝 Redis Cache MISS (JSON): ${cacheKey} - Stored with TTL ${ttlSeconds}s`);
            }
          } catch (redisError) {
            console.warn('⚠️  Redis cache write failed, falling back to memory:', redisError.message);
            cache.set(cacheKey, cacheEntry);
          }
        } else {
          cache.set(cacheKey, cacheEntry);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`📝 Memory Cache MISS (JSON): ${cacheKey} - Stored in memory`);
          }
        }

        // Send response normally
        return originalJson(data);
      };

      // Intercept res.send for binary responses
      const originalSend = res.send.bind(res);
      res.send = async function (data) {
        // Detect binary data (Buffer, ArrayBuffer, Uint8Array)
        const isBinary = Buffer.isBuffer(data) || 
                        data instanceof ArrayBuffer || 
                        data instanceof Uint8Array;

        if (isBinary) {
          const cacheEntry = {
            value: useRedis ? data.toString('base64') : data, // Store as base64 in Redis
            timestamp: Date.now(),
            isBinary: true,
            contentType: res.get('Content-Type') || 'application/octet-stream'
          };

          // Store binary response in cache
          if (useRedis) {
            try {
              const redisClient = getRedisClient();
              const ttlSeconds = Math.floor(ttl / 1000);
              await redisClient.setEx(`binary:${cacheKey}`, ttlSeconds, JSON.stringify(cacheEntry));
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`📝 Redis Cache MISS (Binary): ${cacheKey} - Stored with TTL ${ttlSeconds}s`);
              }
            } catch (redisError) {
              console.warn('⚠️  Redis cache write failed, falling back to memory:', redisError.message);
              cache.set(cacheKey, { ...cacheEntry, value: data }); // Store Buffer in memory
            }
          } else {
            cache.set(cacheKey, cacheEntry);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`📝 Memory Cache MISS (Binary): ${cacheKey} - Stored in memory`);
            }
          }
        }

        // Send response normally
        return originalSend(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Cleanup expired cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, entry] of cache.entries()) {
    // Default TTL of 10 minutes for cleanup
    if (now - entry.timestamp > 600000) {
      cache.delete(key);
      deletedCount++;
    }
  }

  if (deletedCount > 0 && process.env.NODE_ENV === 'development') {
    console.log(`🧹 Cache cleanup: Removed ${deletedCount} expired entries from memory`);
  }
}, 600000); // Run every 10 minutes

/**
 * Clear all cache entries (both Redis and in-memory)
 */
export const clearCache = async () => {
  // Clear in-memory cache
  cache.clear();
  
  // Clear Redis cache if available
  if (isConnected()) {
    try {
      const redisClient = getRedisClient();
      await redisClient.flushDb();
      console.log('✅ Cache cleared (Redis + Memory)');
    } catch (error) {
      console.warn('⚠️  Failed to clear Redis cache:', error.message);
      console.log('✅ Cache cleared (Memory only)');
    }
  } else {
    console.log('✅ Cache cleared (Memory only)');
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  const stats = {
    memory: {
      size: cache.size,
      entries: Array.from(cache.keys())
    },
    stats: {
      hits: cacheHits,
      misses: cacheMisses,
      hitRate: cacheHits + cacheMisses > 0 ? (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2) + '%' : '0%'
    },
    redis: {
      connected: isConnected(),
      mode: isConnected() ? 'redis' : 'in-memory'
    }
  };

  // Get Redis stats if available
  if (isConnected()) {
    try {
      const redisClient = getRedisClient();
      const info = await redisClient.info('stats');
      const dbSize = await redisClient.dbSize();
      
      stats.redis.keys = dbSize;
      stats.redis.info = info;
    } catch (error) {
      console.warn('⚠️  Failed to get Redis stats:', error.message);
    }
  }

  return stats;
};

export default cacheMiddleware;
