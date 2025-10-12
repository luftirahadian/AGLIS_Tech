# 🚀 AGLIS Production - Quick Start Guide

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **Before You Start:**
- [ ] **Domain**: Have your domain ready (e.g., aglis.net)
- [ ] **DNS**: Point domain to your server IP
- [ ] **Server**: Ubuntu 22.04 LTS VPS/Server
- [ ] **Access**: SSH access to server
- [ ] **Backup**: Current codebase backup

---

## ⚡ **QUICK DEPLOYMENT (30 minutes)**

### **1. Server Preparation**
```bash
# Connect to your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

### **2. Run Deployment Script**
```bash
# Download and run deployment script
wget https://raw.githubusercontent.com/luftirahadian/AGLIS_Tech/main/scripts/production-deploy-fixed.sh
chmod +x production-deploy-fixed.sh
./production-deploy-fixed.sh
```

**If you get permission errors:**
```bash
# Run permission fix script first
wget https://raw.githubusercontent.com/luftirahadian/AGLIS_Tech/main/scripts/fix-permissions.sh
chmod +x fix-permissions.sh
sudo ./fix-permissions.sh

# Then continue with deployment
./production-deploy-fixed.sh
```

### **3. Configure Domain**
```bash
# Edit domain in scripts (replace yourdomain.com)
nano /home/aglis/AGLIS_Tech/backend/config.env
nano /home/aglis/AGLIS_Tech/scripts/monitoring/*.sh
```

### **4. Setup Monitoring**
```bash
# Run monitoring setup
sudo -u aglis /home/aglis/AGLIS_Tech/scripts/monitoring-setup.sh
```

---

## 🌐 **FINAL CONFIGURATION**

### **SSL Certificate**
```bash
# Get SSL certificate (replace yourdomain.com)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **Test Application**
```bash
# Check all services
sudo -u aglis pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Test URLs
curl -I https://yourdomain.com
curl -I https://yourdomain.com/api/health
```

---

## 📊 **MONITORING COMMANDS**

### **Quick Status Check**
```bash
# Application status
sudo -u aglis pm2 status

# System resources
htop

# Live dashboard
sudo -u aglis /home/aglis/AGLIS_Tech/scripts/monitoring/dashboard.sh

# Health check
sudo -u aglis /home/aglis/AGLIS_Tech/scripts/monitoring/health-check.sh
```

### **Log Monitoring**
```bash
# Application logs
sudo -u aglis pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo tail -f /var/log/syslog
```

---

## 🔧 **MAINTENANCE COMMANDS**

### **Application Updates**
```bash
# Deploy updates
sudo -u aglis /home/aglis/AGLIS_Tech/deploy.sh

# Restart application
sudo -u aglis pm2 restart aglis-backend

# Restart all services
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

### **Database Operations**
```bash
# Backup database
sudo -u aglis /home/aglis/backup_db.sh

# Restore database
sudo -u postgres psql aglis_production < backup_file.sql

# Database maintenance
sudo -u postgres psql aglis_production -c "VACUUM ANALYZE;"
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

**Permission Denied Errors:**
```bash
# Fix ownership and permissions
sudo chown -R aglis:aglis /home/aglis/AGLIS_Tech
sudo chmod -R 755 /home/aglis/AGLIS_Tech

# Or use the permission fix script
sudo ./fix-permissions.sh
```

**Application won't start:**
```bash
sudo -u aglis pm2 logs aglis-backend
sudo -u aglis pm2 restart aglis-backend
```

**Database connection issues:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

**Nginx issues:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **Server Optimization**
```bash
# Increase file limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: shared_buffers = 256MB
# Set: effective_cache_size = 1GB
```

### **Nginx Optimization**
```bash
# Edit nginx config
sudo nano /etc/nginx/nginx.conf
# Add: worker_processes auto;
# Add: worker_connections 1024;
```

---

## 🔒 **SECURITY HARDENING**

### **Firewall Setup**
```bash
# Configure UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### **SSH Security**
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no (if using keys)
sudo systemctl restart ssh
```

---

## 📱 **ACCESS URLS**

- **Main Application**: https://yourdomain.com
- **Admin Login**: https://yourdomain.com/login
- **Public Registration**: https://yourdomain.com/register
- **Tracking**: https://yourdomain.com/track/[ID]
- **API Health**: https://yourdomain.com/api/health

---

## 📞 **SUPPORT COMMANDS**

### **Emergency Restart**
```bash
# Full system restart
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo -u aglis pm2 restart all
```

### **Backup Everything**
```bash
# Database backup
sudo -u aglis /home/aglis/backup_db.sh

# Application backup
sudo tar -czf /home/aglis/backup-app-$(date +%Y%m%d).tar.gz /home/aglis/AGLIS_Tech
```

### **System Information**
```bash
# Server specs
lscpu
free -h
df -h

# Application version
sudo -u aglis pm2 list
node --version
npm --version
```

---

## ✅ **DEPLOYMENT VERIFICATION**

### **Checklist After Deployment:**
- [ ] ✅ Application accessible via HTTPS
- [ ] ✅ Login page working
- [ ] ✅ Registration form working
- [ ] ✅ API endpoints responding
- [ ] ✅ Database connected
- [ ] ✅ File uploads working
- [ ] ✅ SSL certificate valid
- [ ] ✅ Monitoring active
- [ ] ✅ Backups scheduled
- [ ] ✅ Logs rotating

---

## 🎉 **SUCCESS!**

**Your AGLIS Management System is now LIVE in production!**

**🌐 Access your application at: https://yourdomain.com**

**📊 Monitor with: `sudo -u aglis /home/aglis/AGLIS_Tech/scripts/monitoring/dashboard.sh`**

**🔄 Deploy updates with: `sudo -u aglis /home/aglis/AGLIS_Tech/deploy.sh`**

---

**Need help? Check the logs or run the health check script!** 🚀
