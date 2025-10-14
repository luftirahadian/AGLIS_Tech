// ═══════════════════════════════════════════════════════════════
// 🚀 REDIS CACHE MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
// Intelligent caching for frequently accessed data
// ═══════════════════════════════════════════════════════════════

const { createClient } = require('redis');

// Create Redis client
const redisClient = createClient({
  url: `redis://127.0.0.1:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis Cache Connected'));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis for caching:', error.message);
  }
})();

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
  const { path, method, query, user } = req;
  const queryString = new URLSearchParams(query).toString();
  const userRole = user?.role || 'public';
  return `cache:${method}:${path}:${queryString}:${userRole}`;
};

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 * @param {function} shouldCache - Optional function to determine if request should be cached
 */
const cacheMiddleware = (ttl = 300, shouldCache = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching is enabled
    if (!redisClient.isOpen) {
      return next();
    }

    // Custom shouldCache function
    if (shouldCache && !shouldCache(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      // Try to get from cache
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`💨 Cache HIT: ${cacheKey.substring(0, 100)}...`);
        const data = JSON.parse(cachedData);
        return res.json({
          ...data,
          _cached: true,
          _cache_age: Date.now() - (data._cached_at || Date.now())
        });
      }

      console.log(`🔍 Cache MISS: ${cacheKey.substring(0, 100)}...`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response
        if (res.statusCode === 200 && data.success) {
          const cacheData = {
            ...data,
            _cached_at: Date.now()
          };

          redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheData))
            .then(() => {
              console.log(`💾 Cached: ${cacheKey.substring(0, 100)}... (TTL: ${ttl}s)`);
            })
            .catch((err) => {
              console.error('❌ Cache set error:', err);
            });
        }

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 */
const invalidateCache = async (pattern) => {
  try {
    if (!redisClient.isOpen) {
      return;
    }

    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️  Invalidated ${keys.length} cache entries: ${pattern}`);
    }
  } catch (error) {
    console.error('❌ Cache invalidation error:', error);
  }
};

/**
 * Invalidate all cache
 */
const invalidateAllCache = async () => {
  try {
    if (!redisClient.isOpen) {
      return;
    }

    await redisClient.flushDb();
    console.log('🗑️  All cache cleared');
  } catch (error) {
    console.error('❌ Cache clear error:', error);
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
  try {
    if (!redisClient.isOpen) {
      return { enabled: false };
    }

    const info = await redisClient.info('stats');
    const keys = await redisClient.keys('cache:*');
    
    return {
      enabled: true,
      total_keys: keys.length,
      info: info
    };
  } catch (error) {
    console.error('❌ Cache stats error:', error);
    return { enabled: false, error: error.message };
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateAllCache,
  getCacheStats,
  redisClient
};

