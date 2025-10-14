// ═══════════════════════════════════════════════════════════════
// 📱 MOBILE PUSH NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════
// Handles device registration and push notification delivery via FCM
// ═══════════════════════════════════════════════════════════════

const pool = require('../config/database');

/**
 * NOTE: Firebase Cloud Messaging (FCM) Integration
 * 
 * To enable push notifications, you need to:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Add your app (Android/iOS/Web) to the project
 * 3. Download service account key JSON
 * 4. Install: npm install firebase-admin
 * 5. Set environment variable: FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json
 * 
 * For now, this service provides the infrastructure without FCM dependency.
 * Uncomment FCM integration code when ready to deploy.
 */

// Uncomment when Firebase is configured:
// const admin = require('firebase-admin');
// const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
// 
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

class MobilePushService {
  constructor() {
    this.fcmEnabled = false; // Set to true when Firebase is configured
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 DEVICE MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Register device for push notifications
   */
  async registerDevice(userId, deviceData) {
    const {
      device_token,
      device_type, // 'android', 'ios', 'web'
      device_name,
      device_model,
      os_version,
      app_version
    } = deviceData;

    // Check if device already exists
    const existing = await pool.query(
      `SELECT id FROM user_devices WHERE device_token = $1`,
      [device_token]
    );

    if (existing.rows.length > 0) {
      // Update existing device
      const result = await pool.query(
        `UPDATE user_devices SET
          user_id = $1,
          device_name = COALESCE($2, device_name),
          device_model = COALESCE($3, device_model),
          os_version = COALESCE($4, os_version),
          app_version = COALESCE($5, app_version),
          is_active = true,
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE device_token = $6
        RETURNING *`,
        [userId, device_name, device_model, os_version, app_version, device_token]
      );
      
      return result.rows[0];
    } else {
      // Create new device
      const result = await pool.query(
        `INSERT INTO user_devices (
          user_id, device_token, device_type, device_name,
          device_model, os_version, app_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [userId, device_token, device_type, device_name, device_model, os_version, app_version]
      );
      
      return result.rows[0];
    }
  }

  /**
   * Unregister device
   */
  async unregisterDevice(deviceToken) {
    const result = await pool.query(
      `UPDATE user_devices SET is_active = false WHERE device_token = $1 RETURNING *`,
      [deviceToken]
    );
    
    return result.rows[0];
  }

  /**
   * Get user devices
   */
  async getUserDevices(userId) {
    const result = await pool.query(
      `SELECT * FROM user_devices 
       WHERE user_id = $1 AND is_active = true
       ORDER BY last_active_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  /**
   * Update device last active time
   */
  async updateDeviceActivity(deviceToken) {
    await pool.query(
      `UPDATE user_devices SET last_active_at = CURRENT_TIMESTAMP WHERE device_token = $1`,
      [deviceToken]
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📤 PUSH NOTIFICATION SENDING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Send push notification to user
   */
  async sendPushNotification(userId, notification) {
    // Get user's active devices
    const devices = await this.getUserDevices(userId);
    
    if (devices.length === 0) {
      console.log(`📱 No active devices for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const { title, message, data, priority } = notification;
    let sent = 0;
    let failed = 0;

    for (const device of devices) {
      try {
        if (this.fcmEnabled) {
          // Send via FCM (uncomment when configured)
          // await this.sendFCMNotification(device.device_token, {
          //   title,
          //   body: message,
          //   data: data || {},
          //   priority: priority === 'urgent' ? 'high' : 'normal'
          // });
          
          // Log delivery
          await this.logPushDelivery(notification.id, device.id, 'sent', null);
          sent++;
        } else {
          // Simulate push notification (for testing)
          console.log(`📱 [SIMULATED] Push to ${device.device_type}: ${title}`);
          await this.logPushDelivery(notification.id, device.id, 'sent', 'Simulated (FCM not configured)');
          sent++;
        }
      } catch (error) {
        console.error(`❌ Failed to send push to device ${device.id}:`, error.message);
        await this.logPushDelivery(notification.id, device.id, 'failed', error.message);
        failed++;
      }
    }

    return { sent, failed, total: devices.length };
  }

  /**
   * Send FCM notification (Firebase Cloud Messaging)
   * Uncomment when Firebase is configured
   */
  // async sendFCMNotification(deviceToken, payload) {
  //   const message = {
  //     token: deviceToken,
  //     notification: {
  //       title: payload.title,
  //       body: payload.body
  //     },
  //     data: payload.data,
  //     android: {
  //       priority: payload.priority,
  //       notification: {
  //         sound: 'default',
  //         clickAction: 'FLUTTER_NOTIFICATION_CLICK'
  //       }
  //     },
  //     apns: {
  //       payload: {
  //         aps: {
  //           sound: 'default',
  //           badge: 1
  //         }
  //       }
  //     },
  //     webpush: {
  //       notification: {
  //         title: payload.title,
  //         body: payload.body,
  //         icon: '/icons/notification-icon.png'
  //       }
  //     }
  //   };
  //
  //   const response = await admin.messaging().send(message);
  //   return response;
  // }

  /**
   * Send push to multiple users
   */
  async sendBulkPush(userIds, notification) {
    const results = {
      total: userIds.length,
      sent: 0,
      failed: 0,
      details: []
    };

    for (const userId of userIds) {
      try {
        const result = await this.sendPushNotification(userId, notification);
        results.sent += result.sent;
        results.failed += result.failed;
        results.details.push({ userId, ...result });
      } catch (error) {
        console.error(`❌ Failed to send push to user ${userId}:`, error.message);
        results.failed++;
        results.details.push({ userId, error: error.message });
      }
    }

    return results;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 PUSH DELIVERY TRACKING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Log push notification delivery
   */
  async logPushDelivery(notificationId, deviceId, status, errorMessage = null) {
    const timestamps = {};
    
    if (status === 'sent') {
      timestamps.sent_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'delivered') {
      timestamps.delivered_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'clicked') {
      timestamps.clicked_at = 'CURRENT_TIMESTAMP';
    }

    await pool.query(
      `INSERT INTO notification_push_log (
        notification_id, device_id, status, ${Object.keys(timestamps).join(', ')}, error_message
      ) VALUES ($1, $2, $3, ${Object.values(timestamps).join(', ')}, $4)`,
      [notificationId, deviceId, status, errorMessage]
    );
  }

  /**
   * Update push delivery status
   */
  async updatePushStatus(notificationId, deviceId, status) {
    const updates = { status };
    
    if (status === 'delivered') {
      updates.delivered_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'clicked') {
      updates.clicked_at = 'CURRENT_TIMESTAMP';
    }

    const setClause = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 3}`)
      .join(', ');

    await pool.query(
      `UPDATE notification_push_log SET ${setClause}
       WHERE notification_id = $1 AND device_id = $2`,
      [notificationId, deviceId, ...Object.values(updates)]
    );
  }

  /**
   * Get push delivery stats
   */
  async getPushStats(notificationId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM notification_push_log
      WHERE notification_id = $1`,
      [notificationId]
    );
    
    return result.rows[0];
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧹 CLEANUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Clean up inactive devices
   */
  async cleanupInactiveDevices(daysInactive = 90) {
    const result = await pool.query(
      `DELETE FROM user_devices 
       WHERE last_active_at < CURRENT_TIMESTAMP - INTERVAL '${daysInactive} days'
       RETURNING id`,
      []
    );
    
    console.log(`🧹 Cleaned up ${result.rows.length} inactive devices`);
    return { deleted: result.rows.length };
  }
}

module.exports = new MobilePushService();

