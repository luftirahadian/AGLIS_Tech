/**
 * Payment Reminder Job
 * Phase 1: Payment Reminder Notifications
 * 
 * Sends payment reminders to customers for upcoming due dates
 * Runs daily at 09:00 WIB
 */

const cron = require('node-cron');
const pool = require('../config/database');
const whatsappNotificationService = require('../services/whatsappNotificationService');

class PaymentReminderJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Send payment reminders
   */
  async sendReminders() {
    if (this.isRunning) {
      console.log('⏭️ Payment reminder job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('💳 Starting payment reminder job...');

    try {
      // Get unpaid invoices approaching due date
      // Send reminders at: 7 days, 3 days, 1 day before due date
      const query = `
        SELECT 
          i.id,
          i.invoice_number,
          i.due_date,
          i.total_amount,
          c.name as customer_name,
          c.phone as customer_phone,
          (i.due_date - CURRENT_DATE) as days_remaining
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.status IN ('pending', 'overdue')
          AND i.due_date >= CURRENT_DATE
          AND (i.due_date - CURRENT_DATE) IN (7, 3, 1)
          AND c.phone IS NOT NULL
        ORDER BY i.due_date ASC
      `;

      const result = await pool.query(query);
      const invoices = result.rows;

      console.log(`📋 Found ${invoices.length} invoices needing reminders`);

      let remindersSent = 0;

      for (const invoice of invoices) {
        // Check if reminder already sent today
        const lastReminder = await this.getLastReminder(invoice.id);
        const today = new Date().toISOString().split('T')[0];
        const lastReminderDate = lastReminder 
          ? new Date(lastReminder.created_at).toISOString().split('T')[0]
          : null;

        // Skip if already sent today
        if (lastReminderDate === today) {
          console.log(`⏭️ Reminder already sent today for invoice #${invoice.invoice_number}`);
          continue;
        }

        // Send WhatsApp payment reminder
        const sendResult = await whatsappNotificationService.notifyPaymentReminder(invoice.id);
        
        if (sendResult.success) {
          remindersSent++;
          console.log(`📱 Payment reminder sent for invoice #${invoice.invoice_number} (${invoice.days_remaining} days remaining)`);
        } else {
          console.warn(`⚠️ Failed to send payment reminder for invoice #${invoice.invoice_number}:`, sendResult.error);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Payment reminder job completed. Reminders sent: ${remindersSent}/${invoices.length}`);

    } catch (error) {
      console.error('❌ Payment reminder job error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get last reminder sent for an invoice
   */
  async getLastReminder(invoiceId) {
    try {
      const query = `
        SELECT created_at
        FROM whatsapp_notifications
        WHERE invoice_id = $1 
          AND notification_type = 'payment_reminder'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const result = await pool.query(query, [invoiceId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting last reminder:', error);
      return null;
    }
  }

  /**
   * Start payment reminder cron job
   */
  start() {
    // Run daily at 09:00 WIB (02:00 UTC)
    const schedule = '0 2 * * *';
    
    cron.schedule(schedule, () => {
      this.sendReminders();
    });

    console.log('⏰ Payment Reminder Job started: Every day at 09:00 WIB');
  }
}

// Export singleton instance
module.exports = new PaymentReminderJob();

