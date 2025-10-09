const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const technicianRoutes = require('./routes/technicians');
const ticketRoutes = require('./routes/tickets');
const inventoryRoutes = require('./routes/inventory');
const packageRoutes = require('./routes/packages');
const equipmentRoutes = require('./routes/equipment');
const odpRoutes = require('./routes/odp');
const serviceTypesRoutes = require('./routes/serviceTypes');
const serviceCategoriesRoutes = require('./routes/serviceCategories');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const registrationRoutes = require('./routes/registrations');
const registrationAnalyticsRoutes = require('./routes/registrationAnalytics');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const server = createServer(app);
// Configure CORS origins - flexible for development and production
const getCorsOrigins = () => {
  // Production: Use explicit CORS_ORIGIN if provided
  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim() !== '') {
    console.log(`🔧 CORS: Using production origins from CORS_ORIGIN`);
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }
  
  // Development: Auto-detect local network access
  console.log(`🔧 CORS: Using development mode - auto-detect local network`);
  return [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // Allow any local network IP patterns
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/
  ];
};

const allowedOrigins = getCorsOrigins();

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
  // Add namespace configuration
  path: '/socket.io/'
});

// Rate limiting - Very permissive for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute window (shorter)
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // 10,000 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for localhost AND local network IPs in development
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
      return true;
    }
    
    // Local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (ip.startsWith('192.168.') || 
        ip.startsWith('10.') || 
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
      console.log(`⚡ Rate limit skipped for local IP: ${ip}`);
      return true;
    }
    
    return false;
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS: Allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Blocked origin: ${origin}`);
      console.warn(`📋 CORS: Allowed origins:`, allowedOrigins);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/technicians', authMiddleware, technicianRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
// Packages API - allow public read access for registration form
app.use('/api/packages', (req, res, next) => {
  // Allow GET requests without auth (for public registration)
  if (req.method === 'GET') {
    return next();
  }
  // Other methods require auth
  return authMiddleware(req, res, next);
}, packageRoutes);
app.use('/api/equipment', authMiddleware, equipmentRoutes);
app.use('/api/odp', authMiddleware, odpRoutes);
app.use('/api/service-types', authMiddleware, serviceTypesRoutes);
app.use('/api/service-categories', authMiddleware, serviceCategoriesRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/registrations', registrationRoutes); // Public routes included, auth handled per route
app.use('/api/registration-analytics', authMiddleware, registrationAnalyticsRoutes);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  // User authentication and room joining
  socket.on('authenticate', (data) => {
    const { userId, role } = data;
    socket.userId = userId;
    socket.role = role;
    
    // Join role-based rooms
    socket.join(`role_${role}`);
    socket.join(`user_${userId}`);
    
    console.log(`👤 User ${userId} (${role}) authenticated: ${socket.id}`);
    
    // Send welcome notification
    socket.emit('notification', {
      type: 'system',
      title: 'Connected',
      message: 'Real-time notifications active',
      timestamp: new Date().toISOString()
    });
  });
  
  // Join specific rooms (tickets, technicians, etc.)
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`👤 User ${socket.id} joined room: ${room}`);
  });
  
  // Leave specific rooms
  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`👤 User ${socket.id} left room: ${room}`);
  });
  
  // Handle ticket updates
  socket.on('ticket_update', (data) => {
    const { ticketId, status, assignedTo } = data;
    
    // Broadcast to relevant users
    io.to(`ticket_${ticketId}`).emit('ticket_updated', {
      ticketId,
      status,
      assignedTo,
      updatedBy: socket.userId,
      timestamp: new Date().toISOString()
    });
    
    // Notify assigned technician
    if (assignedTo) {
      io.to(`user_${assignedTo}`).emit('notification', {
        type: 'ticket_assigned',
        title: 'New Ticket Assignment',
        message: `You have been assigned to ticket #${ticketId}`,
        ticketId,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle technician status updates
  socket.on('technician_status_update', (data) => {
    const { technicianId, status } = data;
    
    // Broadcast to supervisors and admins
    io.to('role_admin').to('role_supervisor').emit('technician_status_changed', {
      technicianId,
      status,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle system alerts
  socket.on('system_alert', (data) => {
    const { message, type, targetRole } = data;
    
    // Broadcast to specific role or all users
    const target = targetRole ? `role_${targetRole}` : io;
    target.emit('notification', {
      type: 'system_alert',
      title: 'System Alert',
      message,
      priority: type,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.121.30:${PORT}`);
  console.log(`📝 CORS origins configured for local network access`);
});

module.exports = { app, io };
