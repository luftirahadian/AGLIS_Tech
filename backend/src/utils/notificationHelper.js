const notificationCenterService = require('../services/notificationCenterService');

/**
 * Notification Helper Utilities
 * Helper functions to create notifications for common events
 */

class NotificationHelper {
  /**
   * Notify user about new ticket assignment
   */
  async notifyTicketAssignment(technicianId, ticket, assignedBy) {
    try {
      const notification = await notificationCenterService.createNotification({
        userId: technicianId,
        type: 'ticket',
        title: '🎫 New Ticket Assigned',
        message: `Ticket #${ticket.ticket_number} has been assigned to you by ${assignedBy.full_name || assignedBy.username}`,
        link: `/tickets/${ticket.id}`,
        data: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          customer_name: ticket.customer_name,
          priority: ticket.priority,
          assigned_by: assignedBy.full_name || assignedBy.username
        },
        priority: ticket.priority === 'critical' || ticket.priority === 'high' ? 'high' : 'normal'
      });

      // Broadcast via Socket.IO
      if (global.socketBroadcaster) {
        global.socketBroadcaster.notifyUser(technicianId, 'new_notification', { notification });
      }

      return notification;
    } catch (error) {
      console.error('❌ Notify ticket assignment error:', error);
    }
  }

  /**
   * Notify team members about team assignment
   */
  async notifyTeamAssignment(teamMembers, ticket, assignedBy) {
    try {
      const notifications = [];

      for (const member of teamMembers) {
        const isLead = member.role === 'lead';
        
        const notification = await notificationCenterService.createNotification({
          userId: member.technician_id,
          type: 'ticket',
          title: isLead ? '⭐ Lead Technician Assignment' : '👥 Team Assignment',
          message: `You've been assigned to ticket #${ticket.ticket_number} as ${isLead ? 'Lead' : member.role}`,
          link: `/tickets/${ticket.id}`,
          data: {
            ticket_id: ticket.id,
            ticket_number: ticket.ticket_number,
            customer_name: ticket.customer_name,
            role: member.role,
            is_lead: isLead,
            team_size: teamMembers.length,
            assigned_by: assignedBy.full_name || assignedBy.username
          },
          priority: isLead ? 'high' : 'normal'
        });

        notifications.push(notification);

        // Broadcast via Socket.IO
        if (global.socketBroadcaster) {
          global.socketBroadcaster.notifyUser(member.technician_id, 'new_notification', { notification });
        }
      }

      return notifications;
    } catch (error) {
      console.error('❌ Notify team assignment error:', error);
    }
  }

  /**
   * Notify about ticket status update
   */
  async notifyTicketStatusUpdate(ticket, oldStatus, newStatus, updatedBy) {
    try {
      const notifications = [];

      // Notify customer if ticket completed
      if (newStatus === 'completed' && ticket.customer_id) {
        const customerNotif = await notificationCenterService.createNotification({
          userId: ticket.customer_id,
          type: 'ticket',
          title: '✅ Ticket Completed',
          message: `Your ticket #${ticket.ticket_number} has been completed`,
          link: `/customer/tickets/${ticket.id}`,
          data: {
            ticket_id: ticket.id,
            ticket_number: ticket.ticket_number,
            old_status: oldStatus,
            new_status: newStatus
          },
          priority: 'normal'
        });
        notifications.push(customerNotif);

        if (global.socketBroadcaster) {
          global.socketBroadcaster.notifyUser(ticket.customer_id, 'new_notification', { 
            notification: customerNotif 
          });
        }
      }

      // Notify assigned technician (if not the one who updated)
      if (ticket.assigned_technician_id && ticket.assigned_technician_id !== updatedBy.id) {
        const techNotif = await notificationCenterService.createNotification({
          userId: ticket.assigned_technician_id,
          type: 'ticket',
          title: '🔄 Ticket Status Updated',
          message: `Ticket #${ticket.ticket_number} status changed: ${oldStatus} → ${newStatus}`,
          link: `/tickets/${ticket.id}`,
          data: {
            ticket_id: ticket.id,
            ticket_number: ticket.ticket_number,
            old_status: oldStatus,
            new_status: newStatus,
            updated_by: updatedBy.full_name || updatedBy.username
          },
          priority: 'normal'
        });
        notifications.push(techNotif);

        if (global.socketBroadcaster) {
          global.socketBroadcaster.notifyUser(ticket.assigned_technician_id, 'new_notification', { 
            notification: techNotif 
          });
        }
      }

      return notifications;
    } catch (error) {
      console.error('❌ Notify ticket status update error:', error);
    }
  }

  /**
   * Notify admins about new registration
   */
  async notifyNewRegistration(registration, adminUsers) {
    try {
      const notifications = [];

      for (const admin of adminUsers) {
        const notification = await notificationCenterService.createNotification({
          userId: admin.id,
          type: 'registration',
          title: '✨ New Customer Registration',
          message: `${registration.full_name} has registered for ${registration.package_name}`,
          link: `/registrations/${registration.id}`,
          data: {
            registration_id: registration.id,
            registration_number: registration.registration_number,
            customer_name: registration.full_name,
            package_name: registration.package_name,
            phone: registration.phone
          },
          priority: 'high'
        });

        notifications.push(notification);

        // Broadcast via Socket.IO
        if (global.socketBroadcaster) {
          global.socketBroadcaster.notifyUser(admin.id, 'new_notification', { notification });
        }
      }

      return notifications;
    } catch (error) {
      console.error('❌ Notify new registration error:', error);
    }
  }

  /**
   * Notify user about registration status change
   */
  async notifyRegistrationStatusChange(userId, registration, oldStatus, newStatus) {
    try {
      const statusMessages = {
        verified: '✅ Your registration has been verified',
        approved: '🎉 Your registration has been approved!',
        survey_scheduled: '📅 Survey has been scheduled',
        rejected: '❌ Your registration was not approved',
        customer_created: '🎊 Your account has been created!'
      };

      const message = statusMessages[newStatus] || `Registration status updated: ${newStatus}`;

      const notification = await notificationCenterService.createNotification({
        userId,
        type: 'registration',
        title: 'Registration Update',
        message,
        link: `/customer/tracking/${registration.registration_number}`,
        data: {
          registration_id: registration.id,
          registration_number: registration.registration_number,
          old_status: oldStatus,
          new_status: newStatus
        },
        priority: newStatus === 'approved' || newStatus === 'customer_created' ? 'high' : 'normal'
      });

      // Broadcast via Socket.IO
      if (global.socketBroadcaster) {
        global.socketBroadcaster.notifyUser(userId, 'new_notification', { notification });
      }

      return notification;
    } catch (error) {
      console.error('❌ Notify registration status change error:', error);
    }
  }

  /**
   * Notify about invoice created
   */
  async notifyInvoiceCreated(customerId, invoice) {
    try {
      const notification = await notificationCenterService.createNotification({
        userId: customerId,
        type: 'invoice',
        title: '💰 New Invoice',
        message: `Invoice #${invoice.invoice_number} created: Rp ${invoice.total_amount?.toLocaleString('id-ID')}`,
        link: `/customer/invoices/${invoice.id}`,
        data: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          due_date: invoice.due_date
        },
        priority: 'normal'
      });

      // Broadcast via Socket.IO
      if (global.socketBroadcaster) {
        global.socketBroadcaster.notifyUser(customerId, 'new_notification', { notification });
      }

      return notification;
    } catch (error) {
      console.error('❌ Notify invoice created error:', error);
    }
  }

  /**
   * Notify about payment received
   */
  async notifyPaymentReceived(customerId, payment) {
    try {
      const notification = await notificationCenterService.createNotification({
        userId: customerId,
        type: 'invoice',
        title: '✅ Payment Confirmed',
        message: `Payment of Rp ${payment.amount?.toLocaleString('id-ID')} has been received`,
        link: `/customer/invoices`,
        data: {
          payment_id: payment.id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_date: payment.payment_date
        },
        priority: 'normal'
      });

      // Broadcast via Socket.IO
      if (global.socketBroadcaster) {
        global.socketBroadcaster.notifyUser(customerId, 'new_notification', { notification });
      }

      return notification;
    } catch (error) {
      console.error('❌ Notify payment received error:', error);
    }
  }

  /**
   * Notify about system alert
   */
  async notifySystemAlert(userIds, alert) {
    try {
      const notifications = [];

      for (const userId of userIds) {
        const notification = await notificationCenterService.createNotification({
          userId,
          type: 'alert',
          title: '⚠️ System Alert',
          message: alert.message,
          link: alert.link || null,
          data: alert.data || null,
          priority: 'urgent'
        });

        notifications.push(notification);

        // Broadcast via Socket.IO
        if (global.socketBroadcaster) {
          global.socketBroadcaster.notifyUser(userId, 'new_notification', { notification });
        }
      }

      return notifications;
    } catch (error) {
      console.error('❌ Notify system alert error:', error);
    }
  }

  /**
   * Notify about SLA breach warning
   */
  async notifySLAWarning(technicianId, ticket, hoursRemaining) {
    try {
      const notification = await notificationCenterService.createNotification({
        userId: technicianId,
        type: 'alert',
        title: '⚠️ SLA Warning',
        message: `Ticket #${ticket.ticket_number} SLA deadline in ${hoursRemaining} hours!`,
        link: `/tickets/${ticket.id}`,
        data: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          hours_remaining: hoursRemaining,
          sla_due_date: ticket.sla_due_date
        },
        priority: 'urgent'
      });

      // Broadcast via Socket.IO
      if (global.socketBroadcaster) {
        global.socketBroadcaster.notifyUser(technicianId, 'new_notification', { notification });
      }

      return notification;
    } catch (error) {
      console.error('❌ Notify SLA warning error:', error);
    }
  }
}

module.exports = new NotificationHelper();

