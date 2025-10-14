// ═══════════════════════════════════════════════════════════════
// ⚙️ ADVANCED NOTIFICATION SETTINGS SERVICE
// ═══════════════════════════════════════════════════════════════
// Manages granular user notification preferences
// ═══════════════════════════════════════════════════════════════

const pool = require('../config/database');

class NotificationSettingsAdvancedService {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚙️ SETTINGS MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get advanced settings for user
   * Creates default settings if not exists
   */
  async getSettings(userId) {
    let result = await pool.query(
      `SELECT * FROM notification_settings_advanced WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      result = await pool.query(
        `INSERT INTO notification_settings_advanced (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
    }

    return result.rows[0];
  }

  /**
   * Update advanced settings
   */
  async updateSettings(userId, settings) {
    const {
      web_notifications,
      mobile_push,
      email_notifications,
      sms_notifications,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      quiet_hours_timezone,
      dnd_enabled,
      dnd_until,
      batch_notifications,
      batch_interval,
      show_low_priority,
      show_normal_priority,
      show_high_priority,
      show_urgent_priority,
      type_settings,
      group_by_type,
      group_by_priority,
      auto_archive_after_days,
      auto_delete_after_days,
      daily_digest,
      weekly_digest,
      digest_time
    } = settings;

    const result = await pool.query(
      `INSERT INTO notification_settings_advanced (
        user_id, web_notifications, mobile_push, email_notifications, sms_notifications,
        quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone,
        dnd_enabled, dnd_until, batch_notifications, batch_interval,
        show_low_priority, show_normal_priority, show_high_priority, show_urgent_priority,
        type_settings, group_by_type, group_by_priority,
        auto_archive_after_days, auto_delete_after_days,
        daily_digest, weekly_digest, digest_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (user_id) DO UPDATE SET
        web_notifications = COALESCE($2, notification_settings_advanced.web_notifications),
        mobile_push = COALESCE($3, notification_settings_advanced.mobile_push),
        email_notifications = COALESCE($4, notification_settings_advanced.email_notifications),
        sms_notifications = COALESCE($5, notification_settings_advanced.sms_notifications),
        quiet_hours_enabled = COALESCE($6, notification_settings_advanced.quiet_hours_enabled),
        quiet_hours_start = COALESCE($7, notification_settings_advanced.quiet_hours_start),
        quiet_hours_end = COALESCE($8, notification_settings_advanced.quiet_hours_end),
        quiet_hours_timezone = COALESCE($9, notification_settings_advanced.quiet_hours_timezone),
        dnd_enabled = COALESCE($10, notification_settings_advanced.dnd_enabled),
        dnd_until = COALESCE($11, notification_settings_advanced.dnd_until),
        batch_notifications = COALESCE($12, notification_settings_advanced.batch_notifications),
        batch_interval = COALESCE($13, notification_settings_advanced.batch_interval),
        show_low_priority = COALESCE($14, notification_settings_advanced.show_low_priority),
        show_normal_priority = COALESCE($15, notification_settings_advanced.show_normal_priority),
        show_high_priority = COALESCE($16, notification_settings_advanced.show_high_priority),
        show_urgent_priority = COALESCE($17, notification_settings_advanced.show_urgent_priority),
        type_settings = COALESCE($18, notification_settings_advanced.type_settings),
        group_by_type = COALESCE($19, notification_settings_advanced.group_by_type),
        group_by_priority = COALESCE($20, notification_settings_advanced.group_by_priority),
        auto_archive_after_days = COALESCE($21, notification_settings_advanced.auto_archive_after_days),
        auto_delete_after_days = COALESCE($22, notification_settings_advanced.auto_delete_after_days),
        daily_digest = COALESCE($23, notification_settings_advanced.daily_digest),
        weekly_digest = COALESCE($24, notification_settings_advanced.weekly_digest),
        digest_time = COALESCE($25, notification_settings_advanced.digest_time),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userId, web_notifications, mobile_push, email_notifications, sms_notifications,
        quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone,
        dnd_enabled, dnd_until, batch_notifications, batch_interval,
        show_low_priority, show_normal_priority, show_high_priority, show_urgent_priority,
        type_settings ? JSON.stringify(type_settings) : null,
        group_by_type, group_by_priority,
        auto_archive_after_days, auto_delete_after_days,
        daily_digest, weekly_digest, digest_time
      ]
    );

    return result.rows[0];
  }

  /**
   * Update type-specific settings
   */
  async updateTypeSettings(userId, type, typeSettings) {
    const currentSettings = await this.getSettings(userId);
    const allTypeSettings = currentSettings.type_settings || {};
    
    allTypeSettings[type] = typeSettings;

    await pool.query(
      `UPDATE notification_settings_advanced 
       SET type_settings = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [JSON.stringify(allTypeSettings), userId]
    );

    return { success: true, type_settings: allTypeSettings };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 SETTINGS VALIDATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Check if user should receive notification based on settings
   */
  async shouldReceiveNotification(userId, notification) {
    const settings = await this.getSettings(userId);
    const { type, priority } = notification;

    // Check Do Not Disturb
    if (settings.dnd_enabled) {
      if (!settings.dnd_until || new Date(settings.dnd_until) > new Date()) {
        // Only allow urgent notifications during DND
        if (priority !== 'urgent') {
          return { allowed: false, reason: 'dnd_enabled' };
        }
      }
    }

    // Check quiet hours
    if (settings.quiet_hours_enabled && settings.quiet_hours_start && settings.quiet_hours_end) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      if (this.isWithinQuietHours(currentTime, settings.quiet_hours_start, settings.quiet_hours_end)) {
        // Only allow urgent/high priority during quiet hours
        if (priority !== 'urgent' && priority !== 'high') {
          return { allowed: false, reason: 'quiet_hours' };
        }
      }
    }

    // Check priority filters
    const priorityMap = {
      'low': settings.show_low_priority,
      'normal': settings.show_normal_priority,
      'high': settings.show_high_priority,
      'urgent': settings.show_urgent_priority
    };

    if (priorityMap[priority] === false) {
      return { allowed: false, reason: 'priority_filtered' };
    }

    // Check type-specific settings
    if (settings.type_settings && settings.type_settings[type]) {
      const typeConfig = settings.type_settings[type];
      if (typeConfig.enabled === false) {
        return { allowed: false, reason: 'type_disabled' };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if current time is within quiet hours
   */
  isWithinQuietHours(currentTime, startTime, endTime) {
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handles overnight quiet hours (e.g., 22:00 - 06:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Get allowed channels for user
   */
  async getAllowedChannels(userId) {
    const settings = await this.getSettings(userId);
    const channels = [];

    if (settings.web_notifications) channels.push('web');
    if (settings.mobile_push) channels.push('mobile');
    if (settings.email_notifications) channels.push('email');
    if (settings.sms_notifications) channels.push('sms');

    return channels;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧹 AUTO-CLEANUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Auto-archive old notifications based on user settings
   * Should be run periodically (e.g., daily)
   */
  async autoArchiveNotifications(userId) {
    const settings = await this.getSettings(userId);
    
    if (!settings.auto_archive_after_days) {
      return { archived: 0 };
    }

    const result = await pool.query(
      `UPDATE notifications 
       SET is_archived = true
       WHERE user_id = $1 
       AND is_archived = false
       AND is_read = true
       AND created_at < CURRENT_TIMESTAMP - INTERVAL '${settings.auto_archive_after_days} days'
       RETURNING id`,
      [userId]
    );

    return { archived: result.rows.length };
  }

  /**
   * Auto-delete old notifications based on user settings
   * Should be run periodically (e.g., daily)
   */
  async autoDeleteNotifications(userId) {
    const settings = await this.getSettings(userId);
    
    if (!settings.auto_delete_after_days) {
      return { deleted: 0 };
    }

    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE user_id = $1 
       AND (is_archived = true OR is_read = true)
       AND created_at < CURRENT_TIMESTAMP - INTERVAL '${settings.auto_delete_after_days} days'
       RETURNING id`,
      [userId]
    );

    return { deleted: result.rows.length };
  }

  /**
   * Run auto-cleanup for all users
   */
  async runAutoCleanup() {
    console.log('🧹 Running auto-cleanup for all users...');
    
    const users = await pool.query(
      `SELECT DISTINCT user_id FROM notification_settings_advanced
       WHERE auto_archive_after_days IS NOT NULL 
       OR auto_delete_after_days IS NOT NULL`
    );

    let totalArchived = 0;
    let totalDeleted = 0;

    for (const user of users.rows) {
      const archived = await this.autoArchiveNotifications(user.user_id);
      const deleted = await this.autoDeleteNotifications(user.user_id);
      
      totalArchived += archived.archived;
      totalDeleted += deleted.deleted;
    }

    console.log(`✅ Auto-cleanup complete: ${totalArchived} archived, ${totalDeleted} deleted`);
    return { totalArchived, totalDeleted };
  }
}

module.exports = new NotificationSettingsAdvancedService();

