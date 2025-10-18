// ═══════════════════════════════════════════════════════════════
// 🔧 WHATSAPP QUEUE WORKER
// Processes WhatsApp messages from the queue
// ═══════════════════════════════════════════════════════════════

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const pool = require('../config/database');
const whatsappService = require('../services/whatsappService');

// Create Redis connection for worker
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Update delivery status in database
const updateDeliveryStatus = async (jobId, status, result) => {
  try {
    await pool.query(`
      UPDATE whatsapp_notifications
      SET status = $1,
          sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END,
          failed_at = CASE WHEN $1 = 'failed' THEN NOW() ELSE failed_at END,
          error_message = $2,
          updated_at = NOW()
      WHERE id = (
        SELECT notification_id FROM queue_jobs WHERE queue_job_id = $3 LIMIT 1
      )
    `, [status, result?.error || null, jobId]);

    console.log(`📱 Delivery status updated: ${jobId} → ${status}`);
  } catch (error) {
    console.error('📱 Failed to update delivery status:', error);
  }
};

// Create worker
const worker = new Worker('whatsapp-messages', async (job) => {
  const { type, data, timestamp } = job.data;
  
  console.log(`📱 [Worker] Processing job ${job.id}: ${type}`);
  console.log(`📱 [Worker] Job data:`, data);
  console.log(`📱 [Worker] Attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);

  try {
    let result;

    switch(type) {
      case 'send-otp':
        // Send OTP message (direct call, already in queue)
        console.log(`📱 [Worker] Sending OTP to ${data.phone}`);
        // Call sendMessage directly to avoid queue recursion
        const templates = require('../templates/whatsappTemplates');
        const otpMessage = templates.otpVerification({
          customerName: data.name || 'Customer',
          otpCode: data.otp,
          expiryMinutes: '5',
          purpose: 'Verifikasi'
        });
        result = await whatsappService.sendMessage(data.phone, otpMessage);
        break;

      case 'send-notification':
        // Send individual notification
        console.log(`📱 [Worker] Sending notification to ${data.phone}`);
        result = await whatsappService.sendMessage(
          data.phone, 
          data.message
        );
        break;

      case 'send-group':
        // Send group message
        console.log(`📱 [Worker] Sending group message to ${data.phone}`);
        result = await whatsappService.sendMessage(
          data.phone, // Can be group ID (xxx@g.us) or regular phone
          data.message
        );
        break;

      case 'send-bulk':
        // Send bulk messages (process each individually)
        console.log(`📱 [Worker] Sending bulk messages to ${data.recipients?.length || 0} recipients`);
        const results = [];
        for (const recipient of data.recipients || []) {
          try {
            const res = await whatsappService.sendMessage(recipient.phone, recipient.message || data.message);
            results.push({ phone: recipient.phone, success: true, result: res });
          } catch (err) {
            results.push({ phone: recipient.phone, success: false, error: err.message });
          }
        }
        result = {
          success: true,
          total: data.recipients?.length || 0,
          succeeded: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        };
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    // Update delivery status
    await updateDeliveryStatus(job.id, 'sent', result);

    console.log(`✅ [Worker] Job ${job.id} completed successfully`);
    
    // Return result
    return {
      success: true,
      jobId: job.id,
      type,
      result,
      processedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ [Worker] Job ${job.id} failed:`, error.message);

    // Update delivery status
    await updateDeliveryStatus(job.id, 'failed', { error: error.message });

    // Check if we should retry
    if (job.attemptsMade < job.opts.attempts - 1) {
      console.log(`🔄 [Worker] Will retry job ${job.id} (attempt ${job.attemptsMade + 2}/${job.opts.attempts})`);
    } else {
      console.log(`⛔ [Worker] Job ${job.id} failed permanently after ${job.opts.attempts} attempts`);
    }

    // Re-throw to trigger BullMQ retry mechanism
    throw error;
  }
}, {
  connection,
  concurrency: 5,  // Process 5 jobs simultaneously
  limiter: {
    max: 100,       // Max 100 jobs
    duration: 60000 // Per 60 seconds (rate limit to prevent API abuse)
  },
  lockDuration: 30000, // Lock job for 30 seconds max
  stalledInterval: 30000, // Check for stalled jobs every 30s
  maxStalledCount: 2 // Job fails if stalled 2 times
});

// Worker event listeners
worker.on('completed', (job, returnvalue) => {
  console.log(`✅ [Worker] Job ${job.id} completed`);
  console.log(`📱 [Worker] Result:`, returnvalue);
});

worker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job.id} failed permanently:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ [Worker] Worker error:', err);
});

worker.on('active', (job) => {
  console.log(`🔄 [Worker] Job ${job.id} started (${job.name})`);
});

worker.on('stalled', (jobId) => {
  console.warn(`⚠️ [Worker] Job ${jobId} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📱 [Worker] SIGTERM received, closing worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📱 [Worker] SIGINT received, closing worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

console.log('📱 WhatsApp Worker: Started successfully');
console.log(`📱 Configuration:`);
console.log(`   - Concurrency: 5 jobs`);
console.log(`   - Rate limit: 100 jobs/minute`);
console.log(`   - Max attempts: 3`);
console.log(`   - Backoff: Exponential (2s, 4s, 8s)`);

module.exports = worker;

