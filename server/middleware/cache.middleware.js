// Simple in-memory cache for API responses
const cache = new Map();

/**
 * Cache middleware for API responses (supports JSON and binary data)
 * @param {number} ttl - Time to live in milliseconds (default 5 minutes)
 */
export const cacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `${req.method}:${req.originalUrl}`;

    // Check if cached data exists and is valid
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < ttl) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Cache HIT: ${cacheKey}`);
      }

      // Restore cached response
      if (cachedEntry.isBinary) {
        // Binary response (e.g., WMS tiles)
        if (cachedEntry.contentType) {
          res.set('Content-Type', cachedEntry.contentType);
        }
        return res.send(cachedEntry.value);
      } else {
        // JSON response
        return res.json(cachedEntry.value);
      }
    }

    // Cache miss - intercept res.json for JSON responses
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      // Store in cache
      cache.set(cacheKey, {
        value: data,
        timestamp: Date.now(),
        isBinary: false
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Cache MISS (JSON): ${cacheKey} - Stored in cache`);
      }

      // Send response normally
      return originalJson(data);
    };

    // Cache miss - intercept res.send for binary responses
    const originalSend = res.send.bind(res);
    res.send = function (data) {
      // Detect binary data (Buffer, ArrayBuffer, Uint8Array)
      const isBinary = Buffer.isBuffer(data) || 
                      data instanceof ArrayBuffer || 
                      data instanceof Uint8Array;

      if (isBinary) {
        // Store binary response in cache
        cache.set(cacheKey, {
          value: data,
          timestamp: Date.now(),
          isBinary: true,
          contentType: res.get('Content-Type') || 'application/octet-stream'
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`Cache MISS (Binary): ${cacheKey} - Stored in cache`);
        }
      }

      // Send response normally
      return originalSend(data);
    };

    next();
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
    console.log(`Cache cleanup: Removed ${deletedCount} expired entries`);
  }
}, 600000); // Run every 10 minutes

/**
 * Clear all cache entries
 */
export const clearCache = () => {
  cache.clear();
  if (process.env.NODE_ENV === 'development') {
    console.log('Cache cleared');
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
};

export default cacheMiddleware;
