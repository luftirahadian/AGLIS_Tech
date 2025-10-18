// ╔═══════════════════════════════════════════════════════════════╗
// ║  Socket.IO Broadcaster Utility                               ║
// ║  Purpose: Broadcast events from API server to Socket.IO server║
// ║  Method: Redis Pub/Sub                                       ║
// ╚═══════════════════════════════════════════════════════════════╝

const { createClient } = require('redis');

class SocketBroadcaster {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
        password: process.env.REDIS_PASSWORD
      });

      this.client.on('error', (err) => {
        console.error('❌ Socket Broadcaster Redis Error:', err);
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Socket Broadcaster connected to Redis');
    } catch (error) {
      console.error('❌ Socket Broadcaster connection failed:', error);
    }
  }

  /**
   * Broadcast an event to all connected Socket.IO clients
   * @param {string} event - Event name
   * @param {object} payload - Event data
   */
  async broadcast(event, payload) {
    if (!this.isConnected) {
      console.warn('⚠️ Socket Broadcaster not connected, skipping broadcast');
      return;
    }

    try {
      const message = JSON.stringify({ event, payload, room: null });
      await this.client.publish('broadcast', message);
      console.log(`📡 Broadcasted ${event} to all clients`);
    } catch (error) {
      console.error('❌ Broadcast error:', error);
    }
  }

  /**
   * Broadcast an event to a specific room
   * @param {string} room - Room name (e.g., 'role_admin', 'user_123', 'ticket_456')
   * @param {string} event - Event name
   * @param {object} payload - Event data
   */
  async broadcastToRoom(room, event, payload) {
    if (!this.isConnected) {
      console.warn('⚠️ Socket Broadcaster not connected, skipping broadcast');
      return;
    }

    try {
      const message = JSON.stringify({ event, payload, room });
      await this.client.publish('broadcast', message);
      console.log(`📡 Broadcasted ${event} to room: ${room}`);
    } catch (error) {
      console.error('❌ Broadcast to room error:', error);
    }
  }

  /**
   * Emit notification to a specific user
   * @param {number} userId - User ID
   * @param {object} notification - Notification data
   */
  async notifyUser(userId, notification) {
    await this.broadcastToRoom(`user_${userId}`, 'notification', notification);
  }

  /**
   * Emit notification to a role (admin, technician, customer)
   * @param {string} role - Role name
   * @param {object} notification - Notification data
   */
  async notifyRole(role, notification) {
    await this.broadcastToRoom(`role_${role}`, 'notification', notification);
  }

  /**
   * Emit ticket update event
   * @param {number} ticketId - Ticket ID
   * @param {object} ticketData - Ticket data
   */
  async ticketUpdated(ticketId, ticketData) {
    await this.broadcast('ticket_updated', { ticketId, ...ticketData });
    await this.broadcastToRoom(`ticket_${ticketId}`, 'ticket_updated', ticketData);
  }

  /**
   * Emit ticket created event
   * @param {object} ticketData - Ticket data
   */
  async ticketCreated(ticketData) {
    await this.broadcastToRoom('role_admin', 'ticket_created', ticketData);
    await this.broadcastToRoom('role_supervisor', 'ticket_created', ticketData);
  }

  /**
   * Emit ticket assigned event
   * @param {number} technicianId - Technician ID
   * @param {object} ticketData - Ticket data
   */
  async ticketAssigned(technicianId, ticketData) {
    await this.notifyUser(technicianId, {
      type: 'ticket_assigned',
      title: 'New Ticket Assigned',
      message: `You have been assigned to ticket #${ticketData.ticket_number}`,
      data: ticketData
    });
  }

  /**
   * Emit technician status change event
   * @param {object} technicianData - Technician status data
   */
  async technicianStatusChanged(technicianData) {
    await this.broadcastToRoom('role_admin', 'technician_status_changed', technicianData);
    await this.broadcastToRoom('role_supervisor', 'technician_status_changed', technicianData);
  }

  /**
   * Emit new registration event
   * @param {object} registrationData - Registration data
   */
  async newRegistration(registrationData) {
    await this.broadcastToRoom('role_admin', 'new_registration', registrationData);
    await this.broadcastToRoom('role_supervisor', 'new_registration', registrationData);
  }

  /**
   * Emit invoice created event
   * @param {object} invoiceData - Invoice data
   */
  async invoiceCreated(invoiceData) {
    await this.broadcastToRoom('role_admin', 'invoice_created', invoiceData);
    await this.broadcastToRoom('role_finance', 'invoice_created', invoiceData);
  }

  /**
   * Emit invoice updated event
   * @param {object} invoiceData - Invoice data
   */
  async invoiceUpdated(invoiceData) {
    await this.broadcastToRoom('role_admin', 'invoice_updated', invoiceData);
    await this.broadcastToRoom('role_finance', 'invoice_updated', invoiceData);
    
    // Notify customer
    if (invoiceData.customer_id) {
      await this.notifyUser(invoiceData.customer_id, {
        type: 'invoice_updated',
        title: 'Invoice Updated',
        message: `Invoice #${invoiceData.invoice_number} has been updated`,
        data: invoiceData
      });
    }
  }

  /**
   * Emit payment received event
   * @param {object} paymentData - Payment data
   */
  async paymentReceived(paymentData) {
    await this.broadcastToRoom('role_admin', 'payment_received', paymentData);
    await this.broadcastToRoom('role_finance', 'payment_received', paymentData);
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('📴 Socket Broadcaster disconnected');
    }
  }
}

// Create singleton instance
const socketBroadcaster = new SocketBroadcaster();

// Auto-connect when module is loaded
socketBroadcaster.connect().catch(err => {
  console.error('❌ Failed to connect Socket Broadcaster:', err);
});

module.exports = socketBroadcaster;

