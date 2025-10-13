# HAProxy Installation Requirements

## 📋 DAFTAR LENGKAP YANG DIBUTUHKAN

### 1. SOFTWARE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Sudah Ada (dari Redis implementation):
- [x] Redis Server (✓ Installed v6.0.16)
- [x] Redis adapter packages (✓ Installed)
- [x] Backend code dengan Redis adapter (✓ Updated)
- [x] 4 instances cluster mode (✓ Configured)
- [x] Node.js v18+ (✓ Installed)
- [x] PM2 (✓ Installed)

❌ Perlu Diinstall BARU:
- [ ] HAProxy (Load balancer & reverse proxy)
- [ ] SSL/TLS certificates handler
- [ ] Certbot untuk HAProxy (optional)

### 2. PORTS YANG DIBUTUHKAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTERNAL (Localhost):
- Backend instances: 3001 (existing)
- Redis: 6379 (already open)
- HAProxy stats: 8404 (new, admin only)

EXTERNAL (Public):
- HTTP: Port 80 → HAProxy → redirect to 443
- HTTPS: Port 443 → HAProxy → route to Nginx OR backend
- No additional firewall changes needed

⚠️  PERUBAHAN:
- Nginx akan direlokasi dari port 443 → port 8080 (internal only)
- HAProxy akan ambil alih port 443 (frontend SSL termination)

### 3. ARCHITECTURE CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT (Nginx only):
```
Internet → Nginx:443 → Backend:3001 (1 instance)
                            ↓
                         Database
```

DENGAN HAPROXY:
```
Internet → HAProxy:443 → [Sticky Sessions]
                ├─→ Nginx:8080 (static files)
                │
                └─→ Backend Cluster
                    ├─ Instance 1:3001 ─┐
                    ├─ Instance 2:3001 ─┼─→ Redis:6379 ←─→ Pub/Sub
                    ├─ Instance 3:3001 ─┤
                    └─ Instance 4:3001 ─┘
                            ↓
                        Database
```

### 4. CONFIGURATION FILES YANG PERLU DIUBAH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILES TO MODIFY:
- [ ] /etc/haproxy/haproxy.cfg (create new)
- [ ] /etc/nginx/sites-available/aglis (modify ports)
- [ ] ecosystem.config.js (already done ✓)
- [ ] backend/config.env (already done ✓)

FILES TO BACKUP:
- [ ] /etc/nginx/sites-available/aglis
- [ ] /etc/haproxy/haproxy.cfg (if exists)
- [ ] Current SSL certificates location

### 5. SSL/TLS CERTIFICATES HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT LOCATION:
- /etc/letsencrypt/live/portal.aglis.biz.id/fullchain.pem
- /etc/letsencrypt/live/portal.aglis.biz.id/privkey.pem

PERUBAHAN DIBUTUHKAN:
1. Combine cert + key untuk HAProxy format
2. Setup auto-renewal dengan HAProxy restart hook
3. Update Certbot renewal hooks

COMMANDS:
```bash
# Combine certificates for HAProxy
sudo cat /etc/letsencrypt/live/portal.aglis.biz.id/fullchain.pem \
        /etc/letsencrypt/live/portal.aglis.biz.id/privkey.pem \
        > /etc/haproxy/certs/portal.aglis.biz.id.pem

# Set proper permissions
sudo chmod 600 /etc/haproxy/certs/portal.aglis.biz.id.pem
```

### 6. TIME REQUIREMENTS DETAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPLEMENTATION BREAKDOWN:
├─ Understand architecture       → 10 minutes
├─ Install HAProxy              → 5 minutes
├─ Configure SSL certificates   → 10 minutes
├─ Create HAProxy config        → 20 minutes
├─ Modify Nginx config          → 10 minutes
├─ Test configuration           → 10 minutes
├─ Restart services             → 5 minutes
├─ Testing & validation         → 20 minutes
├─ Troubleshooting buffer       → 20 minutes
└─ Documentation                → 10 minutes
    ────────────────────────────────────
    TOTAL:                         120 minutes (~2 hours)

DOWNTIME:
- Planned downtime: 5-10 minutes
- Best time: Off-peak hours (malam/dini hari)

### 7. TECHNICAL SKILLS NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASICS (You already have):
- [x] Linux command line
- [x] Edit config files
- [x] Systemctl management
- [x] Understanding of ports & proxies

INTERMEDIATE (Will learn):
- [ ] HAProxy configuration syntax
- [ ] Load balancing concepts
- [ ] SSL termination
- [ ] Backend health checks

ADVANCED (Nice to have):
- [ ] ACL (Access Control Lists)
- [ ] Traffic shaping
- [ ] Advanced load balancing algorithms

ASSESSMENT: ✅ You can learn HAProxy config with guidance

### 8. MONITORING & DEBUGGING TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HAProxy PROVIDES:
- Built-in stats dashboard (http://portal.aglis.biz.id:8404/stats)
- Real-time connection monitoring
- Backend health status
- Request distribution visualization
- Error tracking

MONITORING TOOLS:
- [ ] HAProxy stats page (web UI)
- [ ] HAProxy logs (/var/log/haproxy.log)
- [ ] Socket status monitoring
- [x] PM2 monitoring (already have)
- [x] Redis monitoring (already have)

### 9. DEPENDENCIES & PACKAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APT PACKAGES TO INSTALL:
```bash
sudo apt update
sudo apt install haproxy -y         # Main package (~5MB)
sudo apt install socat -y           # For stats socket (~200KB)
```

NO ADDITIONAL NPM PACKAGES NEEDED (Redis adapter already installed)

TOTAL DOWNLOAD SIZE: ~6MB
DISK SPACE NEEDED: ~20MB

### 10. HAPROXY CONFIGURATION EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: /etc/haproxy/haproxy.cfg

```haproxy
global
    log /dev/log local0
    log /dev/log local1 notice
    maxconn 4096
    user haproxy
    group haproxy
    daemon
    # SSL/TLS configuration
    tune.ssl.default-dh-param 2048

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000
    timeout client  50000
    timeout server  50000
    timeout tunnel  3600s  # For WebSocket

# Stats page
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if TRUE

# Frontend - SSL termination
frontend https_front
    bind *:443 ssl crt /etc/haproxy/certs/portal.aglis.biz.id.pem
    bind *:80
    
    # Redirect HTTP to HTTPS
    redirect scheme https code 301 if !{ ssl_fc }
    
    # ACL untuk routing
    acl is_api path_beg /api
    acl is_socket path_beg /socket.io/
    acl is_uploads path_beg /uploads
    
    # Routing decisions
    use_backend socket_backend if is_socket
    use_backend api_backend if is_api
    use_backend uploads_backend if is_uploads
    default_backend nginx_backend

# Backend - Socket.IO dengan sticky sessions
backend socket_backend
    balance source  # Sticky by source IP
    option http-server-close
    option forwardfor
    
    # Sticky sessions by cookie (alternative)
    cookie SERVERID insert indirect nocache
    
    # Backend servers
    server node1 localhost:3001 check cookie node1
    server node2 localhost:3001 check cookie node2
    server node3 localhost:3001 check cookie node3
    server node4 localhost:3001 check cookie node4

# Backend - API requests
backend api_backend
    balance roundrobin
    option http-server-close
    option forwardfor
    
    server node1 localhost:3001 check
    server node2 localhost:3001 check
    server node3 localhost:3001 check
    server node4 localhost:3001 check

# Backend - Static files via Nginx
backend nginx_backend
    server nginx localhost:8080 check

# Backend - Uploads
backend uploads_backend
    server nginx localhost:8080 check
```

### 11. NGINX CONFIGURATION CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANGES NEEDED:
- Change listen port: 443 → 8080
- Remove SSL configuration (HAProxy handles it)
- Keep static file serving only

NEW CONFIG:
```nginx
server {
    listen 8080;
    server_name portal.aglis.biz.id localhost;

    # Frontend static files
    location / {
        root /home/aglis/AGLIS_Tech/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Uploads  
    location /uploads {
        alias /home/aglis/AGLIS_Tech/backend/uploads;
    }
}
```

### 12. TESTING CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POST-IMPLEMENTATION:
- [ ] HAProxy service running (systemctl status haproxy)
- [ ] All 4 backend instances healthy (HAProxy stats)
- [ ] SSL certificate valid (https://portal.aglis.biz.id)
- [ ] Socket.IO connection successful (no 400 errors)
- [ ] Real-time updates working
- [ ] Login & logout working
- [ ] All pages accessible
- [ ] Nginx serving static files (port 8080)
- [ ] HAProxy stats accessible (http://localhost:8404/stats)
- [ ] Load distribution working (check HAProxy stats)

LOAD TESTING:
- [ ] Multiple simultaneous connections
- [ ] Broadcast messages reach all clients
- [ ] No session loss during requests
- [ ] Performance better than fork mode

### 13. ROLLBACK PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IF HAPROXY DOESN'T WORK:

```bash
# Stop HAProxy
sudo systemctl stop haproxy
sudo systemctl disable haproxy

# Restore Nginx to port 443
sudo cp /path/to/nginx.backup /etc/nginx/sites-available/aglis
sudo nginx -t && sudo systemctl reload nginx

# Revert to fork mode
pm2 delete aglis-backend
# Edit ecosystem.config.js: instances: 1, exec_mode: 'fork'
pm2 start ecosystem.config.js

# Cleanup
sudo apt remove haproxy -y
```

ROLLBACK TIME: < 10 minutes

### 14. SYSTEM RESOURCES IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT (Fork Mode):
- CPU: ~2-5% idle
- RAM: ~120MB (1 instance)
- Connections: ~500 max

WITH HAPROXY (Cluster Mode):
- CPU: ~10-15% with 4 instances + HAProxy
- RAM: ~350MB (4 instances + HAProxy ~30MB)
- Connections: ~2000+ concurrent
- HAProxy overhead: Minimal (~1-2% CPU, 30-50MB RAM)

YOUR SYSTEM:
- Available: 8GB RAM, 8 cores
- Impact: Very minimal (< 5% resources)
- Status: ✅ More than sufficient

### 15. ADVANTAGES OF HAPROXY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VS NGINX FOR SOCKET.IO:
✅ Perfect sticky sessions (cookie-based)
✅ Better load balancing algorithms
✅ Built-in health checks
✅ Real-time stats dashboard
✅ Advanced SSL/TLS handling
✅ Zero-downtime reloads
✅ Better WebSocket support
✅ ACL-based routing (very flexible)

FEATURES YOU GET:
- 📊 Web-based monitoring dashboard
- 🔄 Automatic failover if instance crashes
- ⚖️  Intelligent load distribution
- 🏥 Health checks every 2 seconds
- 📈 Request/response time tracking
- 🔐 Better security (SSL offloading)

### 16. STEP-BY-STEP IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Backup Current Configuration (5 min)
```bash
sudo cp /etc/nginx/sites-available/aglis ~/backup-nginx-aglis
pm2 save
```

STEP 2: Install HAProxy (5 min)
```bash
sudo apt update
sudo apt install haproxy socat -y
sudo systemctl enable haproxy
```

STEP 3: Prepare SSL Certificates (5 min)
```bash
sudo mkdir -p /etc/haproxy/certs
sudo cat /etc/letsencrypt/live/portal.aglis.biz.id/fullchain.pem \
        /etc/letsencrypt/live/portal.aglis.biz.id/privkey.pem \
        > /tmp/portal.aglis.biz.id.pem
sudo mv /tmp/portal.aglis.biz.id.pem /etc/haproxy/certs/
sudo chmod 600 /etc/haproxy/certs/portal.aglis.biz.id.pem
```

STEP 4: Configure HAProxy (20 min)
```bash
# Edit /etc/haproxy/haproxy.cfg
# Copy configuration from guide
sudo nano /etc/haproxy/haproxy.cfg
```

STEP 5: Modify Nginx Configuration (10 min)
```bash
# Change Nginx to port 8080
sudo nano /etc/nginx/sites-available/aglis
# Update: listen 443 ssl; → listen 8080;
# Remove SSL lines
```

STEP 6: Test Configurations (5 min)
```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo nginx -t
```

STEP 7: Restart Services (10 min)
```bash
# Stop Nginx on port 443 first
sudo systemctl stop nginx

# Start HAProxy
sudo systemctl start haproxy
sudo systemctl status haproxy

# Start Nginx on port 8080
sudo systemctl start nginx

# Verify backend instances
pm2 list
```

STEP 8: Testing & Validation (20 min)
```bash
# Test HTTPS
curl -I https://portal.aglis.biz.id

# Test Socket.IO
# Open browser → Login → Check real-time badge

# Check HAProxy stats
curl http://localhost:8404/stats

# Monitor logs
sudo tail -f /var/log/haproxy.log
pm2 logs aglis-backend
```

### 17. TROUBLESHOOTING GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMON ISSUES:

ISSUE: Port 443 already in use
FIX: sudo systemctl stop nginx BEFORE starting HAProxy

ISSUE: SSL certificate not working
FIX: Check combined cert file permissions (must be 600)

ISSUE: Backend health check failing
FIX: Ensure all PM2 instances are running (pm2 list)

ISSUE: Socket.IO still getting 400
FIX: Clear browser cache, check HAProxy logs

ISSUE: Static files not loading
FIX: Verify Nginx on port 8080, check HAProxy routing ACLs

### 18. MONITORING AFTER DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DASHBOARD ACCESS:
- HAProxy Stats: http://localhost:8404/stats (or via SSH tunnel)
- Shows real-time traffic distribution
- Backend health status
- Connection counts
- Response times

COMMANDS:
```bash
# HAProxy status
sudo systemctl status haproxy

# View stats via CLI
echo "show stat" | socat stdio /var/lib/haproxy/stats

# Check backend health
echo "show servers state" | socat stdio /var/lib/haproxy/stats

# Live traffic monitoring
sudo tail -f /var/log/haproxy.log
```

### 19. COST & RESOURCE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOFTWARE COST:
- HAProxy: $0 (open source)
- SSL handling: $0 (use existing Let's Encrypt)
- Monitoring tools: $0 (built-in)

INFRASTRUCTURE:
- Same server: $0 (no additional)
- RAM overhead: ~30-50MB
- CPU overhead: ~1-2%
- Disk space: ~20MB

OPERATIONAL:
- Initial setup: 2 hours your time
- Maintenance: Minimal (auto-managed)
- Monitoring: Built-in dashboard

TOTAL COST: $0

### 20. BENEFITS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT YOU GET:
✅ 4x performance (4 instances vs 1)
✅ Perfect Socket.IO sticky sessions
✅ Zero-downtime deployments (pm2 reload)
✅ Automatic failover (if 1 instance crashes)
✅ Real-time monitoring dashboard
✅ Better CPU utilization (all 8 cores)
✅ Higher concurrent connections (500 → 2000+)
✅ Production-grade load balancing
✅ Better reliability & uptime
✅ Scalable architecture for future growth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 BOTTOM LINE

YANG ANDA BUTUHKAN:
├─ Software: HAProxy + socat (~6MB download)
├─ Time: 2 hours implementation
├─ Skills: Linux basics (you already have)
├─ Cost: $0
├─ Risk: Low (easy rollback)
├─ Downtime: 5-10 minutes
└─ Result: Production-grade cluster with perfect Socket.IO

CURRENT STATUS:
✅ Redis: Installed & working
✅ Code: Updated & ready
✅ Instances: 4 running in cluster
❌ Missing: HAProxy for sticky sessions

READINESS: 80% complete
Missing component: Just HAProxy installation & config

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💡 RECOMMENDATION

BEST APPROACH:
1. Option A now: Revert to fork mode (5 min) - System stable
2. Schedule HAProxy install: Off-peak hours (2 hours)
3. Benefits: Perfect real-time updates in cluster mode

OR

Start HAProxy now if you have 2 hours available time.

