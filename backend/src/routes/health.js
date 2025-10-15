const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const redisClient = require('../utils/redisClient');
const whatsappService = require('../services/whatsappService');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Health Check Endpoint
 * 
 * Returns comprehensive system health status
 * Used for monitoring, load balancers, and alerting
 * 
 * GET /api/health
 */

router.get('/', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.5.0',
    environment: process.env.NODE_ENV || 'production',
    checks: {}
  };

  try {
    // 1. Database Check
    try {
      const dbStart = Date.now();
      const result = await pool.query('SELECT NOW(), COUNT(*) as user_count FROM users');
      const dbTime = Date.now() - dbStart;
      
      health.checks.database = {
        status: 'ok',
        responseTime: `${dbTime}ms`,
        connected: true,
        userCount: parseInt(result.rows[0].user_count)
      };
    } catch (error) {
      health.checks.database = {
        status: 'error',
        connected: false,
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // 2. Redis Check
    try {
      const redisStart = Date.now();
      
      // Check if Redis client is connected
      if (redisClient && redisClient.isReady) {
        // Try a simple command
        await redisClient.set('health_check', Date.now(), 'EX', 10);
        await redisClient.get('health_check');
        const redisTime = Date.now() - redisStart;
        
        health.checks.redis = {
          status: 'ok',
          responseTime: `${redisTime}ms`,
          connected: true
        };
      } else {
        health.checks.redis = {
          status: 'warning',
          connected: false,
          message: 'Redis client not ready'
        };
        if (health.status === 'healthy') {
          health.status = 'degraded';
        }
      }
    } catch (error) {
      health.checks.redis = {
        status: 'warning',
        connected: false,
        error: error.message
      };
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }

    // 3. WhatsApp Service Check
    try {
      health.checks.whatsapp = {
        status: 'ok',
        enabled: whatsappService.enabled,
        provider: whatsappService.provider,
        failoverEnabled: whatsappService.enableFailover
      };
    } catch (error) {
      health.checks.whatsapp = {
        status: 'error',
        error: error.message
      };
    }

    // 4. Disk Space Check
    try {
      const diskInfo = execSync('df -h / | tail -1').toString();
      const diskParts = diskInfo.trim().split(/\s+/);
      const diskUsedPercent = parseInt(diskParts[4]);
      
      health.checks.disk = {
        status: diskUsedPercent > 90 ? 'critical' : diskUsedPercent > 80 ? 'warning' : 'ok',
        used: diskParts[4],
        available: diskParts[3],
        mounted: diskParts[5]
      };
      
      if (diskUsedPercent > 90) {
        health.status = 'critical';
      } else if (diskUsedPercent > 80 && health.status === 'healthy') {
        health.status = 'warning';
      }
    } catch (error) {
      health.checks.disk = {
        status: 'error',
        error: 'Could not retrieve disk info'
      };
    }

    // 5. Memory Check
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = ((usedMem / totalMem) * 100).toFixed(2);
    
    health.checks.memory = {
      status: memPercent > 90 ? 'warning' : 'ok',
      total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)}GB`,
      used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)}GB`,
      free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)}GB`,
      usedPercent: `${memPercent}%`
    };

    // 6. System Info
    health.system = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpus: os.cpus().length,
      hostname: os.hostname(),
      loadAverage: os.loadavg()
    };

    // 7. Response Time
    health.responseTime = `${Date.now() - startTime}ms`;

    // Determine final status
    const hasError = Object.values(health.checks).some(check => check.status === 'error');
    const hasCritical = Object.values(health.checks).some(check => check.status === 'critical');
    const hasWarning = Object.values(health.checks).some(check => check.status === 'warning');

    if (hasError || hasCritical) {
      health.status = 'unhealthy';
    } else if (hasWarning && health.status === 'healthy') {
      health.status = 'degraded';
    }

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: health.checks
    });
  }
});

/**
 * Readiness Check
 * Returns 200 if ready to serve traffic
 * Used by load balancers
 */
router.get('/ready', async (req, res) => {
  try {
    // Quick database check
    await pool.query('SELECT 1');
    
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message
    });
  }
});

/**
 * Liveness Check
 * Returns 200 if process is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

