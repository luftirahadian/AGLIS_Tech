// Load environment variables FIRST
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: Verify critical env vars are loaded
console.log('🔧 Environment Check:');
console.log('  WHATSAPP_ENABLED:', process.env.WHATSAPP_ENABLED || 'NOT SET');
console.log('  WHATSAPP_API_TOKEN:', process.env.WHATSAPP_API_TOKEN ? 'SET' : 'NOT SET');
console.log('  DB_HOST:', process.env.DB_HOST || 'NOT SET');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
// Socket.IO removed - using dedicated server on port 3002

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const permissionsRoutes = require('./routes/permissions');
const customerRoutes = require('./routes/customers');
const technicianRoutes = require('./routes/technicians');
const ticketRoutes = require('./routes/tickets');
const inventoryRoutes = require('./routes/inventory');
const inventoryStockRoutes = require('./routes/inventoryStock');
const pricelistRoutes = require('./routes/pricelist');
const packageRoutes = require('./routes/packages');
const equipmentRoutes = require('./routes/equipment');
const odpRoutes = require('./routes/odp');
const serviceTypesRoutes = require('./routes/serviceTypes');
const serviceCategoriesRoutes = require('./routes/serviceCategories');
const notificationRoutes = require('./routes/notifications');
const notificationCenterRoutes = require('./routes/notificationCenter');
const testNotificationRoutes = require('./routes/test-notifications');
const notificationTemplatesRoutes = require('./routes/notificationTemplates');
const notificationAnalyticsRoutes = require('./routes/notificationAnalytics');
const notificationSettingsRoutes = require('./routes/notificationSettings');
const analyticsRoutes = require('./routes/analytics');
const registrationRoutes = require('./routes/registrations');
const registrationAnalyticsRoutes = require('./routes/registrationAnalytics');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const skillLevelsRoutes = require('./routes/skillLevels');
const specializationsRoutes = require('./routes/specializations');
const technicianSpecializationsRoutes = require('./routes/technicianSpecializations');
const whatsappGroupsRoutes = require('./routes/whatsappGroups');
const webhooksRoutes = require('./routes/webhooks');
const bulkOperationsRoutes = require('./routes/bulkOperations');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');
const { queryStatsMiddleware } = require('./middleware/queryLogger');
const { cacheMiddleware, invalidateCache, getCacheStats } = require('./middleware/cacheMiddleware');

// Import cron jobs
const billingCron = require('./jobs/billingCron');

// Import Socket.IO broadcaster for real-time events
const socketBroadcaster = require('./utils/socketBroadcaster');

const app = express();
const server = createServer(app);

// Make socketBroadcaster available globally for routes
global.socketBroadcaster = socketBroadcaster;

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
// Socket.IO server removed - now running on dedicated server (port 3002)

// Rate limiting - Secure rate limiter
// Note: apiLimiter imported from rateLimiter middleware (100 req/15min)
// This provides better security while still allowing legitimate use

// Trust proxy (required for rate limiting behind nginx/haproxy)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(queryStatsMiddleware); // Add query performance monitoring

// Apply rate limiter to all API routes (100 requests per 15 minutes)
app.use('/api/', apiLimiter);

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

// Static files for uploads with CORS headers
app.use('/uploads', cors(), express.static(path.join(__dirname, '../../backend/uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health Check Routes (no auth required for monitoring)
app.use('/api/health', require('./routes/health'));

// Alert Management Routes
app.use('/api/alerts', authMiddleware, require('./routes/alerts'));

// Customer Portal Routes (public auth endpoints)
app.use('/api/customer-portal', require('./routes/customerPortal'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/permissions', authMiddleware, permissionsRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/technicians', authMiddleware, technicianRoutes);
app.use('/api/technicians', authMiddleware, technicianSpecializationsRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/tickets', authMiddleware, require('./routes/ticketTeam')); // Multi-technician team management
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/inventory-stock', authMiddleware, inventoryStockRoutes);
// Pricelist API - allow public read access for customer transparency
app.use('/api/pricelist', (req, res, next) => {
  // Allow GET requests without auth (for public viewing)
  if (req.method === 'GET') {
    return next();
  }
  // Other methods require auth
  return authMiddleware(req, res, next);
}, cacheMiddleware(600), pricelistRoutes); // Cache for 10 minutes
// Packages API - allow public read access for registration form
app.use('/api/packages', (req, res, next) => {
  // Allow GET requests without auth (for public registration)
  if (req.method === 'GET') {
    return next();
  }
  // Other methods require auth
  return authMiddleware(req, res, next);
}, cacheMiddleware(300), packageRoutes); // Cache for 5 minutes
app.use('/api/equipment', authMiddleware, cacheMiddleware(300), equipmentRoutes); // Cache 5 min
app.use('/api/odp', authMiddleware, cacheMiddleware(180), odpRoutes); // Cache 3 min
app.use('/api/service-types', authMiddleware, cacheMiddleware(600), serviceTypesRoutes); // Cache 10 min
app.use('/api/service-categories', authMiddleware, cacheMiddleware(600), serviceCategoriesRoutes); // Cache 10 min
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/notification-center', authMiddleware, notificationCenterRoutes);
app.use('/api/test-notifications', authMiddleware, testNotificationRoutes);
app.use('/api/notification-templates', authMiddleware, notificationTemplatesRoutes);
app.use('/api/notification-analytics', authMiddleware, notificationAnalyticsRoutes);
app.use('/api/notification-settings', authMiddleware, notificationSettingsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/registrations', registrationRoutes); // Public routes included, auth handled per route
app.use('/api/registration-analytics', authMiddleware, registrationAnalyticsRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/skill-levels', authMiddleware, cacheMiddleware(600), skillLevelsRoutes); // Cache 10 min
app.use('/api/specializations', authMiddleware, cacheMiddleware(600), specializationsRoutes); // Cache 10 min
app.use('/api/whatsapp-groups', authMiddleware, whatsappGroupsRoutes); // WhatsApp groups management
app.use('/api/whatsapp-notifications', authMiddleware, require('./routes/whatsappNotifications')); // WhatsApp notification triggers
app.use('/api/whatsapp-templates', authMiddleware, require('./routes/whatsappTemplates')); // WhatsApp template management
app.use('/api/webhooks', webhooksRoutes); // Webhooks (NO AUTH - external services)
app.use('/api/bulk', authMiddleware, bulkOperationsRoutes); // Bulk operations endpoints

// Performance monitoring endpoints (admin only)
const { getQueryStats, resetQueryStats } = require('./middleware/queryLogger');
app.get('/api/performance/query-stats', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  res.json({ success: true, data: getQueryStats() });
});
app.post('/api/performance/reset-stats', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  resetQueryStats();
  res.json({ success: true, message: 'Query stats reset' });
});

// Cache management endpoints (admin only)
app.get('/api/performance/cache-stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  const stats = await getCacheStats();
  res.json({ success: true, data: stats });
});
app.post('/api/performance/cache-clear', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  const { invalidateAllCache } = require('./middleware/cacheMiddleware');
  await invalidateAllCache();
  res.json({ success: true, message: 'Cache cleared' });
});

// Billing automation endpoints (admin only)
app.post('/api/billing/generate-monthly', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  try {
    const result = await billingCron.triggerMonthlyInvoices(req.body.dry_run || false);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/billing/check-overdue', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  try {
    const result = await billingCron.triggerOverdueCheck();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Socket.IO connection handlers removed - handled by dedicated server (port 3002)
// Real-time events are now broadcasted via global.socketBroadcaster

// Start billing cron jobs
if (process.env.ENABLE_BILLING_CRON === 'true') {
  billingCron.startAll();
} else {
  console.log('⏸️  Billing cron jobs disabled (set ENABLE_BILLING_CRON=true to enable)');
}

// 📱 PHASE 1, 2 & 3: Start WhatsApp notification jobs
console.log('⏰ Starting WhatsApp notification jobs...');
try {
  const slaMonitor = require('./jobs/slaMonitor');
  const paymentReminder = require('./jobs/paymentReminder');
  const dailySummary = require('./jobs/dailySummary');
  const weeklyPerformance = require('./jobs/weeklyPerformance');
  
  slaMonitor.start();
  paymentReminder.start();
  dailySummary.start();
  weeklyPerformance.start();
  
  console.log('✅ WhatsApp notification jobs started successfully');
  console.log('   - SLA Monitor: Every 15 minutes');
  console.log('   - Payment Reminder: Daily at 09:00 WIB');
  console.log('   - Daily Summary: Daily at 18:00 WIB');
  console.log('   - Weekly Performance: Every Monday at 08:00 WIB');
} catch (error) {
  console.error('❌ Failed to start WhatsApp notification jobs:', error);
}

// 🚨 WEEK 2: Start Alert Monitoring System
console.log('⏰ Starting Alert Monitoring System...');
try {
  const alertMonitor = require('./jobs/alertMonitor');
  alertMonitor.start();
  
  console.log('✅ Alert Monitoring System started successfully');
  console.log('   - System Health Checks: Every 5 minutes');
  console.log('   - Alert Rules: 8 default rules active');
  console.log('   - Notifications: WhatsApp + Email');
} catch (error) {
  console.error('❌ Failed to start Alert Monitoring System:', error);
}

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

module.exports = { app, server };
