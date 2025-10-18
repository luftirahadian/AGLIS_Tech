import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Initialize socket connection
  connect(user) {
    if (this.socket) {
      this.disconnect();
    }

    // Extract base URL from API URL (remove /api suffix for Socket.IO)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const serverUrl = apiUrl.replace('/api', '');
    
    console.log(`🔗 Socket.IO: Connecting to ${serverUrl}`);
    
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      path: '/socket.io/'
    });

    this.setupEventListeners();
    
    // Authenticate user when connected
    this.socket.on('connect', () => {
      console.log('🔗 Socket connected:', this.socket.id);
      this.isConnected = true;
      
      if (user) {
        this.authenticate(user);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  // Authenticate user with server
  authenticate(user) {
    if (this.socket && this.isConnected) {
      const authData = {
        userId: user.id,
        role: user.role,
        username: user.username
      };
      
      console.log('🔐 Authenticating user with data:', authData);
      this.socket.emit('authenticate', authData);
      console.log('🔐 User authenticated:', user.username, 'Role:', user.role);
    } else {
      console.warn('⚠️ Cannot authenticate: socket not connected or not available');
      console.log('Socket status:', {
        socket: !!this.socket,
        isConnected: this.isConnected,
        socketId: this.socket?.id
      });
    }
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Listen for notifications
    this.socket.on('notification', (notification) => {
      console.log('🔔 New notification:', notification);
      this.emit('notification', notification);
      // Don't dispatch window event here - let NotificationContext handle it to avoid duplication
    });

    // Listen for ticket updates
    this.socket.on('ticket_updated', (data) => {
      console.log('🎫 Ticket updated:', data);
      this.emit('ticket_updated', data);
      // Dispatch custom event for components
      window.dispatchEvent(new CustomEvent('ticket-updated', { detail: data }));
    });

    // Listen for ticket created
    this.socket.on('ticket_created', (data) => {
      console.log('🎫 Ticket created:', data);
      this.emit('ticket_created', data);
      window.dispatchEvent(new CustomEvent('ticket-created', { detail: data }));
    });

    // Listen for ticket assigned
    this.socket.on('ticket_assigned', (data) => {
      console.log('🎫 Ticket assigned:', data);
      this.emit('ticket_assigned', data);
      window.dispatchEvent(new CustomEvent('ticket-assigned', { detail: data }));
    });

    // Listen for ticket completed
    this.socket.on('ticket_completed', (data) => {
      console.log('🎫 Ticket completed:', data);
      this.emit('ticket_completed', data);
      window.dispatchEvent(new CustomEvent('ticket-completed', { detail: data }));
    });

    // Listen for technician status changes
    this.socket.on('technician_status_changed', (data) => {
      console.log('👷 Technician status changed:', data);
      this.emit('technician_status_changed', data);
    });

    // Listen for system alerts
    this.socket.on('system_alert', (alert) => {
      console.log('⚠️ System alert:', alert);
      this.emit('system_alert', alert);
    });

    // Listen for authentication confirmation
    this.socket.on('authenticated', (data) => {
      console.log('✅ Authentication confirmed:', data);
      console.log('🏠 Joined rooms:', data.rooms);
    });

    // Listen for new registrations
    this.socket.on('new_registration', (data) => {
      console.log('✨ New registration received:', data);
      this.emit('new_registration', data);
      window.dispatchEvent(new CustomEvent('new-registration', { detail: data }));
    });
  }

  // Join a specific room
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', room);
      console.log(`🏠 Joined room: ${room}`);
    }
  }

  // Leave a specific room
  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', room);
      console.log(`🚪 Left room: ${room}`);
    }
  }

  // Emit ticket update
  emitTicketUpdate(ticketData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ticket_update', ticketData);
    }
  }

  // Emit technician status update
  emitTechnicianStatusUpdate(statusData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('technician_status_update', statusData);
    }
  }

  // Emit system alert
  emitSystemAlert(alertData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('system_alert', alertData);
    }
  }

  // Add event listener
  on(event, callback) {
    // Only listen on socket directly to avoid double registration
    // Don't add to this.listeners to prevent duplicate calls
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    // Only remove from socket to match on() behavior
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }

  // Reconnect socket
  reconnect(user) {
    this.disconnect();
    return this.connect(user);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
