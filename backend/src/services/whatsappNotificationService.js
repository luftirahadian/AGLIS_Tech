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
        phone_number: phone,
        recipient_type: 'individual',
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
        customerName: ticket.customer_name,
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
        phone_number: ticket.customer_phone,
        recipient_type: 'individual',
        notification_type: 'ticket_status_update',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      // If ticket is completed, send notification to WhatsApp groups
      if (newStatus === 'completed') {
        await this.notifyGroupTicketCompletion(ticketId, ticket, messageData);
      }

      return sendResult;
    } catch (error) {
      console.error('Error sending ticket status update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 2b. Send Ticket Completion to WhatsApp Groups
   */
  async notifyGroupTicketCompletion(ticketId, ticket, messageData) {
    try {
      // Get active WhatsApp groups that want ticket completion notifications
      const groupsQuery = `
        SELECT id, name, phone_number, group_chat_id
        FROM whatsapp_groups
        WHERE is_active = TRUE
          AND (notification_types @> '["ticket_completed"]'::jsonb 
               OR notification_types @> '["all"]'::jsonb)
      `;
      
      const groupsResult = await pool.query(groupsQuery);
      
      if (groupsResult.rows.length === 0) {
        console.log('No WhatsApp groups configured for ticket completion notifications');
        return { success: true, message: 'No groups configured' };
      }

      // Create group-friendly message
      const groupMessage = `🎉 *TICKET COMPLETED*

Ticket: #${ticket.ticket_number}
Customer: ${messageData.customerName || ticket.customer_name || 'N/A'}
Teknisi: ${messageData.technicianName}

⏱️ Selesai: ${messageData.completedAt}
⌛ Durasi: ${messageData.duration}

📝 Masalah: ${messageData.issue}

✅ Solusi: ${messageData.solution || 'Telah diselesaikan'}

_AGLIS Net - Excellent Service!_ 🌐`;

      // Send to all configured groups
      const results = [];
      for (const group of groupsResult.rows) {
        const targetNumber = group.group_chat_id || group.phone_number;
        
        if (!targetNumber) {
          console.warn(`Group ${group.name} has no phone number or group chat ID`);
          continue;
        }

        const sendResult = await this.whatsappService.sendMessage(targetNumber, groupMessage);
        
        // Log group notification
        await this.logNotification({
          ticket_id: ticketId,
          group_id: group.id,
          phone_number: targetNumber,
          recipient_type: 'group',
          notification_type: 'ticket_completed',
          message: groupMessage,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push({
          group: group.name,
          success: sendResult.success,
          error: sendResult.error
        });

        console.log(`📱 Ticket completion sent to group "${group.name}": ${sendResult.success ? 'SUCCESS' : 'FAILED'}`);
      }

      return {
        success: true,
        groups_notified: results.length,
        results: results
      };

    } catch (error) {
      console.error('Error sending group ticket completion notification:', error);
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
          phone_number: supervisor.phone,
          recipient_type: 'individual',
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
        phone_number: invoice.customer_phone,
        recipient_type: 'individual',
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
      // Format phone number before saving to database
      let formattedPhone = data.phone_number;
      if (formattedPhone && !formattedPhone.includes('@g.us')) {
        // Format individual numbers to international format (62xxx)
        formattedPhone = this.whatsappService.formatPhoneNumber(formattedPhone);
      }
      
      const query = `
        INSERT INTO whatsapp_notifications 
        (ticket_id, invoice_id, phone_number, recipient_type, notification_type, message, status, provider, error_message, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const values = [
        data.ticket_id || null,
        data.invoice_id || null,
        formattedPhone,  // Save formatted phone number
        data.recipient_type,
        data.notification_type,
        data.message,
        data.status,
        data.provider || 'fonnte',
        data.error || null,
        data.status === 'sent' ? new Date() : null  // Set sent_at if status is 'sent'
      ];

      const result = await pool.query(query, values);
      
      console.log(`📝 [Log] Notification saved: ID ${result.rows[0].id}, Phone: ${formattedPhone}, Status: ${data.status}`);
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Error logging notification:', error);
      // Don't throw - logging failure shouldn't stop notification
      return null;
    }
  }

  // ============================================
  // PHASE 2: MEDIUM PRIORITY NOTIFICATIONS
  // ============================================

  /**
   * 5. Send Installation Schedule Notification to Customer
   */
  async notifyInstallationSchedule(registrationId) {
    try {
      const query = `
        SELECT 
          r.id,
          r.registration_number,
          r.installation_date,
          r.installation_time,
          c.name as customer_name,
          c.phone as customer_phone,
          c.address,
          p.name as package_name,
          tech.full_name as technician_name,
          tech.phone as technician_phone
        FROM registrations r
        LEFT JOIN customers c ON r.customer_id = c.id
        LEFT JOIN packages p ON r.package_id = p.id
        LEFT JOIN technicians tech ON r.assigned_technician_id = tech.id
        WHERE r.id = $1
      `;

      const result = await pool.query(query, [registrationId]);
      
      if (result.rows.length === 0) {
        throw new Error('Registration not found');
      }

      const registration = result.rows[0];

      if (!registration.customer_phone) {
        console.warn(`No phone number for customer on registration #${registration.registration_number}`);
        return { success: false, error: 'No customer phone number' };
      }

      const messageData = {
        customerName: registration.customer_name,
        packageName: registration.package_name,
        address: registration.address,
        date: new Date(registration.installation_date).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: registration.installation_time || '09:00 - 17:00',
        technicianName: registration.technician_name || 'Akan ditentukan',
        technicianPhone: registration.technician_phone || 'Akan diinfokan',
        preparations: [
          'Pastikan ada yang bisa menerima teknisi',
          'Siapkan KTP & dokumen registrasi',
          'Akses ke lokasi instalasi router',
          'Pastikan jalur kabel dapat dipasang'
        ]
      };

      const message = this.templates.installationSchedule(messageData);
      const sendResult = await this.whatsappService.sendMessage(registration.customer_phone, message);

      await this.logNotification({
        phone_number: registration.customer_phone,
        recipient_type: 'individual',
        notification_type: 'installation_schedule',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending installation schedule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 6. Send Maintenance Notification to Affected Customers
   */
  async notifyMaintenance(maintenanceData) {
    try {
      const {
        type,
        area,
        startDate,
        startTime,
        duration,
        impact,
        reason
      } = maintenanceData;

      // Get customers in affected area
      const query = `
        SELECT DISTINCT c.id, c.name, c.phone, c.address
        FROM customers c
        WHERE c.status = 'active'
          AND c.address ILIKE $1
          AND c.phone IS NOT NULL
      `;

      const result = await pool.query(query, [`%${area}%`]);
      const customers = result.rows;

      if (customers.length === 0) {
        console.warn(`No customers found in area: ${area}`);
        return { success: false, error: 'No customers in area' };
      }

      const message = `🔧 *PEMBERITAHUAN MAINTENANCE*

Dear Customer,

Kami akan melakukan ${type}:

📅 Tanggal: ${startDate}
⏰ Waktu: ${startTime} (${duration})
🌍 Area: ${area}

${impact ? `⚠️ Impact: ${impact}` : ''}

Tujuan: ${reason}

Mohon maaf atas ketidaknyamanan. Kami akan berusaha menyelesaikan secepat mungkin.

Terima kasih atas pengertiannya! 🙏

_AGLIS Net - Always Connected_`;

      // Send to all affected customers
      const results = [];
      for (const customer of customers) {
        const sendResult = await this.whatsappService.sendMessage(customer.phone, message);
        
        await this.logNotification({
          phone_number: customer.phone,
          recipient_type: 'individual',
          notification_type: 'maintenance_notification',
          message: message,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push(sendResult);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`📱 Maintenance notification sent to ${customers.length} customers in ${area}`);

      return {
        success: results.some(r => r.success),
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        results: results
      };
    } catch (error) {
      console.error('Error sending maintenance notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 7. Send Registration Confirmation to New Customer
   */
  async notifyRegistrationConfirmation(registrationId) {
    try {
      const query = `
        SELECT 
          r.id,
          r.registration_number,
          r.status,
          c.name as customer_name,
          c.phone as customer_phone,
          c.address,
          p.name as package_name,
          p.price
        FROM registrations r
        LEFT JOIN customers c ON r.customer_id = c.id
        LEFT JOIN packages p ON r.package_id = p.id
        WHERE r.id = $1
      `;

      const result = await pool.query(query, [registrationId]);
      
      if (result.rows.length === 0) {
        throw new Error('Registration not found');
      }

      const registration = result.rows[0];

      if (!registration.customer_phone) {
        console.warn(`No phone number for customer on registration #${registration.registration_number}`);
        return { success: false, error: 'No customer phone number' };
      }

      // Use registration confirmation template
      const messageData = {
        customerName: registration.customer_name,
        registrationNumber: registration.registration_number,
        packageName: registration.package_name,
        price: registration.price?.toLocaleString('id-ID'),
        trackingUrl: `${process.env.FRONTEND_URL || 'https://portal.aglis.biz.id'}/track/${registration.registration_number}`
      };

      const message = this.templates.registrationConfirmation(messageData);

      const sendResult = await this.whatsappService.sendMessage(registration.customer_phone, message);

      await this.logNotification({
        phone_number: registration.customer_phone,
        recipient_type: 'individual',
        notification_type: 'registration_confirmation',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending registration confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 8. Send Daily Summary to Managers and Supervisors
   */
  async sendDailySummary() {
    try {
      const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Get ticket statistics for today
      const ticketStats = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status IN ('open', 'assigned') THEN 1 END) as pending
        FROM tickets
        WHERE DATE(created_at) = CURRENT_DATE
      `);

      // Get technician statistics
      const techStats = await pool.query(`
        SELECT 
          COUNT(CASE WHEN availability_status = 'available' THEN 1 END) as active_technicians,
          COUNT(*) as total_technicians
        FROM technicians
        WHERE employment_status = 'active'
      `);

      // Get average completion
      const avgStats = await pool.query(`
        SELECT 
          COALESCE(AVG(ticket_count), 0) as avg_completion
        FROM (
          SELECT t.assigned_technician_id, COUNT(*) as ticket_count
          FROM tickets t
          WHERE DATE(t.completed_at) = CURRENT_DATE
          GROUP BY t.assigned_technician_id
        ) as tech_tickets
      `);

      // Get SLA achievement
      const slaStats = await pool.query(`
        SELECT 
          COUNT(CASE WHEN actual_duration <= expected_duration THEN 1 END)::float / 
          NULLIF(COUNT(*), 0) * 100 as sla_achievement
        FROM tickets
        WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE
      `);

      // Get overdue tickets
      const overdueStats = await pool.query(`
        SELECT COUNT(*) as overdue_tickets
        FROM tickets t
        WHERE status IN ('open', 'assigned', 'in_progress')
          AND created_at + (CASE priority
            WHEN 'urgent' THEN INTERVAL '4 hours'
            WHEN 'high' THEN INTERVAL '8 hours'
            WHEN 'normal' THEN INTERVAL '24 hours'
            ELSE INTERVAL '48 hours'
          END) < NOW()
      `);

      const stats = ticketStats.rows[0];
      const techData = techStats.rows[0];
      const avgData = avgStats.rows[0];
      const slaData = slaStats.rows[0];
      const overdueData = overdueStats.rows[0];

      const messageData = {
        date: today,
        totalTickets: parseInt(stats.total_tickets),
        completed: parseInt(stats.completed),
        inProgress: parseInt(stats.in_progress),
        pending: parseInt(stats.pending),
        activeTechnicians: parseInt(techData.active_technicians),
        totalTechnicians: parseInt(techData.total_technicians),
        avgCompletion: parseFloat(avgData.avg_completion).toFixed(1),
        slaAchievement: parseFloat(slaData.sla_achievement || 0).toFixed(0),
        overdueTickets: parseInt(overdueData.overdue_tickets),
        nearSlaTickets: 0, // TODO: Calculate near SLA
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      };

      const message = this.templates.dailySummary(messageData);

      // Get manager and supervisor phones
      const recipients = await pool.query(`
        SELECT phone, full_name, role
        FROM users
        WHERE role IN ('manager', 'supervisor', 'admin')
          AND is_active = true
          AND phone IS NOT NULL
      `);

      if (recipients.rows.length === 0) {
        console.warn('No managers/supervisors found');
        return { success: false, error: 'No recipients' };
      }

      // Send to all recipients
      const results = [];
      for (const recipient of recipients.rows) {
        const sendResult = await this.whatsappService.sendMessage(recipient.phone, message);
        
        await this.logNotification({
          phone_number: recipient.phone,
          recipient_type: recipient.role,
          notification_type: 'daily_summary',
          message: message,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push(sendResult);

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`📱 Daily summary sent to ${recipients.rows.length} managers/supervisors`);

      return {
        success: results.some(r => r.success),
        totalSent: results.filter(r => r.success).length,
        results: results
      };
    } catch (error) {
      console.error('Error sending daily summary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 9. Send Emergency Alert to All Team
   */
  async sendEmergencyAlert(alertData) {
    try {
      const {
        type,
        area,
        customersAffected,
        status,
        eta,
        actions
      } = alertData;

      const messageData = {
        type: type,
        area: area,
        customersAffected: customersAffected,
        status: status,
        eta: eta,
        actions: actions || [
          'NOC: Investigating root cause',
          'CS: Notify affected customers',
          'Technicians: Standby for deployment'
        ]
      };

      const message = this.templates.emergencyAlert(messageData);

      // Get all active staff (technicians, supervisors, managers, NOC, CS)
      const recipients = await pool.query(`
        SELECT DISTINCT phone, full_name, role
        FROM users
        WHERE role IN ('technician', 'supervisor', 'manager', 'noc', 'customer_service', 'admin')
          AND is_active = true
          AND phone IS NOT NULL
      `);

      if (recipients.rows.length === 0) {
        console.warn('No team members found');
        return { success: false, error: 'No recipients' };
      }

      // Also send to WhatsApp groups
      const groups = await pool.query(`
        SELECT id, name, group_chat_id
        FROM whatsapp_groups
        WHERE is_active = true
          AND group_chat_id IS NOT NULL
          AND category IN ('technicians', 'supervisors', 'managers', 'noc')
      `);

      // Send to individuals
      const results = [];
      for (const recipient of recipients.rows) {
        const sendResult = await this.whatsappService.sendMessage(recipient.phone, message);
        
        await this.logNotification({
          phone_number: recipient.phone,
          recipient_type: recipient.role,
          notification_type: 'emergency_alert',
          message: message,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push(sendResult);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Send to groups
      for (const group of groups.rows) {
        const sendResult = await this.whatsappService.sendMessage(group.group_chat_id, message);
        
        await this.logNotification({
          group_id: group.id,
          phone_number: group.group_chat_id,
          recipient_type: 'group',
          notification_type: 'emergency_alert',
          message: message,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push(sendResult);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log(`🚨 Emergency alert sent to ${recipients.rows.length} individuals and ${groups.rows.length} groups`);

      return {
        success: results.some(r => r.success),
        totalSent: results.filter(r => r.success).length,
        totalRecipients: recipients.rows.length + groups.rows.length,
        results: results
      };
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // PHASE 3: CUSTOMER ENGAGEMENT & RETENTION
  // ============================================

  /**
   * 10. Send Welcome Message after Service Activation
   */
  async sendWelcomeMessage(customerId) {
    try {
      const query = `
        SELECT 
          c.customer_id,
          c.name,
          c.phone,
          c.wifi_ssid,
          c.wifi_password,
          p.name as package_name,
          p.speed_mbps,
          p.price,
          c.billing_day_of_month,
          c.activated_at
        FROM customers c
        LEFT JOIN packages p ON c.package_id = p.id
        WHERE c.id = $1
      `;

      const result = await pool.query(query, [customerId]);
      
      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      const customer = result.rows[0];

      if (!customer.phone) {
        console.warn(`No phone number for customer ${customer.customer_id}`);
        return { success: false, error: 'No customer phone' };
      }

      const messageData = {
        customerName: customer.name,
        customerId: customer.customer_id,
        packageName: customer.package_name,
        price: customer.price,
        billingDate: customer.billing_day_of_month || 1,
        wifiName: customer.wifi_ssid || 'AGLIS-NET-' + customer.customer_id.slice(-4),
        wifiPassword: customer.wifi_password || '********',
        speedMbps: customer.speed_mbps || 100,
        supportPhone: '0821-xxxx-xxxx'
      };

      const message = this.templates.welcomeMessage(messageData);
      const sendResult = await this.whatsappService.sendMessage(customer.phone, message);

      await this.logNotification({
        phone_number: customer.phone,
        recipient_type: 'individual',
        notification_type: 'welcome_message',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending welcome message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 11. Send Package Upgrade Offer
   */
  async sendUpgradeOffer(customerId, upgradePackageId) {
    try {
      const query = `
        SELECT 
          c.name as customer_name,
          c.phone,
          current_pkg.name as current_package,
          current_pkg.price as current_price,
          current_pkg.speed_mbps as current_speed,
          upgrade_pkg.name as upgrade_package,
          upgrade_pkg.price as upgrade_price,
          upgrade_pkg.speed_mbps as upgrade_speed
        FROM customers c
        LEFT JOIN packages current_pkg ON c.package_id = current_pkg.id
        LEFT JOIN packages upgrade_pkg ON upgrade_pkg.id = $2
        WHERE c.id = $1
      `;

      const result = await pool.query(query, [customerId, upgradePackageId]);
      
      if (result.rows.length === 0) {
        throw new Error('Customer or package not found');
      }

      const data = result.rows[0];

      if (!data.phone) {
        return { success: false, error: 'No customer phone' };
      }

      const messageData = {
        customerName: data.customer_name,
        currentPackage: data.current_package,
        currentPrice: data.current_price,
        currentSpeed: data.current_speed,
        upgradePackage: data.upgrade_package,
        upgradePrice: data.upgrade_price,
        upgradeSpeed: data.upgrade_speed,
        discount: 20, // 20% discount for first 3 months
        benefits: [
          `${data.upgrade_speed}x kecepatan lebih cepat`,
          'Streaming 4K tanpa buffer',
          'Support multiple devices',
          'Free installation upgrade',
          'No contract extension'
        ],
        validUntil: '31 Oktober 2025'
      };

      const message = this.templates.packageUpgradeOffer(messageData);
      const sendResult = await this.whatsappService.sendMessage(data.phone, message);

      await this.logNotification({
        phone_number: data.phone,
        recipient_type: 'individual',
        notification_type: 'upgrade_offer',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending upgrade offer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 12. Send Customer Satisfaction Survey
   */
  async sendSatisfactionSurvey(ticketId) {
    try {
      const query = `
        SELECT 
          t.ticket_number,
          t.title as service_type,
          t.completed_at,
          c.name as customer_name,
          c.phone as customer_phone,
          tech.full_name as technician_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
        WHERE t.id = $1 AND t.status = 'completed'
      `;

      const result = await pool.query(query, [ticketId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Ticket not found or not completed' };
      }

      const ticket = result.rows[0];

      if (!ticket.customer_phone) {
        return { success: false, error: 'No customer phone' };
      }

      const messageData = {
        customerName: ticket.customer_name,
        ticketNumber: ticket.ticket_number,
        technicianName: ticket.technician_name,
        serviceType: ticket.service_type,
        completedDate: new Date(ticket.completed_at).toLocaleDateString('id-ID'),
        surveyUrl: `${process.env.FRONTEND_URL}/tickets/${ticketId}/rate`
      };

      const message = this.templates.satisfactionSurvey(messageData);
      const sendResult = await this.whatsappService.sendMessage(ticket.customer_phone, message);

      await this.logNotification({
        ticket_id: ticketId,
        phone_number: ticket.customer_phone,
        recipient_type: 'individual',
        notification_type: 'satisfaction_survey',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending satisfaction survey:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 13. Send Technician Performance Report
   */
  async sendTechnicianPerformance(technicianId, period = 'This Week') {
    try {
      // Get technician performance data
      const query = `
        SELECT 
          tech.full_name as technician_name,
          u.phone,
          COUNT(t.id) as tickets_completed,
          COALESCE(AVG(t.customer_rating), 0) as average_rating,
          COUNT(CASE WHEN t.actual_duration <= t.expected_duration THEN 1 END)::float / 
            NULLIF(COUNT(*), 0) * 100 as sla_achievement
        FROM technicians tech
        LEFT JOIN users u ON tech.user_id = u.id
        LEFT JOIN tickets t ON tech.id = t.assigned_technician_id 
          AND t.status = 'completed'
          AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days'
        WHERE tech.id = $1
        GROUP BY tech.id, tech.full_name, u.phone
      `;

      const result = await pool.query(query, [technicianId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Technician not found' };
      }

      const tech = result.rows[0];

      if (!tech.phone) {
        return { success: false, error: 'No technician phone' };
      }

      // Get rank
      const rankQuery = `
        SELECT tech_id, ROW_NUMBER() OVER (ORDER BY avg_rating DESC, tickets DESC) as rank
        FROM (
          SELECT 
            t.assigned_technician_id as tech_id,
            COUNT(*) as tickets,
            AVG(customer_rating) as avg_rating
          FROM tickets t
          WHERE t.status = 'completed'
            AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY t.assigned_technician_id
        ) ranked
      `;

      const rankResult = await pool.query(rankQuery);
      const techRank = rankResult.rows.find(r => r.tech_id === technicianId);

      const messageData = {
        technicianName: tech.technician_name,
        period: period,
        ticketsCompleted: parseInt(tech.tickets_completed),
        averageRating: parseFloat(tech.average_rating).toFixed(1),
        slaAchievement: parseInt(tech.sla_achievement || 0),
        rank: techRank ? parseInt(techRank.rank) : 0,
        totalTechnicians: rankResult.rows.length,
        topPerformerBonus: techRank && techRank.rank <= 3 ? 500000 : null,
        improvements: tech.average_rating < 4.0 ? ['Improve response time', 'Better communication'] : []
      };

      const message = this.templates.technicianPerformance(messageData);
      const sendResult = await this.whatsappService.sendMessage(tech.phone, message);

      await this.logNotification({
        phone_number: tech.phone,
        recipient_type: 'individual',
        notification_type: 'performance_report',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      return sendResult;
    } catch (error) {
      console.error('Error sending technician performance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 14. Send Promotion Campaign
   */
  async sendPromotionCampaign(campaignData, targetCustomers = 'all') {
    try {
      let query = `
        SELECT id, name, phone
        FROM customers
        WHERE status = 'active' AND phone IS NOT NULL
      `;

      // Filter by target if specified
      if (targetCustomers !== 'all') {
        if (targetCustomers.package_id) {
          query += ` AND package_id = ${targetCustomers.package_id}`;
        }
        if (targetCustomers.city) {
          query += ` AND city ILIKE '%${targetCustomers.city}%'`;
        }
      }

      const result = await pool.query(query);
      const customers = result.rows;

      if (customers.length === 0) {
        return { success: false, error: 'No customers found' };
      }

      const results = [];
      for (const customer of customers) {
        const messageData = {
          customerName: customer.name,
          ...campaignData
        };

        const message = this.templates.promotionCampaign(messageData);
        const sendResult = await this.whatsappService.sendMessage(customer.phone, message);

        await this.logNotification({
          phone_number: customer.phone,
          recipient_type: 'individual',
          notification_type: 'promotion_campaign',
          message: message,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push(sendResult);

        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`📱 Promotion campaign sent to ${customers.length} customers`);

      return {
        success: results.some(r => r.success),
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        totalCustomers: customers.length,
        results: results
      };
    } catch (error) {
      console.error('Error sending promotion campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send team assignment notification
   * Sends different messages for lead vs members
   */
  async notifyTechnicianTeamAssignment(ticketId, technicianId, role, teamMembers) {
    try {
      // Get ticket and technician details
      const ticketQuery = `
        SELECT t.*, c.name as customer_name, c.address as customer_address
        FROM tickets t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.id = $1
      `;
      const ticketResult = await pool.query(ticketQuery, [ticketId]);
      
      if (ticketResult.rows.length === 0) {
        return { success: false, error: 'Ticket not found' };
      }

      const ticket = ticketResult.rows[0];

      const techResult = await pool.query(
        'SELECT * FROM technicians WHERE id = $1',
        [technicianId]
      );

      if (techResult.rows.length === 0) {
        return { success: false, error: 'Technician not found' };
      }

      const technician = techResult.rows[0];
      const detailUrl = `${process.env.FRONTEND_URL || 'https://portal.aglis.biz.id'}/tickets/${ticketId}`;

      let message;

      if (role === 'lead') {
        // Lead technician message
        const otherMembers = teamMembers
          .filter(m => m.technician_id !== technicianId)
          .map(m => ({ name: m.full_name, role: m.role }));

        const messageData = {
          technicianName: technician.full_name,
          ticketNumber: ticket.ticket_number,
          customerName: ticket.customer_name,
          location: ticket.customer_address || 'See detail',
          teamMembers: otherMembers,
          teamCount: teamMembers.length,
          detailUrl
        };

        message = this.templates.teamAssignmentLead(messageData);
      } else {
        // Team member/support message
        const leadTech = teamMembers.find(m => m.role === 'lead');

        const messageData = {
          technicianName: technician.full_name,
          ticketNumber: ticket.ticket_number,
          customerName: ticket.customer_name,
          location: ticket.customer_address || 'See detail',
          leadName: leadTech?.full_name || 'TBA',
          leadPhone: leadTech?.phone || '-',
          role: role,
          detailUrl
        };

        message = this.templates.teamAssignmentMember(messageData);
      }

      // Send WhatsApp
      const sendResult = await this.whatsappService.sendMessage(technician.phone, message);

      // Log notification
      await this.logNotification({
        ticket_id: ticketId,
        phone_number: technician.phone,
        recipient_type: 'individual',
        notification_type: 'team_assignment',
        message: message,
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.provider,
        error: sendResult.error
      });

      console.log(`📱 Team assignment notification sent to ${technician.full_name} (${role}): ${sendResult.success ? 'SUCCESS' : 'FAILED'}`);

      return sendResult;

    } catch (error) {
      console.error('Error sending team assignment notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification when technician is added to existing team
   */
  async notifyTechnicianAdded(ticketId, technicianId, role) {
    try {
      // Get current team
      const teamQuery = `
        SELECT 
          tt.*,
          t.full_name,
          t.phone
        FROM ticket_technicians tt
        JOIN technicians t ON tt.technician_id = t.id
        WHERE tt.ticket_id = $1 AND tt.is_active = TRUE
      `;
      const teamResult = await pool.query(teamQuery, [ticketId]);

      // Send notification
      return await this.notifyTechnicianTeamAssignment(ticketId, technicianId, role, teamResult.rows);

    } catch (error) {
      console.error('Error notifying technician added:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notifications when new ticket is created
   * Sends to: Customer, Supervisor Group, Technician Group
   */
  async notifyTicketCreated(ticketId) {
    try {
      console.log(`📱 Sending ticket created notifications for ticket #${ticketId}`);

      // Get ticket and customer details
      const ticketQuery = `
        SELECT 
          t.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.address as customer_address
        FROM tickets t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.id = $1
      `;
      const ticketResult = await pool.query(ticketQuery, [ticketId]);

      if (ticketResult.rows.length === 0) {
        console.error(`Ticket #${ticketId} not found`);
        return { success: false, error: 'Ticket not found' };
      }

      const ticket = ticketResult.rows[0];
      const frontendUrl = process.env.FRONTEND_URL || 'https://portal.aglis.biz.id';
      
      const results = {
        customer: null,
        supervisorGroup: null,
        technicianGroup: null
      };

      // 1. Send to CUSTOMER
      if (ticket.customer_phone) {
        const customerMessage = this.templates.ticketCreatedCustomer({
          customerName: ticket.customer_name,
          ticketNumber: ticket.ticket_number,
          type: this.formatTicketType(ticket.type),
          title: ticket.title,
          trackingUrl: `${frontendUrl}/tickets/${ticket.id}`
        });

        const customerResult = await this.whatsappService.sendMessage(
          ticket.customer_phone,
          customerMessage
        );

        await this.logNotification({
          ticket_id: ticket.id,
          phone_number: ticket.customer_phone,
          recipient_type: 'individual',
          notification_type: 'ticket_created',
          message: customerMessage,
          status: customerResult.success ? 'sent' : 'failed',
          provider: customerResult.provider,
          error: customerResult.error
        });

        results.customer = customerResult;
        console.log(`📱 Customer notification: ${customerResult.success ? 'SUCCESS' : 'FAILED'}`);
      }

      // 2. Send to SUPERVISOR GROUP
      const supervisorGroupQuery = `
        SELECT phone_number, name 
        FROM whatsapp_groups 
        WHERE is_active = TRUE 
        AND notification_types::text LIKE '%ticket_created%'
        AND name ILIKE '%supervisor%'
        LIMIT 1
      `;
      const supervisorGroup = await pool.query(supervisorGroupQuery);

      if (supervisorGroup.rows.length > 0) {
        const group = supervisorGroup.rows[0];
        const supervisorMessage = this.templates.ticketCreatedSupervisor({
          ticketNumber: ticket.ticket_number,
          customerName: ticket.customer_name,
          customerPhone: ticket.customer_phone,
          type: this.formatTicketType(ticket.type),
          priority: ticket.priority,
          title: ticket.title,
          assignUrl: `${frontendUrl}/tickets`
        });

        const supervisorResult = await this.whatsappService.sendMessage(
          group.phone_number,
          supervisorMessage
        );

        await this.logNotification({
          ticket_id: ticket.id,
          phone_number: group.phone_number,
          recipient_type: 'group',
          notification_type: 'ticket_created',
          message: supervisorMessage,
          status: supervisorResult.success ? 'sent' : 'failed',
          provider: supervisorResult.provider,
          error: supervisorResult.error
        });

        results.supervisorGroup = supervisorResult;
        console.log(`📱 Supervisor group notification: ${supervisorResult.success ? 'SUCCESS' : 'FAILED'}`);
      }

      // 3. Send to TECHNICIAN GROUP
      const technicianGroupQuery = `
        SELECT phone_number, name 
        FROM whatsapp_groups 
        WHERE is_active = TRUE 
        AND notification_types::text LIKE '%ticket_created%'
        AND name ILIKE '%teknisi%'
        LIMIT 1
      `;
      const technicianGroup = await pool.query(technicianGroupQuery);

      if (technicianGroup.rows.length > 0) {
        const group = technicianGroup.rows[0];
        const technicianMessage = this.templates.ticketCreatedTechnicians({
          ticketNumber: ticket.ticket_number,
          customerName: ticket.customer_name,
          type: this.formatTicketType(ticket.type),
          priority: ticket.priority,
          location: ticket.customer_address || 'Check detail',
          description: ticket.description.substring(0, 100) + (ticket.description.length > 100 ? '...' : '')
        });

        const technicianResult = await this.whatsappService.sendMessage(
          group.phone_number,
          technicianMessage
        );

        await this.logNotification({
          ticket_id: ticket.id,
          phone_number: group.phone_number,
          recipient_type: 'group',
          notification_type: 'ticket_created',
          message: technicianMessage,
          status: technicianResult.success ? 'sent' : 'failed',
          provider: technicianResult.provider,
          error: technicianResult.error
        });

        results.technicianGroup = technicianResult;
        console.log(`📱 Technician group notification: ${technicianResult.success ? 'SUCCESS' : 'FAILED'}`);
      }

      console.log(`✅ Ticket created notifications completed for #${ticket.ticket_number}`);
      
      return {
        success: true,
        results: results
      };

    } catch (error) {
      console.error('Error sending ticket created notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * NEW: Send notification to WhatsApp groups when new customer registration
   */
  async notifyGroupNewRegistration(registrationData) {
    try {
      console.log('📱 [WhatsApp] Notifying groups about new registration:', registrationData.registration_number);
      
      // Get active WhatsApp groups that want new registration notifications
      const groupsQuery = `
        SELECT id, name, phone_number, group_chat_id
        FROM whatsapp_groups
        WHERE is_active = TRUE
          AND (notification_types @> '["new_registration"]'::jsonb 
               OR notification_types @> '["all"]'::jsonb)
      `;
      
      const groupsResult = await pool.query(groupsQuery);
      
      if (groupsResult.rows.length === 0) {
        console.log('⚠️ No WhatsApp groups configured for new registration notifications');
        return { success: true, message: 'No groups configured' };
      }

      // Create group-friendly message
      const groupMessage = `🎉 *PENDAFTAR BARU!*

📋 Nomor Registrasi: ${registrationData.registration_number}
👤 Nama: ${registrationData.full_name}
📱 No. HP: ${registrationData.phone}
📧 Email: ${registrationData.email || '-'}

📍 Lokasi: ${registrationData.city}, ${registrationData.province}
🏠 Alamat Instalasi: ${registrationData.installation_address || registrationData.address}

📦 Paket: ${registrationData.package_name || 'Belum dipilih'}
🛠️ Jenis Layanan: ${this.formatServiceType(registrationData.service_type)}
📅 Tanggal Preferensi: ${registrationData.preferred_date || '-'}

💬 Catatan: ${registrationData.notes || '-'}

⏰ Waktu: ${new Date().toLocaleString('id-ID', { 
  timeZone: 'Asia/Jakarta',
  dateStyle: 'full',
  timeStyle: 'short'
})}

_AGLIS Net - Excellent Service!_ 🌐`;

      // Send to all configured groups
      const results = [];
      for (const group of groupsResult.rows) {
        const targetNumber = group.group_chat_id || group.phone_number;
        
        if (!targetNumber) {
          console.warn(`⚠️ Group ${group.name} has no phone number or group chat ID`);
          continue;
        }

        console.log(`📤 Sending to group "${group.name}" (${targetNumber})...`);
        const sendResult = await this.whatsappService.sendMessage(targetNumber, groupMessage);
        
        // Log group notification
        await this.logNotification({
          phone_number: targetNumber,
          recipient_type: 'group',
          group_id: group.id,
          notification_type: 'new_registration',
          message: groupMessage,
          status: sendResult.success ? 'sent' : 'failed',
          provider: sendResult.provider,
          error: sendResult.error
        });

        results.push({
          group: group.name,
          success: sendResult.success,
          error: sendResult.error
        });

        console.log(`${sendResult.success ? '✅' : '❌'} Group "${group.name}": ${sendResult.success ? 'SENT' : 'FAILED'}`);
      }

      return {
        success: true,
        groups_notified: results.length,
        results: results
      };

    } catch (error) {
      console.error('❌ Error sending group new registration notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Format service type for display
   */
  formatServiceType(type) {
    const types = {
      installation: 'Instalasi Baru',
      upgrade: 'Upgrade Paket',
      maintenance: 'Maintenance',
      repair: 'Perbaikan',
      relocation: 'Relokasi'
    };
    return types[type] || type;
  }

  /**
   * Helper: Format ticket type for display
   */
  formatTicketType(type) {
    const types = {
      installation: 'Installation',
      repair: 'Repair',
      maintenance: 'Maintenance',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      wifi_setup: 'WiFi Setup',
      dismantle: 'Dismantle',
      speed_test: 'Speed Test',
      bandwidth_upgrade: 'Bandwidth Upgrade',
      redundancy_setup: 'Redundancy Setup',
      network_config: 'Network Config',
      security_audit: 'Security Audit'
    };
    return types[type] || type;
  }
}

// Export singleton instance
module.exports = new WhatsAppNotificationService();

