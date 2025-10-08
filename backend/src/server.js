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
const odpRoutes = require('./routes/odp');
const serviceTypesRoutes = require('./routes/serviceTypes');
const serviceCategoriesRoutes = require('./routes/serviceCategories');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Rate limiting - Very permissive for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute window (shorter)
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // 10,000 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for localhost in development
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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
app.use('/api/packages', authMiddleware, packageRoutes);
app.use('/api/odp', authMiddleware, odpRoutes);
app.use('/api/service-types', authMiddleware, serviceTypesRoutes);
app.use('/api/service-categories', authMiddleware, serviceCategoriesRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

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

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
