# Socket.IO Redis Adapter - Future Optimization Guide

## Overview
Panduan ini menjelaskan cara mengoptimalkan Socket.IO dengan Redis adapter untuk menjalankan backend dalam cluster mode dengan multiple instances.

## Mengapa Butuh Redis Adapter?

### Masalah Tanpa Redis:
- Socket.IO menyimpan connections di memory masing-masing instance
- Instance A tidak tahu tentang connections di Instance B
- Ketika broadcast message, hanya users di instance yang sama yang menerima
- Cluster mode tidak berfungsi untuk Socket.IO

### Solusi Dengan Redis:
- Redis menjadi message broker untuk semua instances
- Semua instances subscribe ke Redis pub/sub channels
- Ketika instance A broadcast message, Redis forward ke semua instances
- Users di instance manapun akan menerima message

## Architecture Diagram

```
┌──────────────────────────────────────────────────┐
│                   Nginx                           │
│            (Load Balancer)                        │
└────────────┬─────────────────────────────────────┘
             │
        ┌────┴────┐
        │         │
   ┌────▼───┐ ┌──▼─────┐ ┌────▼────┐
   │Backend │ │Backend │ │Backend  │
   │Instance│ │Instance│ │Instance │
   │   #1   │ │   #2   │ │   #3    │
   └────┬───┘ └───┬────┘ └────┬────┘
        │         │           │
        └─────────┴───────────┘
                  │
            ┌─────▼──────┐
            │   Redis    │
            │  (Pub/Sub) │
            └────────────┘
```

## Implementation Steps

### Step 1: Install Redis Server

```bash
# Install Redis
sudo apt update
sudo apt install redis-server -y

# Configure Redis untuk production
sudo nano /etc/redis/redis.conf

# Edit settings:
# supervised systemd
# bind 127.0.0.1 ::1
# requirepass your_redis_password_here

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return: PONG
```

### Step 2: Install Redis Adapter di Backend

```bash
cd /home/aglis/AGLIS_Tech/backend
npm install @socket.io/redis-adapter redis
```

### Step 3: Update Backend Server Code

File: `backend/src/server.js`

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

// ... existing code ...

const app = express();
const server = createServer(app);

// Create Redis clients for Socket.IO
const pubClient = createClient({ 
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});

const subClient = pubClient.duplicate();

// Connect Redis clients
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  console.log('✅ Redis clients connected for Socket.IO');
});

// Create Socket.IO server with Redis adapter
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // ... existing CORS logic ...
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    transports: ['polling', 'websocket']
  },
  path: '/socket.io/',
  // Use Redis adapter
  adapter: createAdapter(pubClient, subClient)
});

// Error handling for Redis
pubClient.on('error', (err) => console.error('❌ Redis Pub Client Error:', err));
subClient.on('error', (err) => console.error('❌ Redis Sub Client Error:', err));

// ... rest of Socket.IO configuration ...
```

### Step 4: Update Environment Configuration

File: `backend/config.env`

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password_here
```

### Step 5: Update PM2 Ecosystem Configuration

File: `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'aglis-backend',
    script: './backend/src/server.js',
    cwd: '/home/aglis/AGLIS_Tech',
    instances: 4,              // Back to cluster mode
    exec_mode: 'cluster',      // Cluster mode enabled
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_file: './logs/backend-combined.log',
    time: true,
    max_memory_restart: '500M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### Step 6: Update Nginx for Sticky Sessions (Optional but Recommended)

File: `/etc/nginx/sites-available/aglis`

```nginx
# Add upstream with ip_hash for sticky sessions
upstream backend_cluster {
    ip_hash;  # Sticky sessions based on client IP
    server localhost:3001;
}

server {
    server_name portal.aglis.biz.id;

    # ... existing frontend config ...

    # Backend API
    location /api {
        proxy_pass http://backend_cluster;
        # ... existing proxy headers ...
    }

    # Socket.IO with sticky sessions
    location /socket.io/ {
        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # ... rest of config ...
    }

    # ... rest of config ...
}
```

### Step 7: Deploy & Test

```bash
# Stop current backend
pm2 stop aglis-backend

# Start with new configuration
pm2 start ecosystem.config.js

# Monitor logs
pm2 logs aglis-backend --lines 100

# Check all instances are running
pm2 list

# Test Socket.IO connection
# You should see in logs: "✅ Redis clients connected for Socket.IO"
```

## Benefits After Implementation

### Performance Improvements:
1. ✅ **Better CPU Utilization**: 4 instances = use all 4 CPU cores
2. ✅ **Higher Throughput**: Can handle 4x more concurrent connections
3. ✅ **Load Distribution**: Requests distributed across instances
4. ✅ **Better Reliability**: If 1 instance crashes, others still work

### Scalability:
- Easy to add more instances: `instances: 'max'` (use all CPU cores)
- Can scale horizontally: run on multiple servers with same Redis
- No downtime deployments with `pm2 reload`

### Real-Time Features:
- ✅ Broadcast works across all instances
- ✅ Room-based messaging works correctly
- ✅ No message loss between instances

## Monitoring & Debugging

### Check Redis Status:
```bash
# Redis connection info
redis-cli info clients

# Monitor Redis commands
redis-cli monitor

# Check pub/sub channels
redis-cli pubsub channels
```

### Check Backend Performance:
```bash
# PM2 monitoring
pm2 monit

# Check instance distribution
pm2 list

# Logs per instance
pm2 logs aglis-backend --lines 50 --raw
```

## Cost Estimation

- Redis Server: Minimal resources (512MB RAM sufficient)
- No additional external services needed
- Can run on same server as backend
- Estimated additional cost: $0 (using same server)

## Rollback Plan

If issues occur, rollback is simple:

```bash
# Stop all instances
pm2 stop aglis-backend

# Revert ecosystem.config.js to fork mode
# instances: 1, exec_mode: 'fork'

# Restart
pm2 restart aglis-backend
```

## Recommended Timeline

- **Now**: Current setup (fork mode) is sufficient for < 1000 concurrent users
- **When to optimize**: 
  - When you have > 500 concurrent users
  - CPU usage consistently > 70%
  - Response time degradation during peak hours
  - Planning for major traffic increase

## Testing Checklist

After implementation, test:
- [ ] All instances show in `pm2 list`
- [ ] Redis clients connected (check logs)
- [ ] Socket.IO connection works from browser
- [ ] Real-time notifications work
- [ ] Broadcast messages reach all users
- [ ] No console errors
- [ ] Performance improved (use `pm2 monit`)

## References

- Socket.IO Redis Adapter: https://socket.io/docs/v4/redis-adapter/
- PM2 Cluster Mode: https://pm2.keymetrics.io/docs/usage/cluster-mode/
- Redis Documentation: https://redis.io/documentation

---
Generated: $(date)
