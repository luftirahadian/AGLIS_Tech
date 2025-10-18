// ═══════════════════════════════════════════════════════════════
// 📊 QUEUE MONITORING API
// Endpoints untuk monitoring WhatsApp message queue
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { 
  whatsappQueue, 
  getQueueStats, 
  getJobsByStatus,
  retryJob,
  cleanQueue 
} = require('../queues/whatsappQueue');

/**
 * Get queue statistics
 * GET /api/queue/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue statistics',
      error: error.message
    });
  }
});

/**
 * Get jobs by status
 * GET /api/queue/jobs/:status?page=1&limit=10
 */
router.get('/jobs/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    
    const jobs = await getJobsByStatus(status, start, end);
    
    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total: jobs.length
        }
      }
    });
  } catch (error) {
    console.error(`Failed to get ${req.params.status} jobs:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to get ${req.params.status} jobs`,
      error: error.message
    });
  }
});

/**
 * Get specific job details
 * GET /api/queue/job/:id
 */
router.get('/job/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await whatsappQueue.getJob(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue
      }
    });
  } catch (error) {
    console.error(`Failed to get job ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job details',
      error: error.message
    });
  }
});

/**
 * Retry failed job
 * POST /api/queue/retry/:id
 */
router.post('/retry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await retryJob(id);
    
    if (result) {
      res.json({
        success: true,
        message: `Job ${id} retried successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Job not found or cannot be retried'
      });
    }
  } catch (error) {
    console.error(`Failed to retry job ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry job',
      error: error.message
    });
  }
});

/**
 * Clean old jobs
 * POST /api/queue/clean
 */
router.post('/clean', async (req, res) => {
  try {
    const grace = parseInt(req.body.grace) || 3600; // Default 1 hour
    const result = await cleanQueue(grace);
    
    if (result) {
      res.json({
        success: true,
        message: `Queue cleaned successfully (grace: ${grace}s)`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to clean queue'
      });
    }
  } catch (error) {
    console.error('Failed to clean queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean queue',
      error: error.message
    });
  }
});

/**
 * Pause queue
 * POST /api/queue/pause
 */
router.post('/pause', async (req, res) => {
  try {
    await whatsappQueue.pause();
    
    res.json({
      success: true,
      message: 'Queue paused successfully'
    });
  } catch (error) {
    console.error('Failed to pause queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause queue',
      error: error.message
    });
  }
});

/**
 * Resume queue
 * POST /api/queue/resume
 */
router.post('/resume', async (req, res) => {
  try {
    await whatsappQueue.resume();
    
    res.json({
      success: true,
      message: 'Queue resumed successfully'
    });
  } catch (error) {
    console.error('Failed to resume queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume queue',
      error: error.message
    });
  }
});

module.exports = router;

