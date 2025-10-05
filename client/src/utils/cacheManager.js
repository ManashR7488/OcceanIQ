/**
 * Simple client-side cache manager for API responses
 * Reduces redundant network requests by caching responses in browser memory
 */
class CacheManager {
  constructor(maxSize = 50, ttl = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live in milliseconds (default 5 minutes)
    
    // Start automatic cleanup
    this.startCleanup();
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = JSON.stringify(params);
    return `${url}:${paramString}`;
  }

  /**
   * Get cached value if exists and not expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Store value in cache with timestamp
   */
  set(key, value) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    const value = this.get(key);
    return value !== null;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  clearExpired() {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Client cache cleanup: Removed ${deletedCount} expired entries`);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanup() {
    setInterval(() => {
      this.clearExpired();
    }, 60000); // Run every 60 seconds
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// Export singleton instance
export const apiCache = new CacheManager();

/**
 * Helper function to get cached data or fetch if miss
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if cache miss
 * @returns {Promise} Cached or fetched data
 */
export async function getCachedOrFetch(key, fetchFn) {
  // Check cache first
  const cached = apiCache.get(key);
  if (cached !== null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache HIT: ${key}`);
    }
    return cached;
  }

  // Cache miss - fetch data
  if (process.env.NODE_ENV === 'development') {
    console.log(`Cache MISS: ${key}`);
  }

  const data = await fetchFn();
  
  // Store in cache
  apiCache.set(key, data);
  
  return data;
}

export default CacheManager;
