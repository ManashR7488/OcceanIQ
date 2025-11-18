import { createClient } from 'redis';

// Redis client instance
let redisClient = null;
let isRedisAvailable = false;

// Redis connection configuration
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('❌ Redis: Max retry attempts reached. Using in-memory cache.');
        return new Error('Max retry attempts reached');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
      return Math.min(retries * 50, 3000);
    }
  }
};

// Add password if configured
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

// Add TLS if configured
if (process.env.REDIS_TLS === 'true') {
  redisConfig.socket.tls = true;
  redisConfig.socket.rejectUnauthorized = false;
}

// Create Redis client
redisClient = createClient(redisConfig);

// Connection event handlers
redisClient.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

redisClient.on('ready', () => {
  isRedisAvailable = true;
  console.log('✅ Redis: Connected successfully');
});

redisClient.on('error', (err) => {
  isRedisAvailable = false;
  console.warn('⚠️  Redis: Connection error -', err.message);
  console.log('📝 Redis: Falling back to in-memory cache');
});

redisClient.on('end', () => {
  isRedisAvailable = false;
  console.log('🔌 Redis: Connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

// Initialize Redis connection (non-blocking)
try {
  await redisClient.connect();
} catch (error) {
  console.warn('⚠️  Redis: Failed to connect -', error.message);
  console.log('📝 Redis: Application will use in-memory cache');
  isRedisAvailable = false;
}

/**
 * Get Redis client instance
 * @returns {Object} Redis client
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is connected
 * @returns {boolean} Connection status
 */
export const isConnected = () => {
  return isRedisAvailable && redisClient && redisClient.isReady;
};

/**
 * Gracefully disconnect Redis
 * @returns {Promise<void>}
 */
export const disconnect = async () => {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      console.log('✅ Redis: Disconnected gracefully');
    } catch (error) {
      console.error('❌ Redis: Error during disconnect:', error.message);
    }
  }
};

// Export connection status flag
export { isRedisAvailable };

export default redisClient;
