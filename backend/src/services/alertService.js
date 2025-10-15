const pool = require('../config/database');
const whatsappService = require('./whatsappService');
const nodemailer = require('nodemailer');

/**
 * Alert Service
 * 
 * Monitors system metrics and triggers alerts based on configured rules
 * Sends notifications via email and WhatsApp
 */

class AlertService {
  constructor() {
    this.cooldownCache = new Map(); // Track last alert time per rule
    
    // Email configuration
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Record system metric
   */
  async recordMetric(metricType, metricValue, metadata = {}) {
    try {
      await pool.query(
        'INSERT INTO system_metrics (metric_type, metric_value, metadata) VALUES ($1, $2, $3)',
        [metricType, metricValue, JSON.stringify(metadata)]
      );
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  /**
   * Check if alert should be triggered
   */
  async checkAlerts() {
    try {
      // Get all active alert rules
      const rulesQuery = `
        SELECT * FROM alert_rules
        WHERE is_active = TRUE
        ORDER BY severity DESC
      `;
      
      const rulesResult = await pool.query(rulesQuery);
      const alerts = [];

      for (const rule of rulesResult.rows) {
        // Check cooldown
        const lastAlertKey = `rule_${rule.id}`;
        const lastAlertTime = this.cooldownCache.get(lastAlertKey);
        const now = Date.now();
        
        if (lastAlertTime && (now - lastAlertTime) < (rule.cooldown_minutes * 60 * 1000)) {
          continue; // Still in cooldown
        }

        // Get current metric value
        const metricValue = await this.getMetricValue(rule.metric);
        
        // Check if condition is met
        const shouldAlert = this.evaluateCondition(metricValue, rule.condition, rule.threshold);
        
        if (shouldAlert) {
          // Trigger alert
          const alert = await this.triggerAlert(rule, metricValue);
          alerts.push(alert);
          
          // Update cooldown
          this.cooldownCache.set(lastAlertKey, now);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking alerts:', error);
      return [];
    }
  }

  /**
   * Get current value for a metric
   */
  async getMetricValue(metric) {
    try {
      switch (metric) {
        case 'api_error_rate':
          return await this.getApiErrorRate();
        
        case 'api_response_time':
          return await this.getApiResponseTime();
        
        case 'database_connection':
          return await this.checkDatabaseConnection();
        
        case 'disk_usage':
          return await this.getDiskUsage();
        
        case 'memory_usage':
          return await this.getMemoryUsage();
        
        case 'whatsapp_success_rate':
          return await this.getWhatsAppSuccessRate();
        
        case 'sla_violation':
          return await this.getSLAViolationCount();
        
        case 'backup_status':
          return await this.getBackupStatus();
        
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error getting metric ${metric}:`, error);
      return null;
    }
  }

  /**
   * Evaluate condition
   */
  evaluateCondition(value, condition, threshold) {
    if (value === null || value === undefined) return false;

    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert(rule, metricValue) {
    try {
      const message = this.formatAlertMessage(rule, metricValue);
      
      // Log to database
      const historyResult = await pool.query(
        `INSERT INTO alert_history (alert_rule_id, metric_value, severity, message)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [rule.id, metricValue, rule.severity, message]
      );
      
      const alertId = historyResult.rows[0].id;
      const channelsUsed = [];

      // Send notifications
      if (rule.notification_channels.includes('whatsapp') && rule.recipients.length > 0) {
        for (const recipient of rule.recipients) {
          try {
            await whatsappService.sendMessage(recipient, message);
            channelsUsed.push('whatsapp');
          } catch (error) {
            console.error('WhatsApp alert failed:', error);
          }
        }
      }

      if (rule.notification_channels.includes('email') && rule.recipients.length > 0) {
        // Send email alerts (if email configured)
        if (process.env.EMAIL_USER) {
          try {
            await this.sendEmailAlert(rule, message);
            channelsUsed.push('email');
          } catch (error) {
            console.error('Email alert failed:', error);
          }
        }
      }

      // Update notification sent status
      await pool.query(
        'UPDATE alert_history SET notification_sent = $1, channels_used = $2 WHERE id = $3',
        [channelsUsed.length > 0, JSON.stringify(channelsUsed), alertId]
      );

      console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`);

      return {
        alertId,
        rule: rule.name,
        severity: rule.severity,
        metricValue,
        channelsSent: channelsUsed
      };
    } catch (error) {
      console.error('Error triggering alert:', error);
      return null;
    }
  }

  /**
   * Format alert message
   */
  formatAlertMessage(rule, metricValue) {
    const severityEmoji = {
      low: '📘',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };

    return `${severityEmoji[rule.severity]} *ALERT: ${rule.name.toUpperCase()}*

📊 Current Value: ${metricValue}
⚠️ Threshold: ${rule.threshold}
📈 Severity: ${rule.severity.toUpperCase()}

📝 Details: ${rule.description}

⏰ Time: ${new Date().toLocaleString('id-ID')}

*Action Required:* Please investigate immediately!

_AGLIS Monitoring System_ 🔔`;
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(rule, message) {
    // Email recipients from rule or default
    const emailRecipients = rule.recipients.filter(r => r.includes('@'));
    
    if (emailRecipients.length === 0) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailRecipients.join(', '),
      subject: `🚨 AGLIS Alert: ${rule.name} (${rule.severity})`,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${rule.severity === 'critical' ? '#dc2626' : rule.severity === 'high' ? '#ea580c' : '#f59e0b'};">
          🚨 AGLIS System Alert
        </h2>
        <p><strong>Alert:</strong> ${rule.name}</p>
        <p><strong>Severity:</strong> ${rule.severity.toUpperCase()}</p>
        <p><strong>Description:</strong> ${rule.description}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('id-ID')}</p>
        <hr>
        <p style="color: #666;">AGLIS Monitoring System</p>
      </div>`
    };

    return this.emailTransporter.sendMail(mailOptions);
  }

  /**
   * Get API error rate (last 5 minutes)
   */
  async getApiErrorRate() {
    // Query from system_metrics or calculate from logs
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await pool.query(
      `SELECT 
         AVG(CASE WHEN metric_type = 'api_error_rate' THEN metric_value ELSE 0 END) as error_rate
       FROM system_metrics
       WHERE recorded_at >= $1`,
      [fiveMinutesAgo]
    );

    return parseFloat(result.rows[0].error_rate) || 0;
  }

  /**
   * Get API response time (last 5 minutes average)
   */
  async getApiResponseTime() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await pool.query(
      `SELECT AVG(metric_value) as avg_time
       FROM system_metrics
       WHERE metric_type = 'api_response_time' AND recorded_at >= $1`,
      [fiveMinutesAgo]
    );

    return parseFloat(result.rows[0].avg_time) || 0;
  }

  /**
   * Check database connection
   */
  async checkDatabaseConnection() {
    try {
      await pool.query('SELECT 1');
      return 1; // Connected
    } catch (error) {
      return 0; // Not connected
    }
  }

  /**
   * Get disk usage percentage
   */
  async getDiskUsage() {
    try {
      const { execSync } = require('child_process');
      const diskInfo = execSync('df -h / | tail -1').toString();
      const diskParts = diskInfo.trim().split(/\s+/);
      return parseInt(diskParts[4]); // Percentage used
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get memory usage percentage
   */
  async getMemoryUsage() {
    const os = require('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return parseFloat(((usedMem / totalMem) * 100).toFixed(2));
  }

  /**
   * Get WhatsApp success rate (last hour)
   */
  async getWhatsAppSuccessRate() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const result = await pool.query(
      `SELECT 
         COUNT(CASE WHEN status = 'sent' THEN 1 END)::float / 
         NULLIF(COUNT(*), 0) * 100 as success_rate
       FROM whatsapp_notifications
       WHERE created_at >= $1`,
      [oneHourAgo]
    );

    return parseFloat(result.rows[0].success_rate) || 100;
  }

  /**
   * Get SLA violation count (current)
   */
  async getSLAViolationCount() {
    const result = await pool.query(
      `SELECT COUNT(*) as violations
       FROM tickets
       WHERE status IN ('open', 'assigned', 'in_progress')
         AND sla_due_date < NOW()`
    );

    return parseInt(result.rows[0].violations);
  }

  /**
   * Get backup status (last 25 hours)
   */
  async getBackupStatus() {
    // Check if backup was created in last 25 hours
    const { execSync } = require('child_process');
    try {
      const backupAge = execSync('find /home/aglis/AGLIS_Tech/backups/database -name "aglis_db_*.sql.gz" -mtime -1 | wc -l').toString().trim();
      return parseInt(backupAge) > 0 ? 1 : 0; // 1 = OK, 0 = Failed
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const stats = await pool.query(
      `SELECT 
         COUNT(*) as total_alerts,
         COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
         COUNT(CASE WHEN severity = 'high' THEN 1 END) as high,
         COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium,
         COUNT(CASE WHEN severity = 'low' THEN 1 END) as low,
         COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) as resolved,
         AVG(EXTRACT(EPOCH FROM (resolved_at - triggered_at))/60) as avg_resolution_minutes
       FROM alert_history
       WHERE triggered_at >= $1`,
      [since]
    );

    return stats.rows[0];
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, userId, notes) {
    await pool.query(
      `UPDATE alert_history 
       SET resolved_at = NOW(), resolved_by = $1, resolution_notes = $2
       WHERE id = $3`,
      [userId, notes, alertId]
    );
  }

  /**
   * Get active (unresolved) alerts
   */
  async getActiveAlerts() {
    const result = await pool.query(
      `SELECT ah.*, ar.name as rule_name, ar.category, ar.severity
       FROM alert_history ah
       LEFT JOIN alert_rules ar ON ah.alert_rule_id = ar.id
       WHERE ah.resolved_at IS NULL
       ORDER BY ah.triggered_at DESC
       LIMIT 50`
    );

    return result.rows;
  }
}

module.exports = new AlertService();

