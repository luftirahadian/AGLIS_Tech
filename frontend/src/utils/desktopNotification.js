/**
 * Desktop Push Notification Utility
 * Provides browser native notifications for important alerts
 */

class DesktopNotificationManager {
  constructor() {
    this.permission = 'default';
    this.enabled = false;
    this.checkPermission();
  }

  /**
   * Check current notification permission status
   */
  checkPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser does not support desktop notifications');
      return false;
    }

    this.permission = Notification.permission;
    this.enabled = this.permission === 'granted';
    return this.enabled;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.enabled = true;
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.enabled = permission === 'granted';
      
      if (this.enabled) {
        console.log('✅ Desktop notifications enabled');
        // Show welcome notification
        this.show({
          title: 'Notifikasi Aktif!',
          body: 'Anda akan menerima notifikasi desktop untuk update penting',
          icon: '/aglis-logo.svg',
          tag: 'welcome'
        });
      } else {
        console.log('❌ Desktop notifications denied');
      }
      
      return this.enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show desktop notification
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {string} options.icon - Icon URL (optional)
   * @param {string} options.tag - Unique tag to prevent duplicates (optional)
   * @param {boolean} options.requireInteraction - Keep notification visible (optional)
   * @param {Function} options.onClick - Click handler (optional)
   * @param {Object} options.data - Custom data (optional)
   */
  show(options) {
    if (!this.enabled) {
      console.log('Desktop notifications not enabled');
      return null;
    }

    try {
      const {
        title,
        body,
        icon = '/aglis-logo.svg',
        tag,
        requireInteraction = false,
        onClick,
        data = {}
      } = options;

      const notification = new Notification(title, {
        body,
        icon,
        tag,
        requireInteraction,
        badge: '/aglis-logo.svg',
        vibrate: [200, 100, 200],
        data,
        silent: false
      });

      // Handle click
      if (onClick) {
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          onClick(event, data);
          notification.close();
        };
      } else {
        // Default: focus window on click
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();
        };
      }

      // Auto-close after 10 seconds for non-urgent notifications
      if (!requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing desktop notification:', error);
      return null;
    }
  }

  /**
   * Show notification for new ticket
   */
  showNewTicket(ticket) {
    return this.show({
      title: '🎫 Tiket Baru',
      body: `${ticket.ticket_number}: ${ticket.title || 'No title'}`,
      tag: `ticket-${ticket.id}`,
      requireInteraction: true,
      onClick: () => {
        window.location.href = `/tickets/${ticket.id}`;
      },
      data: { type: 'ticket', id: ticket.id }
    });
  }

  /**
   * Show notification for ticket assignment
   */
  showTicketAssignment(ticket) {
    return this.show({
      title: '🔔 Tiket Ditugaskan',
      body: `${ticket.ticket_number} telah ditugaskan kepada Anda`,
      tag: `assignment-${ticket.id}`,
      requireInteraction: true,
      onClick: () => {
        window.location.href = `/tickets/${ticket.id}`;
      },
      data: { type: 'assignment', id: ticket.id }
    });
  }

  /**
   * Show notification for new registration
   */
  showNewRegistration(registration) {
    return this.show({
      title: '🎉 Pendaftar Baru!',
      body: `${registration.full_name} - ${registration.phone}`,
      tag: `registration-${registration.id}`,
      onClick: () => {
        window.location.href = '/registrations';
      },
      data: { type: 'registration', id: registration.id }
    });
  }

  /**
   * Show notification for SLA warning
   */
  showSLAWarning(ticket) {
    return this.show({
      title: '⚠️ SLA Warning!',
      body: `Tiket ${ticket.ticket_number} mendekati deadline SLA`,
      tag: `sla-${ticket.id}`,
      requireInteraction: true,
      onClick: () => {
        window.location.href = `/tickets/${ticket.id}`;
      },
      data: { type: 'sla_warning', id: ticket.id }
    });
  }

  /**
   * Show notification for payment received
   */
  showPaymentReceived(payment) {
    return this.show({
      title: '💵 Pembayaran Diterima',
      body: `Rp ${(payment.amount || 0).toLocaleString('id-ID')} - ${payment.invoice_number || 'Unknown'}`,
      tag: `payment-${payment.id}`,
      onClick: () => {
        if (payment.invoice_id) {
          window.location.href = `/invoices/${payment.invoice_id}`;
        }
      },
      data: { type: 'payment', id: payment.id }
    });
  }

  /**
   * Show notification for system alert
   */
  showSystemAlert(alert) {
    return this.show({
      title: '🚨 System Alert',
      body: alert.message || 'System alert detected',
      tag: `alert-${alert.id || Date.now()}`,
      requireInteraction: true,
      data: { type: 'system_alert', ...alert }
    });
  }

  /**
   * Show custom notification
   */
  showCustom(title, body, options = {}) {
    return this.show({
      title,
      body,
      ...options
    });
  }

  /**
   * Clear all notifications with specific tag
   */
  clearByTag(tag) {
    // Note: Browser API doesn't provide a way to clear notifications by tag
    // They auto-close after timeout or user interaction
    console.log(`Notification tag "${tag}" will auto-close`);
  }

  /**
   * Check if notifications are supported
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermission() {
    return this.permission;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Create singleton instance
const desktopNotification = new DesktopNotificationManager();

export default desktopNotification;

