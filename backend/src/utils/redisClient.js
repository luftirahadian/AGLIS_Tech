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
    if (this.isConnected && this.client?.isReady) {
      return this.client;
    }

    try {
      // Redis v4+ syntax
      const redisUrl = `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}/${process.env.REDIS_DB || '1'}`;
      
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis max reconnection attempts reached');
              return new Error('Max retries reached');
            }
            // Exponential backoff: 100ms, 200ms, 400ms, ... max 3s
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connected for OTP storage (DB 1)');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready for OTP operations');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      console.log(`🔌 Redis OTP Client connected to ${process.env.REDIS_HOST}:${process.env.REDIS_PORT} DB ${process.env.REDIS_DB || '1'}`);
      return this.client;

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      this.isConnected = false;
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

