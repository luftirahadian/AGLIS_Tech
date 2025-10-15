/**
 * Weekly Performance Report Job
 * Phase 3: Technician Performance Notifications
 * 
 * Sends weekly performance report to all active technicians
 * Runs every Monday at 08:00 WIB
 */

const cron = require('node-cron');
const pool = require('../config/database');
const whatsappNotificationService = require('../services/whatsappNotificationService');

class WeeklyPerformanceJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Send weekly performance reports to all technicians
   */
  async sendReports() {
    if (this.isRunning) {
      console.log('⏭️ Weekly performance job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📊 Sending weekly performance reports...');

    try {
      // Get all active technicians
      const query = `
        SELECT id, full_name, employee_id
        FROM technicians
        WHERE employment_status = 'active'
        ORDER BY employee_id
      `;

      const result = await pool.query(query);
      const technicians = result.rows;

      console.log(`📋 Found ${technicians.length} active technicians`);

      let reportsSent = 0;

      for (const technician of technicians) {
        const sendResult = await whatsappNotificationService.sendTechnicianPerformance(
          technician.id,
          'This Week'
        );
        
        if (sendResult.success) {
          reportsSent++;
          console.log(`📱 Performance report sent to ${technician.full_name} (${technician.employee_id})`);
        } else {
          console.warn(`⚠️ Failed to send report to ${technician.full_name}:`, sendResult.error);
        }

        // Delay between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`✅ Weekly performance job completed. Reports sent: ${reportsSent}/${technicians.length}`);

    } catch (error) {
      console.error('❌ Weekly performance job error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start weekly performance cron job
   */
  start() {
    // Run every Monday at 08:00 WIB (01:00 UTC)
    const schedule = '0 1 * * 1';
    
    cron.schedule(schedule, () => {
      this.sendReports();
    });

    console.log('⏰ Weekly Performance Job started: Every Monday at 08:00 WIB');
  }
}

// Export singleton instance
module.exports = new WeeklyPerformanceJob();

