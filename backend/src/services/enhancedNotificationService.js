const pool = require('../config/database');
const whatsappService = require('./whatsappService');

/**
 * Enhanced Notification Service
 * Multi-channel notification delivery (Socket.IO, Email, WhatsApp, Push)
 * with smart routing based on user preferences and notification type
 */
class EnhancedNotificationService {
  
  /**
   * Send notification via multiple channels
   * @param {Object} notification - Notification data
   * @param {Integer} notification.user_id - Target user ID
   * @param {String} notification.type - Notification type
   * @param {String} notification.title - Notification title
   * @param {String} notification.message - Notification message
   * @param {Object} notification.data - Additional data (ticket_id, etc.)
   * @param {String} notification.priority - Priority level
   * @param {Object} io - Socket.IO instance
   */
  async send(notification, io) {
    try {
      const { user_id, type, title, message, data, priority = 'normal' } = notification;
      
      // 1. Create notification in database
      const notifQuery = `
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const notifResult = await pool.query(notifQuery, [
        user_id, type, title, message,
        data ? JSON.stringify(data) : null,
        priority
      ]);
      
      const createdNotification = notifResult.rows[0];
      
      // 2. Get user settings
      const settings = await this.getUserSettings(user_id);
      
      // 3. Send via Socket.IO (always)
      await this.sendViaSocket(user_id, createdNotification, io);
      
      // 4. Send via WhatsApp (if enabled)
      if (settings.whatsapp_notifications) {
        await this.sendViaWhatsApp(user_id, type, data, createdNotification.id);
      }
      
      // 5. Send via Email (if enabled)
      if (settings.email_notifications) {
        // TODO: Implement email service
        console.log(`📧 Email notification to user ${user_id}: ${title}`);
      }
      
      // 6. Send via Push (if enabled)
      if (settings.push_notifications) {
        // TODO: Implement push notification
        console.log(`📱 Push notification to user ${user_id}: ${title}`);
      }
      
      return {
        success: true,
        notification: createdNotification,
        channels: {
          socket: true,
          whatsapp: settings.whatsapp_notifications,
          email: settings.email_notifications,
          push: settings.push_notifications
        }
      };
      
    } catch (error) {
      console.error('❌ Enhanced notification service error:', error);
      throw error;
    }
  }
  
  /**
   * Get user notification settings
   */
  async getUserSettings(userId) {
    const query = `
      SELECT * FROM notification_settings WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Return default settings
      return {
        whatsapp_notifications: true,
        email_notifications: true,
        push_notifications: true,
        sound_notifications: true
      };
    }
    
    return result.rows[0];
  }
  
  /**
   * Send notification via Socket.IO (in-app)
   */
  async sendViaSocket(userId, notification, io) {
    if (!io) {
      console.log('⚠️ Socket.IO instance not available');
      return;
    }
    
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: notification.created_at
    });
    
    console.log(`📡 Socket.IO notification sent to user ${userId}`);
  }
  
  /**
   * Send notification via WhatsApp (individual)
   */
  async sendViaWhatsApp(userId, notificationType, data, notificationId) {
    try {
      // 1. Get user details
      const userQuery = `
        SELECT id, phone, full_name, role FROM users WHERE id = $1
      `;
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].phone) {
        console.log(`⚠️ User ${userId} has no phone number, skipping WhatsApp`);
        return { success: false, reason: 'no_phone' };
      }
      
      const user = userResult.rows[0];
      
      // 2. Get message template
      const template = await this.getMessageTemplate(notificationType);
      
      if (!template) {
        console.log(`⚠️ No WhatsApp template for notification type: ${notificationType}`);
        return { success: false, reason: 'no_template' };
      }
      
      // 3. Fill template with data
      const message = this.fillTemplate(template.template, data || {});
      
      // 4. Send via WhatsApp service
      const result = await whatsappService.sendMessage(user.phone, message);
      
      // 5. Log delivery
      await this.logWhatsAppDelivery({
        notification_id: notificationId,
        user_id: userId,
        recipient_type: 'individual',
        phone_number: user.phone,
        message: message,
        template_name: template.code,
        status: result.success ? 'sent' : 'failed',
        provider: whatsappService.provider,
        provider_response: result
      });
      
      if (result.success) {
        console.log(`✅ WhatsApp sent to ${user.phone}: ${template.name}`);
      } else {
        console.error(`❌ WhatsApp failed to ${user.phone}:`, result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Send WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send notification to WhatsApp groups
   */
  async sendToWhatsAppGroups(notificationType, data, notificationId) {
    try {
      // 1. Get routing rules for this notification type
      const rulesQuery = `
        SELECT * FROM notification_routing_rules
        WHERE notification_type = $1 
          AND send_to_groups = true
          AND is_active = true
        ORDER BY priority DESC
      `;
      
      const rulesResult = await pool.query(rulesQuery, [notificationType]);
      
      if (rulesResult.rows.length === 0) {
        console.log(`ℹ️ No group routing rules for notification type: ${notificationType}`);
        return { sent: 0, groups: [] };
      }
      
      const results = [];
      
      for (const rule of rulesResult.rows) {
        // Check conditions
        if (!this.checkConditions(rule.conditions, data)) {
          continue;
        }
        
        // Get target groups
        const groupsQuery = `
          SELECT * FROM whatsapp_groups
          WHERE id = ANY($1) AND is_active = true
        `;
        
        const groupsResult = await pool.query(groupsQuery, [rule.target_groups || []]);
        
        for (const group of groupsResult.rows) {
          // Get template
          const template = await this.getMessageTemplate(rule.message_template);
          
          if (!template) continue;
          
          // Fill template
          const message = this.fillTemplate(template.template, data);
          
          // Send to group
          const target = group.phone_number || group.group_chat_id;
          
          if (!target) {
            console.log(`⚠️ Group ${group.name} has no phone/chat ID`);
            continue;
          }
          
          const result = await whatsappService.sendMessage(target, message);
          
          // Log delivery
          await this.logWhatsAppDelivery({
            notification_id: notificationId,
            group_id: group.id,
            recipient_type: 'group',
            phone_number: target,
            message: message,
            template_name: template.code,
            status: result.success ? 'sent' : 'failed',
            provider: whatsappService.provider,
            provider_response: result
          });
          
          results.push({
            group: group.name,
            success: result.success
          });
          
          console.log(`📤 WhatsApp group [${group.name}]: ${result.success ? '✅ Sent' : '❌ Failed'}`);
        }
      }
      
      return {
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        groups: results
      };
      
    } catch (error) {
      console.error('❌ Send to WhatsApp groups error:', error);
      throw error;
    }
  }
  
  /**
   * Get message template by code or notification type
   */
  async getMessageTemplate(codeOrType) {
    const query = `
      SELECT * FROM whatsapp_message_templates
      WHERE (code = $1 OR code ILIKE '%' || $1 || '%') 
        AND is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [codeOrType.toUpperCase()]);
    
    return result.rows[0] || null;
  }
  
  /**
   * Fill template with data
   */
  fillTemplate(template, data) {
    let filled = template;
    
    // Replace {{variable}} with actual data
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      filled = filled.replace(regex, value || '-');
    }
    
    // Remove unfilled variables
    filled = filled.replace(/{{[^}]+}}/g, '-');
    
    return filled;
  }
  
  /**
   * Check if conditions match
   */
  checkConditions(conditions, data) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions = always match
    }
    
    for (const [key, value] of Object.entries(conditions)) {
      if (Array.isArray(value)) {
        if (!value.includes(data[key])) {
          return false;
        }
      } else if (typeof value === 'string' && value.startsWith('<=')) {
        const threshold = parseFloat(value.substring(2));
        if (parseFloat(data[key]) > threshold) {
          return false;
        }
      } else {
        if (data[key] !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Log WhatsApp delivery
   */
  async logWhatsAppDelivery(logData) {
    const query = `
      INSERT INTO whatsapp_notifications (
        notification_id, user_id, group_id, recipient_type, phone_number,
        message, template_name, status, provider, provider_response, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    await pool.query(query, [
      logData.notification_id || null,
      logData.user_id || null,
      logData.group_id || null,
      logData.recipient_type,
      logData.phone_number,
      logData.message,
      logData.template_name || null,
      logData.status,
      logData.provider,
      JSON.stringify(logData.provider_response)
    ]);
  }
  
  /**
   * Helper: Send ticket assignment notification
   */
  async sendTicketAssignedNotification(ticketId, technicianId, io) {
    try {
      // Get ticket and technician details
      const query = `
        SELECT 
          t.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.address,
          tech.user_id,
          u.phone as technician_phone,
          u.full_name as technician_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN technicians tech ON tech.id = $2
        LEFT JOIN users u ON tech.user_id = u.id
        WHERE t.id = $1
      `;
      
      const result = await pool.query(query, [ticketId, technicianId]);
      
      if (result.rows.length === 0) {
        throw new Error('Ticket or technician not found');
      }
      
      const ticket = result.rows[0];
      
      // Send notification
      await this.send({
        user_id: ticket.user_id,
        type: 'ticket_assigned',
        title: `Ticket ${ticket.ticket_number} Assigned`,
        message: `You have been assigned ticket ${ticket.ticket_number}`,
        data: {
          ticket_id: ticket.ticket_number,
          customer_name: ticket.customer_name,
          work_zone: ticket.work_zone,
          issue_type: ticket.issue_type,
          priority: ticket.priority,
          address: ticket.address,
          customer_phone: ticket.customer_phone,
          ticket_url: `${process.env.FRONTEND_URL || 'https://portal.aglis.biz.id'}/tickets/${ticketId}`
        },
        priority: ticket.priority
      }, io);
      
      console.log(`✅ Ticket assignment notification sent to user ${ticket.user_id}`);
      
    } catch (error) {
      console.error('❌ Send ticket assigned notification error:', error);
      throw error;
    }
  }
  
  /**
   * Helper: Send ticket status changed notification
   */
  async sendTicketStatusChanged(ticketId, oldStatus, newStatus, io) {
    try {
      const query = `
        SELECT 
          t.*,
          tech.user_id,
          u.full_name as technician_name,
          c.name as customer_name
        FROM tickets t
        LEFT JOIN technicians tech ON t.assigned_technician_id = tech.id
        LEFT JOIN users u ON tech.user_id = u.id
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE t.id = $1
      `;
      
      const result = await pool.query(query, [ticketId]);
      
      if (result.rows.length === 0 || !result.rows[0].user_id) {
        return; // No assigned technician
      }
      
      const ticket = result.rows[0];
      
      await this.send({
        user_id: ticket.user_id,
        type: 'ticket_updated',
        title: `Ticket ${ticket.ticket_number} Status Updated`,
        message: `Status changed from ${oldStatus} to ${newStatus}`,
        data: {
          ticket_id: ticket.ticket_number,
          old_status: oldStatus,
          new_status: newStatus,
          technician_name: ticket.technician_name,
          customer_name: ticket.customer_name,
          additional_notes: ticket.notes || ''
        },
        priority: 'normal'
      }, io);
      
      console.log(`✅ Ticket status change notification sent`);
      
    } catch (error) {
      console.error('❌ Send ticket status notification error:', error);
      throw error;
    }
  }
  
  /**
   * Helper: Send new open ticket notification to groups
   */
  async sendNewOpenTicketToGroups(ticketId, io) {
    try {
      const query = `
        SELECT 
          t.*,
          c.name as customer_name,
          c.address
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE t.id = $1
      `;
      
      const result = await pool.query(query, [ticketId]);
      
      if (result.rows.length === 0) {
        return;
      }
      
      const ticket = result.rows[0];
      
      // Create base notification
      const notifQuery = `
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES (NULL, $1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const notifResult = await pool.query(notifQuery, [
        'new_ticket',
        `New Ticket ${ticket.ticket_number}`,
        `New open ticket available in ${ticket.work_zone}`,
        JSON.stringify({
          ticket_id: ticket.ticket_number,
          customer_name: ticket.customer_name,
          work_zone: ticket.work_zone,
          issue_type: ticket.issue_type,
          priority: ticket.priority,
          address: ticket.address
        }),
        ticket.priority
      ]);
      
      // Send to WhatsApp groups
      await this.sendToWhatsAppGroups('new_ticket', {
        ticket_id: ticket.ticket_number,
        customer_name: ticket.customer_name,
        work_zone: ticket.work_zone,
        issue_type: ticket.issue_type,
        priority: ticket.priority,
        address: ticket.address
      }, notifResult.rows[0].id);
      
      console.log(`✅ New ticket notification sent to groups`);
      
    } catch (error) {
      console.error('❌ Send new ticket to groups error:', error);
      throw error;
    }
  }
}

module.exports = new EnhancedNotificationService();

