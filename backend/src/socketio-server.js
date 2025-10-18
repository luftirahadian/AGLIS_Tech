// ╔═══════════════════════════════════════════════════════════════╗
// ║  AGLIS TECH - Dedicated Socket.IO Server                     ║
// ║  Port: 3002 (Isolated from API Server)                       ║
// ║  Purpose: Real-time notifications & events                   ║
// ║  Created: 2025-10-18                                          ║
// ╚═══════════════════════════════════════════════════════════════╝

// Load environment variables FIRST
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createServer } = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

// Configuration
const SOCKET_PORT = process.env.SOCKET_IO_PORT || 3002;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

console.log('🚀 Starting Dedicated Socket.IO Server...');
console.log('📋 Configuration:');
console.log(`  Port: ${SOCKET_PORT}`);
console.log(`  Redis: ${REDIS_HOST}:${REDIS_PORT}`);

// Create minimal HTTP server (only for Socket.IO)
const server = createServer();

// Create Redis clients for Socket.IO adapter
const pubClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
  password: REDIS_PASSWORD
});

const subClient = pubClient.duplicate();

// Connect Redis clients
Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    console.log('✅ Redis clients connected for Socket.IO adapter');
  })
  .catch((err) => {
    console.error('❌ Redis connection failed:', err);
    process.exit(1);
  });

// Error handling for Redis
pubClient.on('error', (err) => console.error('❌ Redis Pub Client Error:', err));
subClient.on('error', (err) => console.error('❌ Redis Sub Client Error:', err));

// Configure CORS origins
const getCorsOrigins = () => {
  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim() !== '') {
    console.log(`🔧 CORS: Using production origins from CORS_ORIGIN`);
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  console.log(`🔧 CORS: Using development mode - auto-detect local network`);
  return [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/
  ];
};

const allowedOrigins = getCorsOrigins();

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
      
      if (isAllowed) {
        console.log(`✅ Socket.IO: Allowed origin: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`🚫 Socket.IO: Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    transports: ['polling', 'websocket']
  },
  path: '/socket.io/',
  // Connection stability settings
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  connectTimeout: 45000, // 45 seconds
  // Use Redis adapter for broadcasting across instances (if needed in future)
  adapter: createAdapter(pubClient, subClient)
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`🔗 New connection: ${socket.id}`);

  // Handle user authentication
  socket.on('authenticate', (userData) => {
    try {
      const { userId, role, username } = userData;
      
      if (!userId || !role) {
        console.warn(`⚠️ Invalid authentication data from ${socket.id}`);
        return;
      }

      // Store user info
      socket.userId = userId;
      socket.userRole = role;
      socket.username = username;

      // Add to connected users map
      connectedUsers.set(socket.id, {
        userId,
        role,
        username,
        connectedAt: new Date()
      });

      // Join role-based room
      const roleRoom = `role_${role}`;
      socket.join(roleRoom);

      // Join user-specific room
      const userRoom = `user_${userId}`;
      socket.join(userRoom);

      console.log(`🔐 User authenticated: ${username} (${role})`);
      console.log(`🏠 Joined rooms: ${roleRoom}, ${userRoom}`);

      // Get all rooms this socket is in
      const rooms = Array.from(socket.rooms);
      
      // Send confirmation back to client
      socket.emit('authenticated', {
        userId,
        role,
        username,
        rooms,
        message: 'Authentication successful'
      });

      // Broadcast to role room about new connection
      socket.to(roleRoom).emit('user_connected', {
        userId,
        username,
        role,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
    }
  });

  // Handle joining specific rooms
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`🏠 Socket ${socket.id} joined room: ${room}`);
  });

  // Handle leaving specific rooms
  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`🚪 Socket ${socket.id} left room: ${room}`);
  });

  // Handle ticket updates from clients (if needed)
  socket.on('ticket_update', (data) => {
    console.log(`📝 Ticket update from ${socket.id}:`, data);
    // Broadcast to all admin users
    io.to('role_admin').emit('ticket_updated', data);
  });

  // Handle technician status updates
  socket.on('technician_status_update', (data) => {
    console.log(`👷 Technician status update from ${socket.id}:`, data);
    // Broadcast to all admin users
    io.to('role_admin').emit('technician_status_changed', data);
  });

  // Handle system alerts
  socket.on('system_alert', (data) => {
    console.log(`⚠️ System alert from ${socket.id}:`, data);
    // Broadcast to all users
    io.emit('system_alert', data);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    
    // Remove from connected users
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      console.log(`👋 User ${userData.username} disconnected`);
      connectedUsers.delete(socket.id);
      
      // Notify others in the same role
      if (socket.userRole) {
        socket.to(`role_${socket.userRole}`).emit('user_disconnected', {
          userId: userData.userId,
          username: userData.username,
          role: userData.role,
          timestamp: new Date()
        });
      }
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error from ${socket.id}:`, error);
  });
});

// Server-side broadcasting functions (can be called from API server via Redis)
// These will be triggered by the API server through Redis pub/sub
pubClient.subscribe('broadcast', (message) => {
  try {
    const data = JSON.parse(message);
    const { event, payload, room } = data;
    
    console.log(`📡 Broadcasting ${event} to ${room || 'all'}`);
    
    if (room) {
      io.to(room).emit(event, payload);
    } else {
      io.emit(event, payload);
    }
  } catch (error) {
    console.error('❌ Broadcast error:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, closing Socket.IO server...');
  io.close(() => {
    console.log('✅ Socket.IO server closed');
    pubClient.quit();
    subClient.quit();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, closing Socket.IO server...');
  io.close(() => {
    console.log('✅ Socket.IO server closed');
    pubClient.quit();
    subClient.quit();
    process.exit(0);
  });
});

// Start server
server.listen(SOCKET_PORT, '0.0.0.0', () => {
  console.log(`✅ Socket.IO Server running on port ${SOCKET_PORT}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${SOCKET_PORT}/socket.io/`);
  console.log(`📊 Connected users: ${connectedUsers.size}`);
});

// Export io instance for use in other modules if needed
module.exports = io;

