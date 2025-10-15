/**
 * Daily Summary Job
 * Phase 2: Daily Team Summary Notifications
 * 
 * Sends daily performance summary to managers and supervisors
 * Runs daily at 18:00 WIB (end of day)
 */

const cron = require('node-cron');
const whatsappNotificationService = require('../services/whatsappNotificationService');

class DailySummaryJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Send daily summary
   */
  async sendSummary() {
    if (this.isRunning) {
      console.log('⏭️ Daily summary job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📊 Sending daily summary...');

    try {
      const result = await whatsappNotificationService.sendDailySummary();
      
      if (result.success) {
        console.log(`✅ Daily summary sent to ${result.totalSent} managers/supervisors`);
      } else {
        console.error(`❌ Daily summary failed:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Daily summary job error:', error);
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start daily summary cron job
   */
  start() {
    // Run daily at 18:00 WIB (11:00 UTC)
    const schedule = '0 11 * * *';
    
    cron.schedule(schedule, () => {
      this.sendSummary();
    });

    console.log('⏰ Daily Summary Job started: Every day at 18:00 WIB');
  }
}

// Export singleton instance
module.exports = new DailySummaryJob();

