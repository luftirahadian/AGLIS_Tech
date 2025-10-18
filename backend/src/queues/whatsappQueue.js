// ═══════════════════════════════════════════════════════════════
// 📱 WHATSAPP MESSAGE QUEUE
// BullMQ-based queue for reliable WhatsApp message delivery
// ═══════════════════════════════════════════════════════════════

const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Create Redis connection for BullMQ
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

connection.on('connect', () => {
  console.log('📱 WhatsApp Queue: Redis connected');
});

connection.on('error', (err) => {
  console.error('📱 WhatsApp Queue: Redis error:', err);
});

// Create WhatsApp message queue
const whatsappQueue = new Queue('whatsapp-messages', {
  connection,
  defaultJobOptions: {
    attempts: 3,              // Retry up to 3 times
    backoff: {
      type: 'exponential',   // Exponential backoff
      delay: 2000            // Start with 2s, then 4s, then 8s
    },
    removeOnComplete: {
      age: 3600,             // Keep completed jobs for 1 hour
      count: 1000            // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400             // Keep failed jobs for 24 hours
    }
  }
});

console.log('📱 WhatsApp Queue: Queue initialized successfully');

// Queue event listeners for monitoring
whatsappQueue.on('error', (error) => {
  console.error('📱 WhatsApp Queue Error:', error);
});

// Helper function to add job to queue
const addWhatsAppJob = async (type, data, options = {}) => {
  try {
    // Set priority based on job type
    const priorityMap = {
      'send-otp': 10,           // Highest priority
      'send-notification': 5,    // Medium priority
      'send-group': 3,          // Low-medium priority
      'send-bulk': 1            // Lowest priority
    };

    const job = await whatsappQueue.add(type, {
      type,
      data,
      timestamp: new Date().toISOString()
    }, {
      priority: options.priority || priorityMap[type] || 5,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      ...options
    });

    console.log(`📱 Job added to queue: ${job.id} (${type})`);
    return job;

  } catch (error) {
    console.error('📱 Failed to add job to queue:', error);
    throw error;
  }
};

// Get queue statistics
const getQueueStats = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      whatsappQueue.getWaitingCount(),
      whatsappQueue.getActiveCount(),
      whatsappQueue.getCompletedCount(),
      whatsappQueue.getFailedCount(),
      whatsappQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  } catch (error) {
    console.error('📱 Failed to get queue stats:', error);
    return null;
  }
};

// Get jobs by status
const getJobsByStatus = async (status, start = 0, end = 9) => {
  try {
    let jobs = [];
    
    switch(status) {
      case 'waiting':
        jobs = await whatsappQueue.getWaiting(start, end);
        break;
      case 'active':
        jobs = await whatsappQueue.getActive(start, end);
        break;
      case 'completed':
        jobs = await whatsappQueue.getCompleted(start, end);
        break;
      case 'failed':
        jobs = await whatsappQueue.getFailed(start, end);
        break;
      case 'delayed':
        jobs = await whatsappQueue.getDelayed(start, end);
        break;
      default:
        return [];
    }

    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason
    }));

  } catch (error) {
    console.error(`📱 Failed to get ${status} jobs:`, error);
    return [];
  }
};

// Retry failed job
const retryJob = async (jobId) => {
  try {
    const job = await whatsappQueue.getJob(jobId);
    if (job) {
      await job.retry();
      console.log(`📱 Job ${jobId} retried`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`📱 Failed to retry job ${jobId}:`, error);
    return false;
  }
};

// Clean old jobs
const cleanQueue = async (grace = 3600) => {
  try {
    await whatsappQueue.clean(grace * 1000, 1000, 'completed');
    await whatsappQueue.clean(grace * 1000, 1000, 'failed');
    console.log(`📱 Queue cleaned (grace period: ${grace}s)`);
    return true;
  } catch (error) {
    console.error('📱 Failed to clean queue:', error);
    return false;
  }
};

module.exports = {
  whatsappQueue,
  addWhatsAppJob,
  getQueueStats,
  getJobsByStatus,
  retryJob,
  cleanQueue
};

