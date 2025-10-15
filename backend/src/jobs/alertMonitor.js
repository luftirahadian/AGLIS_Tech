const cron = require('node-cron');
const alertService = require('../services/alertService');

/**
 * Alert Monitoring Job
 * 
 * Runs every 5 minutes to check system metrics against alert rules
 * Triggers notifications when thresholds are exceeded
 */

const AlertMonitor = {
  /**
   * Check all alerts
   */
  async checkAlerts() {
    try {
      console.log('🔍 Checking system alerts...');
      
      const triggeredAlerts = await alertService.checkAlerts();
      
      if (triggeredAlerts.length > 0) {
        console.log(`🚨 Triggered ${triggeredAlerts.length} alert(s)`);
        
        triggeredAlerts.forEach(alert => {
          console.log(`   - ${alert.rule} (${alert.severity}): ${alert.metricValue}`);
        });
      } else {
        console.log('✅ No alerts triggered - System healthy');
      }
    } catch (error) {
      console.error('❌ Error in alert monitoring:', error);
    }
  },

  /**
   * Record system metrics for alerting
   */
  async recordSystemMetrics() {
    try {
      // Record various system metrics
      const os = require('os');
      
      // Memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
      await alertService.recordMetric('memory_usage', memoryUsage);

      // Disk usage (simple check)
      const diskUsage = await alertService.getDiskUsage();
      await alertService.recordMetric('disk_usage', diskUsage);

      // WhatsApp success rate
      const whatsappRate = await alertService.getWhatsAppSuccessRate();
      await alertService.recordMetric('whatsapp_success_rate', whatsappRate);

      // SLA violations
      const slaViolations = await alertService.getSLAViolationCount();
      await alertService.recordMetric('sla_violation', slaViolations);

    } catch (error) {
      console.error('Error recording system metrics:', error);
    }
  },

  /**
   * Start alert monitoring job
   */
  start() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.recordSystemMetrics();
      await this.checkAlerts();
    });

    console.log('⏰ Alert Monitor started: Checking every 5 minutes');
    
    // Run immediately on start
    setTimeout(async () => {
      await this.recordSystemMetrics();
      await this.checkAlerts();
    }, 5000);
  }
};

module.exports = AlertMonitor;

