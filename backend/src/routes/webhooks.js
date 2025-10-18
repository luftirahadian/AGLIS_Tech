const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * POST /api/webhooks/fonnte
 * Webhook untuk delivery status dari Fonnte
 * 
 * Fonnte akan send POST request dengan data:
 * {
 *   "device": "628179380800",
 *   "message": "...",
 *   "status": "sent" | "delivered" | "read" | "failed",
 *   "target": "628197670700",
 *   "time": "2025-10-18 13:00:00",
 *   "message_id": "126520814"
 * }
 */
router.post('/fonnte', async (req, res) => {
  try {
    const {
      device,
      message,
      status,
      target,
      time,
      message_id
    } = req.body;

    console.log('📥 [Webhook] Fonnte delivery status received:', {
      target,
      status,
      message_id,
      time
    });

    // Update notification status in database
    const updateQuery = `
      UPDATE whatsapp_notifications
      SET 
        status = $1::text,
        provider_message_id = $2::text,
        delivered_at = CASE WHEN $1 = 'delivered' THEN $3::timestamp ELSE delivered_at END,
        read_at = CASE WHEN $1 = 'read' THEN $3::timestamp ELSE read_at END,
        failed_at = CASE WHEN $1 = 'failed' THEN $3::timestamp ELSE failed_at END,
        provider_response = jsonb_set(
          COALESCE(provider_response, '{}'::jsonb),
          '{webhook}',
          $4::jsonb
        )
      WHERE phone_number = $5::text
        AND provider_message_id IS NULL
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      RETURNING id, notification_type, recipient_type
    `;

    const values = [
      status,
      message_id,
      time ? new Date(time) : new Date(),
      JSON.stringify(req.body),
      target
    ];

    const result = await pool.query(updateQuery, values);

    if (result.rows.length > 0) {
      console.log(`✅ [Webhook] Updated ${result.rows.length} notification(s):`, {
        ids: result.rows.map(r => r.id),
        types: result.rows.map(r => r.notification_type),
        status
      });

      // Emit Socket.IO event for real-time UI update
      const io = req.app.get('io');
      if (io) {
        result.rows.forEach(row => {
          io.emit('whatsapp_status_update', {
            notification_id: row.id,
            status,
            target,
            message_id,
            timestamp: time
          });
        });
        console.log('📡 [Socket.IO] Emitted whatsapp_status_update events');
      }

      res.json({
        success: true,
        message: 'Webhook processed',
        updated: result.rows.length
      });
    } else {
      console.log('⚠️ [Webhook] No matching notifications found for:', target);
      res.json({
        success: true,
        message: 'No matching notifications',
        updated: 0
      });
    }

  } catch (error) {
    console.error('❌ [Webhook] Error processing Fonnte webhook:', error);
    // Return 200 to prevent Fonnte from retrying
    res.status(200).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

/**
 * GET /api/webhooks/fonnte/test
 * Test endpoint untuk verify webhook configuration
 */
router.get('/fonnte/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Fonnte webhook endpoint is active',
    timestamp: new Date().toISOString(),
    instructions: {
      method: 'POST',
      url: `${req.protocol}://${req.get('host')}/api/webhooks/fonnte`,
      content_type: 'application/json',
      fonnte_config: {
        step1: 'Login to https://fonnte.com',
        step2: 'Go to Settings → Webhook',
        step3: `Set webhook URL to: ${req.protocol}://${req.get('host')}/api/webhooks/fonnte`,
        step4: 'Enable webhook for: delivered, read, failed events',
        step5: 'Save configuration'
      }
    }
  });
});

module.exports = router;

