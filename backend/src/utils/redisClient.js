/**
 * Redis Client for OTP Storage
 * Shared storage across all PM2 instances
 */

const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '1'), // Use DB 1 for OTP (DB 0 for Socket.IO)
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('❌ Redis connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connected for OTP storage');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await this.client.get(key);
  }

  async set(key, value, expirySeconds) {
    if (!this.isConnected) {
      await this.connect();
    }
    if (expirySeconds) {
      return await this.client.setEx(key, expirySeconds, value);
    }
    return await this.client.set(key, value);
  }

  async del(key) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await this.client.del(key);
  }

  async exists(key) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await this.client.exists(key);
  }

  async keys(pattern) {
    if (!this.isConnected) {
      await this.connect();
    }
    return await this.client.keys(pattern);
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
module.exports = new RedisClient();

