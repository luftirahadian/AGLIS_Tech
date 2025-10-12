# 🚀 AGLIS Management System - Production Deployment Guide

## 📋 **OVERVIEW**
Complete production deployment guide for AGLIS Management System with monitoring, security, and scalability.

---

## 🖥️ **RECOMMENDED INFRASTRUCTURE**

### **Option A: Cloud VPS (Recommended)**
- **Provider**: DigitalOcean, AWS, Google Cloud
- **OS**: Ubuntu 22.04 LTS
- **Specs**: 4GB RAM, 2 CPU, 80GB SSD
- **Cost**: $20-40/month
- **Domain**: Your domain (e.g., aglis.net)

### **Option B: Dedicated Server**
- **OS**: Ubuntu 22.04 LTS Server
- **Specs**: 8GB RAM, 4 CPU, 100GB SSD
- **Benefits**: Full control, cost-effective

---

## 🔧 **STEP 1: SERVER PREPARATION**

### **1.1 Initial Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Create application user
sudo adduser aglis
sudo usermod -aG sudo aglis
sudo su - aglis
```

### **1.2 Install Node.js & PM2**
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### **1.3 Configure PostgreSQL**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE aglis_production;
CREATE USER aglis_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE aglis_production TO aglis_user;
\q
```

---

## 📁 **STEP 2: APPLICATION DEPLOYMENT**

### **2.1 Clone & Setup Application**
```bash
# Clone repository
git clone https://github.com/your-repo/AGLIS_Tech.git
cd AGLIS_Tech

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies
cd ../frontend
npm install --production

# Build frontend
npm run build
```

### **2.2 Environment Configuration**
```bash
# Backend environment
cd backend
cp config.env.example config.env

# Edit config.env
nano config.env
```

**Backend config.env:**
```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aglis_production
DB_USER=aglis_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secure_jwt_secret_key_here
UPLOAD_PATH=./uploads
CORS_ORIGIN=https://yourdomain.com
```

### **2.3 Database Migration**
```bash
cd backend
# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

---

## 🌐 **STEP 3: NGINX CONFIGURATION**

### **3.1 Create Nginx Configuration**
```bash
sudo nano /etc/nginx/sites-available/aglis
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /home/aglis/AGLIS_Tech/frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (uploads)
    location /uploads {
        alias /home/aglis/AGLIS_Tech/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### **3.2 Enable Site**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aglis /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 **STEP 4: SSL CERTIFICATE (Let's Encrypt)**

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## ⚙️ **STEP 5: PM2 PROCESS MANAGEMENT**

### **5.1 Create PM2 Ecosystem File**
```bash
cd /home/aglis/AGLIS_Tech
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'aglis-backend',
    script: './backend/src/server.js',
    cwd: '/home/aglis/AGLIS_Tech',
    instances: 2, // Cluster mode
    exec_mode: 'cluster',
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

### **5.2 Start Application**
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

---

## 📊 **STEP 6: MONITORING & LOGGING**

### **6.1 Install Monitoring Tools**
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# Install log rotation
pm2 install pm2-logrotate
```

### **6.2 System Monitoring**
```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install iotop for disk monitoring
sudo apt install -y iotop

# Install netstat for network monitoring
sudo apt install -y net-tools
```

---

## 🔧 **STEP 7: FIREWALL & SECURITY**

### **7.1 Configure UFW Firewall**
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Allow PostgreSQL (if needed externally)
sudo ufw allow 5432

# Check status
sudo ufw status
```

### **7.2 Security Hardening**
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Restart SSH
sudo systemctl restart ssh

# Setup fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📈 **STEP 8: BACKUP STRATEGY**

### **8.1 Database Backup**
```bash
# Create backup script
nano /home/aglis/backup_db.sh
```

**backup_db.sh:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/aglis/backups"
DB_NAME="aglis_production"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U aglis_user $DB_NAME > $BACKUP_DIR/aglis_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/aglis_db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: aglis_db_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /home/aglis/backup_db.sh

# Setup cron job (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/aglis/backup_db.sh
```

---

## 🚀 **STEP 9: DEPLOYMENT SCRIPT**

### **9.1 Create Deployment Script**
```bash
nano /home/aglis/deploy.sh
```

**deploy.sh:**
```bash
#!/bin/bash
set -e

echo "🚀 Starting AGLIS Production Deployment..."

# Navigate to app directory
cd /home/aglis/AGLIS_Tech

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci --production

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
cd ../backend
npm run migrate

# Restart PM2 processes
echo "🔄 Restarting application..."
pm2 restart ecosystem.config.js

# Show PM2 status
pm2 status

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: https://yourdomain.com"
```

```bash
# Make executable
chmod +x /home/aglis/deploy.sh
```

---

## 📊 **MONITORING COMMANDS**

### **Application Monitoring:**
```bash
# PM2 status
pm2 status

# PM2 logs
pm2 logs

# PM2 monitoring
pm2 monit

# System resources
htop

# Disk usage
df -h

# Database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### **Nginx Monitoring:**
```bash
# Nginx status
sudo systemctl status nginx

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**

**1. Application won't start:**
```bash
pm2 logs aglis-backend
pm2 restart aglis-backend
```

**2. Database connection issues:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

**3. Nginx issues:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**4. SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Server setup complete
- [ ] Node.js & PM2 installed
- [ ] PostgreSQL configured
- [ ] Application deployed
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] PM2 process running
- [ ] Firewall configured
- [ ] Backup strategy setup
- [ ] Monitoring tools installed
- [ ] Domain pointing to server
- [ ] Application accessible via HTTPS

---

## 🌐 **FINAL URLS**

- **Application**: https://yourdomain.com
- **Admin Panel**: https://yourdomain.com/login
- **Public Registration**: https://yourdomain.com/register
- **Tracking**: https://yourdomain.com/track/[ID]

---

**🎉 AGLIS Management System is now LIVE in production!**
