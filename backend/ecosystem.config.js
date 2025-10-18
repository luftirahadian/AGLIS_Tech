require('dotenv').config();

module.exports = {
  apps: [
    // ═══════════════════════════════════════════════════════════════
    // 📡 SOCKET.IO SERVER (Dedicated - Single Instance)
    // Purpose: Real-time notifications & WebSocket connections
    // Port: 3002
    // Mode: Fork (single instance for session persistence)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'aglis-socketio',
      script: './src/socketio-server.js',
      instances: 1, // MUST be 1 for Socket.IO session persistence
      exec_mode: 'fork', // Fork mode for single instance
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        SOCKET_IO_PORT: 3002, // Dedicated port for Socket.IO
        
        // Redis
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_DB: process.env.REDIS_DB || 0,
        
        // CORS
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        FRONTEND_URL: process.env.FRONTEND_URL
      },
      error_file: './logs/socketio-error.log',
      out_file: './logs/socketio-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // 🚀 API SERVER (Multi-instance for high performance)
    // Purpose: REST API endpoints, database operations, business logic
    // Port: 3001
    // Mode: Cluster (8 instances for load balancing)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'aglis-backend',
      script: './src/server.js',
      instances: 8, // 8 instances for high throughput
      exec_mode: 'cluster', // Cluster mode for load balancing
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
        
        // Database
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        
        // JWT
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        
        // WhatsApp
        WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED,
        WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
        WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
        WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
        
        // Redis
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_DB: process.env.REDIS_DB || 0,
        
        // CORS
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        FRONTEND_URL: process.env.FRONTEND_URL,
        
        // Other configs
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_FROM: process.env.SMTP_FROM
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // 📱 WHATSAPP QUEUE WORKER (Background Job Processor)
    // Purpose: Process WhatsApp messages from queue with retry
    // Mode: Fork (single instance to avoid duplicate processing)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'aglis-queue-worker',
      script: './src/workers/whatsappWorker.js',
      instances: 1, // Single instance to avoid duplicate processing
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        
        // Database
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || 5432,
        DB_NAME: process.env.DB_NAME || 'aglis_db',
        DB_USER: process.env.DB_USER || 'postgres',
        DB_PASSWORD: process.env.DB_PASSWORD,
        
        // Redis (for queue)
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_DB: process.env.REDIS_DB || 0,
        
        // WhatsApp
        WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'fonnte',
        WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
        WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
        WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED || 'true',
        WHATSAPP_USE_QUEUE: process.env.WHATSAPP_USE_QUEUE || 'false', // Default disabled
        
        // Backup provider (failover)
        WHATSAPP_ENABLE_FAILOVER: process.env.WHATSAPP_ENABLE_FAILOVER,
        WHATSAPP_BACKUP_PROVIDER: process.env.WHATSAPP_BACKUP_PROVIDER,
        WHATSAPP_BACKUP_API_TOKEN: process.env.WHATSAPP_BACKUP_API_TOKEN,
        WHATSAPP_BACKUP_API_URL: process.env.WHATSAPP_BACKUP_API_URL
      },
      error_file: './logs/queue-worker-error.log',
      out_file: './logs/queue-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
};
