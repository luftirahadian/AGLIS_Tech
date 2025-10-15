/**
 * SLA Monitor Job
 * Phase 1: SLA Warning Notifications
 * 
 * Monitors tickets approaching SLA deadline and sends warnings to supervisors
 * Runs every 15 minutes
 */

const cron = require('node-cron');
const pool = require('../config/database');
const whatsappNotificationService = require('../services/whatsappNotificationService');

class SLAMonitor {
  constructor() {
    this.isRunning = false;
    this.lastCheck = null;
  }

  /**
   * Get SLA hours based on priority
   */
  getSLAHours(priority) {
    const slaMap = {
      'urgent': 4,
      'high': 8,
      'normal': 24,
      'low': 48
    };
    return slaMap[priority] || 24;
  }

  /**
   * Check tickets approaching SLA
   */
  async checkSLA() {
    if (this.isRunning) {
      console.log('⏭️ SLA check already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔍 Starting SLA check...');

    try {
      // Get all open/assigned/in_progress tickets
      const query = `
        SELECT 
          id,
          ticket_number,
          priority,
          status,
          created_at,
          assigned_technician_id
        FROM tickets
        WHERE status IN ('open', 'assigned', 'in_progress')
        ORDER BY priority DESC, created_at ASC
      `;

      const result = await pool.query(query);
      const tickets = result.rows;

      console.log(`📋 Found ${tickets.length} active tickets to check`);

      let warningsSent = 0;
      const now = new Date();

      for (const ticket of tickets) {
        const slaHours = this.getSLAHours(ticket.priority);
        const deadline = new Date(ticket.created_at);
        deadline.setHours(deadline.getHours() + slaHours);

        const remainingMs = deadline - now;
        const remainingMinutes = Math.floor(remainingMs / 60000);

        // Send warning if approaching deadline
        // Warning thresholds:
        // - Urgent (4h SLA): Warn at 1 hour remaining
        // - High (8h SLA): Warn at 2 hours remaining
        // - Normal (24h SLA): Warn at 4 hours remaining
        // - Low (48h SLA): Warn at 8 hours remaining

        let warningThreshold;
        switch (ticket.priority) {
          case 'urgent':
            warningThreshold = 60; // 1 hour
            break;
          case 'high':
            warningThreshold = 120; // 2 hours
            break;
          case 'normal':
            warningThreshold = 240; // 4 hours
            break;
          case 'low':
            warningThreshold = 480; // 8 hours
            break;
          default:
            warningThreshold = 240;
        }

        // Check if should send warning
        if (remainingMinutes > 0 && remainingMinutes <= warningThreshold) {
          // Check if warning already sent recently (prevent spam)
          const lastWarning = await this.getLastWarning(ticket.id);
          const timeSinceLastWarning = lastWarning 
            ? (now - new Date(lastWarning.created_at)) / 60000 
            : Infinity;

          // Only send if no warning in last 30 minutes
          if (timeSinceLastWarning > 30) {
            console.log(`⚠️ Ticket #${ticket.ticket_number} approaching SLA: ${remainingMinutes} minutes remaining`);
            
            // Send WhatsApp SLA warning
            const sendResult = await whatsappNotificationService.notifySLAWarning(ticket.id);
            
            if (sendResult.success) {
              warningsSent++;
              console.log(`📱 SLA warning sent for ticket #${ticket.ticket_number}`);
            } else {
              console.warn(`⚠️ Failed to send SLA warning for ticket #${ticket.ticket_number}:`, sendResult.error);
            }
          }
        }

        // Check if already overdue
        if (remainingMinutes <= 0) {
          console.error(`🚨 OVERDUE: Ticket #${ticket.ticket_number} is ${Math.abs(remainingMinutes)} minutes overdue!`);
          // Can add escalation logic here
        }
      }

      console.log(`✅ SLA check completed. Warnings sent: ${warningsSent}`);
      this.lastCheck = new Date();

    } catch (error) {
      console.error('❌ SLA check error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get last warning sent for a ticket
   */
  async getLastWarning(ticketId) {
    try {
      const query = `
        SELECT created_at
        FROM whatsapp_notifications
        WHERE ticket_id = $1 
          AND notification_type = 'sla_warning'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const result = await pool.query(query, [ticketId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting last warning:', error);
      return null;
    }
  }

  /**
   * Start SLA monitoring cron job
   */
  start() {
    // Run every 15 minutes
    const schedule = '*/15 * * * *';
    
    cron.schedule(schedule, () => {
      this.checkSLA();
    });

    console.log('⏰ SLA Monitor started: Checking every 15 minutes');
    
    // Run immediately on start
    setTimeout(() => {
      this.checkSLA();
    }, 5000); // Wait 5 seconds after server start
  }
}

// Export singleton instance
module.exports = new SLAMonitor();

