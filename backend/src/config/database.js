const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'aglis_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aglis_production',
  password: process.env.DB_PASSWORD || 'aglis_secure_password_2024',
  port: process.env.DB_PORT || 5432,
  max: 80, // Increased from 20 to 80 (10 connections per instance x 8 instances)
  min: 8,  // Minimum 8 connections (1 per instance)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased from 2s to 5s
  allowExitOnIdle: false, // Keep pool alive
  statement_timeout: 60000, // 60 second query timeout
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
