/**
 * Query Performance Logger Middleware
 * 
 * Monitors database query performance and logs slow queries
 * Helps identify bottlenecks and optimization opportunities
 */

const pool = require('../config/database');

// Configuration
const SLOW_QUERY_THRESHOLD_MS = 1000; // Log queries slower than 1 second
const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING === 'true' || process.env.NODE_ENV === 'development';

// Query statistics
const queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  totalTime: 0,
  slowestQueries: []
};

/**
 * Wrap pool.query to add performance monitoring
 */
const originalQuery = pool.query.bind(pool);

pool.query = function(...args) {
  if (!ENABLE_QUERY_LOGGING) {
    return originalQuery(...args);
  }

  const startTime = Date.now();
  const queryText = typeof args[0] === 'string' ? args[0] : args[0]?.text || 'Unknown';
  
  // Execute original query
  const queryPromise = originalQuery(...args);
  
  // Log performance after query completes
  queryPromise
    .then((result) => {
      const duration = Date.now() - startTime;
      queryStats.totalQueries++;
      queryStats.totalTime += duration;
      
      // Log slow queries
      if (duration > SLOW_QUERY_THRESHOLD_MS) {
        queryStats.slowQueries++;
        
        const slowQuery = {
          query: queryText.substring(0, 200), // First 200 chars
          duration,
          timestamp: new Date().toISOString(),
          rows: result?.rows?.length || 0
        };
        
        // Keep only top 10 slowest queries
        queryStats.slowestQueries.push(slowQuery);
        queryStats.slowestQueries.sort((a, b) => b.duration - a.duration);
        queryStats.slowestQueries = queryStats.slowestQueries.slice(0, 10);
        
        console.warn(`⚠️ SLOW QUERY (${duration}ms):`, {
          duration: `${duration}ms`,
          query: queryText.substring(0, 150) + '...',
          rows: result?.rows?.length || 0,
          threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`
        });
      } else if (duration > 100) {
        // Log queries slower than 100ms but not "slow"
        console.log(`⏱️ Query took ${duration}ms (${result?.rows?.length || 0} rows)`);
      }
      
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      console.error(`❌ QUERY ERROR (${duration}ms):`, {
        error: error.message,
        query: queryText.substring(0, 150) + '...'
      });
      throw error;
    });
  
  return queryPromise;
};

/**
 * Get query statistics
 */
function getQueryStats() {
  const avgTime = queryStats.totalQueries > 0 
    ? (queryStats.totalTime / queryStats.totalQueries).toFixed(2) 
    : 0;
  
  return {
    totalQueries: queryStats.totalQueries,
    slowQueries: queryStats.slowQueries,
    slowQueryPercentage: queryStats.totalQueries > 0 
      ? ((queryStats.slowQueries / queryStats.totalQueries) * 100).toFixed(2) + '%' 
      : '0%',
    averageQueryTime: avgTime + 'ms',
    totalTime: queryStats.totalTime + 'ms',
    slowestQueries: queryStats.slowestQueries
  };
}

/**
 * Reset query statistics
 */
function resetQueryStats() {
  queryStats.totalQueries = 0;
  queryStats.slowQueries = 0;
  queryStats.totalTime = 0;
  queryStats.slowestQueries = [];
}

/**
 * Express middleware to log query stats in response headers
 */
function queryStatsMiddleware(req, res, next) {
  const startQueries = queryStats.totalQueries;
  const startTime = Date.now();
  
  // Override res.json to add stats before sending
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const requestTime = Date.now() - startTime;
    const queriesCount = queryStats.totalQueries - startQueries;
    
    // Add performance headers
    res.set('X-Query-Count', queriesCount.toString());
    res.set('X-Request-Time', requestTime + 'ms');
    
    // Log if request took > 2 seconds
    if (requestTime > 2000) {
      console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.path}`, {
        duration: `${requestTime}ms`,
        queries: queriesCount,
        avgPerQuery: queriesCount > 0 ? `${(requestTime / queriesCount).toFixed(2)}ms` : 'N/A'
      });
    }
    
    return originalJson(data);
  };
  
  next();
}

module.exports = {
  queryStatsMiddleware,
  getQueryStats,
  resetQueryStats
};

