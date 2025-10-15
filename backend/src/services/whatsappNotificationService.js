/**
 * WhatsApp Notification Service
 * Phase 1 Implementation: High Priority Notifications
 * 
 * Handles sending WhatsApp notifications for:
 * 1. Ticket Assignment
 * 2. Ticket Status Updates
 * 3. SLA Warnings
 * 4. Payment Reminders
 */

const whatsappService = require('./whatsappService');
const whatsappTemplates = require('../templates/whatsappTemplates');
const pool = require('../config/database');

class WhatsAppNotificationService {
  constructor() {
    this.whatsappService = whatsappService;
    this.templates = whatsappTemplates;
  }

  /**
   * 1. Send Ticket Assignment Notification to Technician
   */
  async notifyTicketAssignment(ticketId) {
    try {
      // Get ticket details with technician phone
      const query = `
        SELECT 
          t.id,
          t.ticket_number,
          t.title as issue,
          t.priority,
          t.created_at,
          c.name as customer_name,
          c.address as location,
          c.phone as customer_phone,
          tech.phone as technician_phone,
          tech.full_name as technician_name,
          u.phone as user_phone
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
        LEFT JOIN users u ON tech.user_id = u.id
        WHERE t.id = $1
      `;

      const result = await pool.query(query, [ticketId]);
      
      if (result.rows.length === 0) {
        throw new Error('Ticket not found');
      }

      const ticket = result.rows[0];

      if (!ticket.technician_phone && !ticket.user_phone) {
        console.warn(`No phone number for technician on ticket #${ticket.ticket_number}`);
        return { success: false, error: 'No technician phone number' };
      }

      // Calculate SLA and deadline
      const slaHours = this.getSLAHours(ticket.priority);
      const deadline = new Date(ticket.created_at);
      deadline.setHours(deadline.getHours() + slaHours);

      // Format message data
      const messageData = {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customer_name,
        location: ticket.location,
        priority: ticket.priority,
        issue: ticket.issue,
        sla: slaHours,
        deadline: deadline.toLocaleString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      };

      // Generate message from template
      const message = this.templates.ticketAssignment(messageData);

      // Send WhatsApp
      const phone = ticket.user_phone || ticket.technician_phone;
      const sendResult = await this.whatsappService.sendMessage(phone, message);

      // Log notification
      await this.logNotification({
        ticket_id: ticketId,
        recipient_phone: phone,
        recipient_type: 'technician',
        notification_type: 'ticket_assignment',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending ticket assignment notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 2. Send Ticket Status Update to Customer
   */
  async notifyTicketStatusUpdate(ticketId, oldStatus, newStatus) {
    try {
      // Get ticket and customer details
      const query = `
        SELECT 
          t.id,
          t.ticket_number,
          t.title as issue,
          t.completed_at,
          t.resolution_notes as solution,
          c.name as customer_name,
          c.phone as customer_phone,
          tech.full_name as technician_name,
          t.created_at
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
        WHERE t.id = $1
      `;

      const result = await pool.query(query, [ticketId]);
      
      if (result.rows.length === 0) {
        throw new Error('Ticket not found');
      }

      const ticket = result.rows[0];

      if (!ticket.customer_phone) {
        console.warn(`No phone number for customer on ticket #${ticket.ticket_number}`);
        return { success: false, error: 'No customer phone number' };
      }

      // Calculate duration if completed
      let duration = null;
      if (newStatus === 'completed' && ticket.completed_at) {
        const durationMs = new Date(ticket.completed_at) - new Date(ticket.created_at);
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        duration = `${hours} jam ${minutes} menit`;
      }

      // Format message data
      const messageData = {
        ticketNumber: ticket.ticket_number,
        oldStatus: oldStatus,
        newStatus: newStatus,
        technicianName: ticket.technician_name || 'Tim Kami',
        completedAt: ticket.completed_at ? new Date(ticket.completed_at).toLocaleString('id-ID') : null,
        duration: duration,
        issue: ticket.issue,
        solution: ticket.solution,
        ratingUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}/rate`
      };

      // Generate message from template
      const message = this.templates.ticketStatusUpdate(messageData);

      // Send WhatsApp
      const sendResult = await this.whatsappService.sendMessage(ticket.customer_phone, message);

      // Log notification
      await this.logNotification({
        ticket_id: ticketId,
        recipient_phone: ticket.customer_phone,
        recipient_type: 'customer',
        notification_type: 'ticket_status_update',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending ticket status update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 3. Send SLA Warning to Supervisor
   */
  async notifySLAWarning(ticketId) {
    try {
      // Get ticket details and supervisor
      const query = `
        SELECT 
          t.id,
          t.ticket_number,
          t.priority,
          t.created_at,
          t.status,
          c.name as customer_name,
          tech.full_name as technician_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
        WHERE t.id = $1
      `;

      const result = await pool.query(query, [ticketId]);
      
      if (result.rows.length === 0) {
        throw new Error('Ticket not found');
      }

      const ticket = result.rows[0];

      // Calculate SLA remaining
      const slaHours = this.getSLAHours(ticket.priority);
      const deadline = new Date(ticket.created_at);
      deadline.setHours(deadline.getHours() + slaHours);
      const now = new Date();
      const remainingMs = deadline - now;
      const remainingMinutes = Math.floor(remainingMs / 60000);

      // Calculate progress (mock - you can enhance this)
      const elapsedMs = now - new Date(ticket.created_at);
      const progress = Math.min(Math.floor((elapsedMs / (slaHours * 3600000)) * 100), 100);

      // Format message data
      const messageData = {
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customer_name,
        technicianName: ticket.technician_name || 'Belum di-assign',
        slaTarget: slaHours,
        remaining: remainingMinutes > 60 
          ? `${Math.floor(remainingMinutes / 60)} jam ${remainingMinutes % 60} menit`
          : `${remainingMinutes} menit`,
        progress: progress,
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      };

      // Generate message from template
      const message = this.templates.slaWarning(messageData);

      // Get supervisor phone numbers (from Supervisor Team group or individual supervisors)
      const supervisors = await this.getSupervisorPhones();

      if (supervisors.length === 0) {
        console.warn('No supervisor phone numbers found');
        return { success: false, error: 'No supervisor contacts' };
      }

      // Send to all supervisors
      const results = [];
      for (const supervisor of supervisors) {
        const sendResult = await this.whatsappService.sendMessage(supervisor.phone, message);
        
        // Log notification
        await this.logNotification({
          ticket_id: ticketId,
          recipient_phone: supervisor.phone,
          recipient_type: 'supervisor',
          notification_type: 'sla_warning',
          message: message,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push(sendResult);
      }

      return {
        success: results.some(r => r.success),
        results: results
      };
    } catch (error) {
      console.error('Error sending SLA warning:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 4. Send Payment Reminder to Customer
   */
  async notifyPaymentReminder(invoiceId) {
    try {
      // Get invoice and customer details
      const query = `
        SELECT 
          i.id,
          i.invoice_number,
          i.total_amount as amount,
          i.due_date,
          i.invoice_date,
          c.name as customer_name,
          c.phone as customer_phone,
          p.name as package_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN packages p ON i.package_id = p.id
        WHERE i.id = $1 AND i.status != 'paid'
      `;

      const result = await pool.query(query, [invoiceId]);
      
      if (result.rows.length === 0) {
        console.warn(`Invoice not found or already paid: ${invoiceId}`);
        return { success: false, error: 'Invoice not found or paid' };
      }

      const invoice = result.rows[0];

      if (!invoice.customer_phone) {
        console.warn(`No phone number for customer on invoice #${invoice.invoice_number}`);
        return { success: false, error: 'No customer phone number' };
      }

      // Calculate days remaining
      const dueDate = new Date(invoice.due_date);
      const now = new Date();
      const daysRemaining = Math.ceil((dueDate - now) / 86400000);

      // Format month
      const invoiceDate = new Date(invoice.invoice_date);
      const month = invoiceDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

      // Format message data
      const messageData = {
        customerName: invoice.customer_name,
        invoiceNumber: invoice.invoice_number,
        month: month,
        packageName: invoice.package_name,
        amount: invoice.amount,
        dueDate: dueDate.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        daysRemaining: daysRemaining,
        paymentMethods: [
          'Transfer: BCA 1234567890 (a/n AGLIS)',
          'OVO/GoPay/DANA: 0821-xxxx-xxxx',
          'Portal: portal.aglis.biz.id'
        ],
        portalUrl: `${process.env.FRONTEND_URL}/invoices/${invoice.id}`
      };

      // Generate message from template
      const message = this.templates.paymentReminder(messageData);

      // Send WhatsApp
      const sendResult = await this.whatsappService.sendMessage(invoice.customer_phone, message);

      // Log notification
      await this.logNotification({
        invoice_id: invoiceId,
        recipient_phone: invoice.customer_phone,
        recipient_type: 'customer',
        notification_type: 'payment_reminder',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Get SLA hours based on priority
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
   * Helper: Get supervisor phone numbers
   */
  async getSupervisorPhones() {
    try {
      const query = `
        SELECT u.phone, u.full_name
        FROM users u
        WHERE u.role = 'supervisor' AND u.is_active = true AND u.phone IS NOT NULL
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting supervisor phones:', error);
      return [];
    }
  }

  /**
   * Helper: Log notification to database
   */
  async logNotification(data) {
    try {
      const query = `
        INSERT INTO whatsapp_notifications 
        (ticket_id, invoice_id, recipient_phone, recipient_type, notification_type, message, status, provider, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const values = [
        data.ticket_id || null,
        data.invoice_id || null,
        data.recipient_phone,
        data.recipient_type,
        data.notification_type,
        data.message,
        data.status,
        data.provider || 'fonnte',
        data.error || null
      ];

      const result = await pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error logging notification:', error);
      // Don't throw - logging failure shouldn't stop notification
      return null;
    }
  }
}

// Export singleton instance
module.exports = new WhatsAppNotificationService();

