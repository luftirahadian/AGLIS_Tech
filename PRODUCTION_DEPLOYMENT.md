# 🚀 Production Deployment Guide

Panduan lengkap untuk deploy ISP Technician Management System ke server production.

---

## 📋 **Persiapan Sebelum Deploy**

### **1. Server Requirements**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 10GB
- **Node.js**: v18+ 
- **PostgreSQL**: v13+
- **Nginx/Apache**: Untuk reverse proxy
- **Domain**: Domain name dengan SSL certificate

### **2. Domain & SSL Setup**
```bash
# Contoh domain setup
yourdomain.com          # Frontend
api.yourdomain.com      # Backend API (opsional)
```

---

## 🔧 **Konfigurasi Environment**

### **Option 1: Menggunakan Setup Script (Recommended)**

```bash
# Clone repository
git clone <your-repo-url> isp-management
cd isp-management

# Jalankan setup script
./scripts/setup-network.sh

# Pilih "production" ketika diminta
# Masukkan domain Anda (contoh: yourdomain.com)
# Pilih HTTPS (recommended)
```

### **Option 2: Manual Configuration**

#### **Backend (.env)**
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database (ubah password!)
DB_USER=isp_admin
DB_HOST=localhost
DB_NAME=isp_management
DB_PASSWORD=SUPER_SECURE_PASSWORD_HERE
DB_PORT=5432

# JWT (ubah secret!)
JWT_SECRET=SUPER_SECURE_JWT_SECRET_HERE
JWT_EXPIRES_IN=7d

# CORS - Production domains
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting (lebih ketat untuk production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

#### **Frontend (.env.production)**
```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=ISP Technician Management System
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

---

## 🗄️ **Database Setup**

### **1. Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

### **2. Create Database & User**
```bash
sudo -u postgres psql

-- Di dalam PostgreSQL prompt:
CREATE DATABASE isp_management;
CREATE USER isp_admin WITH PASSWORD 'SUPER_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE isp_management TO isp_admin;
\q
```

### **3. Import Database Schema**
```bash
cd /path/to/isp-management/backend
npm install
npm run migrate  # atau jalankan SQL files manual
```

---

## 🔄 **Deploy Backend**

### **1. Install Dependencies**
```bash
cd /path/to/isp-management/backend
npm install --production
```

### **2. Setup Process Manager (PM2)**
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'isp-backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🎨 **Deploy Frontend**

### **1. Build Production**
```bash
cd /path/to/isp-management/frontend
npm install
npm run build
```

### **2. Setup Static File Server**

#### **Option A: Nginx (Recommended)**
```bash
# Install Nginx
sudo apt install nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/isp-management

# Configuration content:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Frontend (React App)
    location / {
        root /path/to/isp-management/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
    
    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO Proxy
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads/ {
        alias /path/to/isp-management/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/isp-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **Option B: Apache**
```bash
# Install Apache
sudo apt install apache2

# Enable required modules
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite

# Create virtual host
sudo nano /etc/apache2/sites-available/isp-management.conf

# Configuration content:
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Frontend
    DocumentRoot /path/to/isp-management/frontend/dist
    <Directory /path/to/isp-management/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Handle React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Backend API Proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/
    
    # Socket.IO Proxy
    ProxyPass /socket.io/ ws://localhost:3001/socket.io/
    ProxyPassReverse /socket.io/ ws://localhost:3001/socket.io/
    
    # File uploads
    Alias /uploads /path/to/isp-management/backend/uploads
    <Directory /path/to/isp-management/backend/uploads>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>

# Enable site
sudo a2ensite isp-management
sudo systemctl restart apache2
```

---

## 🔒 **SSL Certificate Setup**

### **Option 1: Let's Encrypt (Free)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Option 2: Commercial SSL**
Upload your certificate files to server and configure in web server.

---

## 🔧 **Firewall Configuration**

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 📊 **Monitoring & Logs**

### **1. PM2 Monitoring**
```bash
# View logs
pm2 logs isp-backend

# Monitor
pm2 monit

# Restart if needed
pm2 restart isp-backend
```

### **2. Web Server Logs**
```bash
# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Apache
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log
```

---

## 🚀 **Deployment Checklist**

- [ ] Server requirements met
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] Database created and configured
- [ ] Backend environment variables set
- [ ] Frontend built for production
- [ ] Process manager (PM2) configured
- [ ] Web server (Nginx/Apache) configured
- [ ] Firewall rules applied
- [ ] Monitoring setup
- [ ] Backup strategy implemented

---

## 🔄 **Update Deployment**

### **Backend Update**
```bash
cd /path/to/isp-management
git pull origin main
cd backend
npm install --production
pm2 restart isp-backend
```

### **Frontend Update**
```bash
cd /path/to/isp-management/frontend
git pull origin main
npm install
npm run build
# Files automatically served by web server
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **1. CORS Errors**
- Check `CORS_ORIGIN` in backend `.env`
- Verify domain matches exactly

#### **2. SSL Issues**
- Check certificate validity
- Verify web server SSL configuration

#### **3. Database Connection**
- Verify database credentials
- Check PostgreSQL is running
- Confirm database exists

#### **4. File Upload Issues**
- Check upload directory permissions
- Verify `UPLOAD_DIR` path in backend `.env`

#### **5. Socket.IO Connection**
- Check web server proxy configuration
- Verify backend is running on correct port

---

## 📞 **Support**

Jika ada masalah dengan deployment, cek:
1. Server logs (`pm2 logs`, web server logs)
2. Browser console for frontend errors
3. Network connectivity
4. SSL certificate status

---

**🎉 Selamat! Aplikasi ISP Technician Management System sudah siap di production!**
