require('dotenv').config();

module.exports = {
  apps: [{
    name: 'aglis-backend',
    script: './src/server.js',
    instances: 4,
    exec_mode: 'cluster', // Fixed: Use cluster mode for multiple instances
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
      
      // WhatsApp - CRITICAL!
      WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED,
      WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
      WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
      WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
      
      // Redis
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_DB: process.env.REDIS_DB,
      USE_REDIS_FOR_OTP: process.env.USE_REDIS_FOR_OTP,
      
      // Frontend
      FRONTEND_URL: process.env.FRONTEND_URL,
      
      // Email
      EMAIL_ENABLED: process.env.EMAIL_ENABLED,
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
      EMAIL_FROM: process.env.EMAIL_FROM,
      
      // Other
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

