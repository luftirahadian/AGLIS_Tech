// ═══════════════════════════════════════════════════════════════
// 📊 NOTIFICATION ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════
// Tracks and analyzes notification engagement metrics
// ═══════════════════════════════════════════════════════════════

const pool = require('../config/database');

class NotificationAnalyticsService {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📈 EVENT TRACKING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Track notification view event
   */
  async trackView(notificationId, userId, metadata = {}) {
    const { device_type, browser, os, channel } = metadata;

    // Check if analytics entry exists
    const existing = await pool.query(
      `SELECT id FROM notification_analytics 
       WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (existing.rows.length > 0) {
      // Update existing entry
      await pool.query(
        `UPDATE notification_analytics SET
          viewed_at = COALESCE(viewed_at, CURRENT_TIMESTAMP),
          time_to_view = COALESCE(time_to_view, 
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - (
              SELECT created_at FROM notifications WHERE id = $1
            )))::INTEGER
          ),
          device_type = COALESCE(device_type, $3),
          browser = COALESCE(browser, $4),
          os = COALESCE(os, $5),
          channel = COALESCE(channel, $6)
        WHERE id = $7`,
        [notificationId, userId, device_type, browser, os, channel, existing.rows[0].id]
      );
    } else {
      // Create new entry
      const timeToView = await this.calculateTimeToEvent(notificationId);
      
      await pool.query(
        `INSERT INTO notification_analytics (
          notification_id, user_id, viewed_at, time_to_view,
          device_type, browser, os, channel
        ) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7)`,
        [notificationId, userId, timeToView, device_type, browser, os, channel]
      );
    }

    return { success: true };
  }

  /**
   * Track notification read event
   */
  async trackRead(notificationId, userId) {
    const timeToRead = await this.calculateTimeToEvent(notificationId);

    await pool.query(
      `UPDATE notification_analytics SET
        read_at = CURRENT_TIMESTAMP,
        time_to_read = $3
      WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, userId, timeToRead]
    );

    return { success: true };
  }

  /**
   * Track notification click event
   */
  async trackClick(notificationId, userId) {
    const timeToClick = await this.calculateTimeToEvent(notificationId);

    await pool.query(
      `UPDATE notification_analytics SET
        clicked_at = CURRENT_TIMESTAMP,
        time_to_click = $3
      WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, userId, timeToClick]
    );

    return { success: true };
  }

  /**
   * Track notification dismiss event
   */
  async trackDismiss(notificationId, userId) {
    await pool.query(
      `UPDATE notification_analytics SET
        dismissed_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return { success: true };
  }

  /**
   * Track notification archive event
   */
  async trackArchive(notificationId, userId) {
    await pool.query(
      `UPDATE notification_analytics SET
        archived_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return { success: true };
  }

  /**
   * Track notification delete event
   */
  async trackDelete(notificationId, userId) {
    await pool.query(
      `UPDATE notification_analytics SET
        deleted_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return { success: true };
  }

  /**
   * Calculate time from notification creation to current event
   */
  async calculateTimeToEvent(notificationId) {
    const result = await pool.query(
      `SELECT EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))::INTEGER as seconds
       FROM notifications WHERE id = $1`,
      [notificationId]
    );

    return result.rows[0]?.seconds || 0;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 ANALYTICS QUERIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get overall analytics summary
   */
  async getOverallStats(filters = {}) {
    const { start_date, end_date, type, priority } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (start_date) {
      params.push(start_date);
      whereClause += ` AND n.created_at >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      whereClause += ` AND n.created_at <= $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      whereClause += ` AND n.type = $${params.length}`;
    }
    
    if (priority) {
      params.push(priority);
      whereClause += ` AND n.priority = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT n.id) as total_sent,
        COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL) as total_viewed,
        COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL) as total_read,
        COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL) as total_clicked,
        COUNT(DISTINCT na.id) FILTER (WHERE na.dismissed_at IS NOT NULL) as total_dismissed,
        COUNT(DISTINCT na.id) FILTER (WHERE na.archived_at IS NOT NULL) as total_archived,
        COUNT(DISTINCT na.id) FILTER (WHERE na.deleted_at IS NOT NULL) as total_deleted,
        
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as view_rate,
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as read_rate,
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as click_rate,
        
        ROUND(AVG(na.time_to_view)) as avg_time_to_view,
        ROUND(AVG(na.time_to_read)) as avg_time_to_read,
        ROUND(AVG(na.time_to_click)) as avg_time_to_click
      FROM notifications n
      LEFT JOIN notification_analytics na ON n.id = na.notification_id
      ${whereClause}`,
      params
    );

    return result.rows[0];
  }

  /**
   * Get analytics by type
   */
  async getStatsByType(filters = {}) {
    const { start_date, end_date } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (start_date) {
      params.push(start_date);
      whereClause += ` AND n.created_at >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      whereClause += ` AND n.created_at <= $${params.length}`;
    }

    const result = await pool.query(
      `SELECT 
        n.type,
        COUNT(DISTINCT n.id) as total_sent,
        COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL) as total_viewed,
        COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL) as total_read,
        COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL) as total_clicked,
        
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as view_rate,
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as read_rate,
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as click_rate
      FROM notifications n
      LEFT JOIN notification_analytics na ON n.id = na.notification_id
      ${whereClause}
      GROUP BY n.type
      ORDER BY total_sent DESC`,
      params
    );

    return result.rows;
  }

  /**
   * Get analytics by priority
   */
  async getStatsByPriority(filters = {}) {
    const { start_date, end_date } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (start_date) {
      params.push(start_date);
      whereClause += ` AND n.created_at >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      whereClause += ` AND n.created_at <= $${params.length}`;
    }

    const result = await pool.query(
      `SELECT 
        n.priority,
        COUNT(DISTINCT n.id) as total_sent,
        COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL) as total_viewed,
        COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL) as total_read,
        COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL) as total_clicked,
        
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as view_rate,
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as read_rate
      FROM notifications n
      LEFT JOIN notification_analytics na ON n.id = na.notification_id
      ${whereClause}
      GROUP BY n.priority
      ORDER BY 
        CASE n.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END`,
      params
    );

    return result.rows;
  }

  /**
   * Get daily analytics trend
   */
  async getDailyTrend(days = 30) {
    const result = await pool.query(
      `SELECT 
        DATE(n.created_at) as date,
        COUNT(DISTINCT n.id) as total_sent,
        COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL) as total_viewed,
        COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL) as total_read,
        COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL) as total_clicked
      FROM notifications n
      LEFT JOIN notification_analytics na ON n.id = na.notification_id
      WHERE n.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(n.created_at)
      ORDER BY date DESC`,
      []
    );

    return result.rows;
  }

  /**
   * Get device/channel distribution
   */
  async getDeviceStats() {
    const result = await pool.query(
      `SELECT 
        device_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE viewed_at IS NOT NULL) as viewed,
        COUNT(*) FILTER (WHERE read_at IS NOT NULL) as read,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked
      FROM notification_analytics
      WHERE device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY total DESC`,
      []
    );

    return result.rows;
  }

  /**
   * Get top performing notifications
   */
  async getTopPerformingNotifications(limit = 10) {
    const result = await pool.query(
      `SELECT 
        n.id,
        n.type,
        n.title,
        n.priority,
        n.created_at,
        COUNT(DISTINCT na.user_id) as unique_users,
        COUNT(*) FILTER (WHERE na.clicked_at IS NOT NULL) as total_clicks,
        COUNT(*) FILTER (WHERE na.read_at IS NOT NULL) as total_reads,
        ROUND(COUNT(*) FILTER (WHERE na.clicked_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(*), 0) * 100, 2) as click_rate
      FROM notifications n
      LEFT JOIN notification_analytics na ON n.id = na.notification_id
      WHERE n.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY n.id
      HAVING COUNT(DISTINCT na.user_id) > 0
      ORDER BY click_rate DESC, total_clicks DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📅 DAILY SUMMARY GENERATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Generate daily summary
   * Should be run daily (e.g., via cron job)
   */
  async generateDailySummary(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];

    // Get summary by type and priority
    const result = await pool.query(
      `SELECT 
        n.type,
        n.priority,
        COUNT(DISTINCT n.id) as total_sent,
        COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL) as total_viewed,
        COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL) as total_read,
        COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL) as total_clicked,
        COUNT(DISTINCT na.id) FILTER (WHERE na.dismissed_at IS NOT NULL) as total_dismissed,
        COUNT(DISTINCT na.id) FILTER (WHERE na.archived_at IS NOT NULL) as total_archived,
        COUNT(DISTINCT na.id) FILTER (WHERE na.deleted_at IS NOT NULL) as total_deleted,
        
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.viewed_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as view_rate,
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.read_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as read_rate,
        ROUND(COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL)::NUMERIC 
          / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as click_rate,
        
        ROUND(AVG(na.time_to_view)) as avg_time_to_view,
        ROUND(AVG(na.time_to_read)) as avg_time_to_read,
        ROUND(AVG(na.time_to_click)) as avg_time_to_click
      FROM notifications n
      LEFT JOIN notification_analytics na ON n.id = na.notification_id
      WHERE DATE(n.created_at) = $1
      GROUP BY n.type, n.priority`,
      [dateStr]
    );

    // Upsert summaries
    for (const row of result.rows) {
      await pool.query(
        `INSERT INTO notification_analytics_summary (
          date, type, priority, total_sent, total_viewed, total_read, total_clicked,
          total_dismissed, total_archived, total_deleted, view_rate, read_rate, click_rate,
          avg_time_to_view, avg_time_to_read, avg_time_to_click
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (date, type, priority) DO UPDATE SET
          total_sent = EXCLUDED.total_sent,
          total_viewed = EXCLUDED.total_viewed,
          total_read = EXCLUDED.total_read,
          total_clicked = EXCLUDED.total_clicked,
          total_dismissed = EXCLUDED.total_dismissed,
          total_archived = EXCLUDED.total_archived,
          total_deleted = EXCLUDED.total_deleted,
          view_rate = EXCLUDED.view_rate,
          read_rate = EXCLUDED.read_rate,
          click_rate = EXCLUDED.click_rate,
          avg_time_to_view = EXCLUDED.avg_time_to_view,
          avg_time_to_read = EXCLUDED.avg_time_to_read,
          avg_time_to_click = EXCLUDED.avg_time_to_click,
          updated_at = CURRENT_TIMESTAMP`,
        [
          dateStr, row.type, row.priority, row.total_sent, row.total_viewed,
          row.total_read, row.total_clicked, row.total_dismissed, row.total_archived,
          row.total_deleted, row.view_rate, row.read_rate, row.click_rate,
          row.avg_time_to_view, row.avg_time_to_read, row.avg_time_to_click
        ]
      );
    }

    console.log(`✅ Daily summary generated for ${dateStr}`);
    return { success: true, date: dateStr, summaries: result.rows.length };
  }
}

module.exports = new NotificationAnalyticsService();

