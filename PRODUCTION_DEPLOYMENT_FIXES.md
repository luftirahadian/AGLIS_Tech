# 🔧 Production Deployment Fixes Documentation

**AGLIS Management System**  
**Date:** October 13, 2025  
**Server:** portal.aglis.biz.id  
**Status:** ✅ Successfully Deployed

---

## 📋 Table of Contents

1. [Issues Encountered](#issues-encountered)
2. [Solutions Applied](#solutions-applied)
3. [Final Configuration](#final-configuration)
4. [Quick Fix Commands](#quick-fix-commands)
5. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🚨 Issues Encountered

### Issue #1: Permission Denied - Home Directory
**Error:**
```
./production-deploy.sh: line 115: cd: /home/aglis/AGLIS_Tech: Permission denied
```

**Cause:**
- Default home directory permissions (700) prevented Nginx from accessing files
- Application directory owned by aglis but not accessible by www-data (Nginx user)

**Solution:**
```bash
sudo chmod 755 /home/aglis
sudo chmod 755 /home/aglis/AGLIS_Tech
sudo chmod 755 /home/aglis/AGLIS_Tech/frontend
sudo chmod 755 /home/aglis/AGLIS_Tech/frontend/dist
sudo chown -R aglis:aglis /home/aglis/AGLIS_Tech
```

---

### Issue #2: Mixed Content Error (HTTPS → HTTP)
**Error:**
```
Mixed Content: The page at 'https://portal.aglis.biz.id' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://192.168.1.44:3001/api/auth/login'
```

**Cause:**
- Frontend built with development environment variables
- `VITE_API_URL` pointed to HTTP localhost

**Solution:**
1. Create production environment file:
```bash
# /home/aglis/AGLIS_Tech/frontend/.env.production
VITE_API_URL=https://portal.aglis.biz.id/api
VITE_SOCKET_URL=https://portal.aglis.biz.id
```

2. Rebuild frontend:
```bash
cd /home/aglis/AGLIS_Tech/frontend
sudo -u aglis npm install
sudo -u aglis npm run build
```

---

### Issue #3: PostCSS Configuration Error
**Error:**
```
SyntaxError: Unexpected token 'export'
/home/aglis/AGLIS_Tech/frontend/postcss.config.js:1
export default {
^^^^^^
```

**Cause:**
- `postcss.config.js` used ES Module syntax
- Node.js expected CommonJS

**Solution:**
```bash
# Update postcss.config.js to CommonJS
cat > /home/aglis/AGLIS_Tech/frontend/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
```

---

### Issue #4: Database Connection Failed - Wrong Credentials
**Error:**
```
error: password authentication failed for user "isp_admin"
```

**Cause:**
- Backend code had hardcoded fallback to old database user (`isp_admin`)
- `database.js` and `migrate.js` not loading `config.env` properly

**Solution:**

**1. Fix database.js:**
```javascript
// /home/aglis/AGLIS_Tech/backend/src/config/database.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'aglis_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aglis_production',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

**2. Fix migrate.js:**
```javascript
// /home/aglis/AGLIS_Tech/backend/scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'aglis_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aglis_production',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// ... rest of migration code
```

---

### Issue #5: Database Password Authentication
**Error:**
```
password authentication failed for user "aglis_user"
```

**Cause:**
- SCRAM-SHA-256 password in config.env was incorrect or corrupted

**Solution:**
```bash
# Reset database password
sudo -u postgres psql -c "ALTER USER aglis_user WITH PASSWORD 'aglis_secure_2025';"

# Update config.env
echo "DB_PASSWORD=aglis_secure_2025" >> /home/aglis/AGLIS_Tech/backend/config.env
# Remove old SCRAM password line
sudo -u aglis sed -i '/SCRAM-SHA-256/d' /home/aglis/AGLIS_Tech/backend/config.env
```

---

### Issue #6: Database Tables Not Created
**Error:**
```
ERROR: relation "users" does not exist
```

**Cause:**
- Migrations failed due to authentication issues
- `npm run migrate` couldn't connect to database

**Solution:**
```bash
# Run migrations manually as postgres user (bypass authentication)
cd /home/aglis/AGLIS_Tech/backend
for file in migrations/*.sql; do
    echo "Running $(basename $file)..."
    sudo -u postgres psql -d aglis_production -f "$file"
done

# Verify tables created
sudo -u postgres psql -d aglis_production -c "\dt"
```

---

### Issue #7: Permission Denied on Database Tables
**Error:**
```
permission denied for table users
code: '42501'
```

**Cause:**
- Tables created by postgres user
- aglis_user had no permissions on tables

**Solution:**
```bash
sudo -u postgres psql -d aglis_production << 'EOF'
-- Grant all permissions on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aglis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aglis_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aglis_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO aglis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO aglis_user;
EOF
```

---

### Issue #8: No Admin User in Database
**Error:**
```
Invalid credentials (but backend working)
```

**Cause:**
- Migrations created tables but no admin user
- Only technician/customer service users existed

**Solution:**
```bash
# Generate bcrypt hash for password
cd /home/aglis/AGLIS_Tech/backend
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10, function(err, hash) {
  console.log(hash);
});
"

# Create admin user (note: column is password_hash, not password)
sudo -u postgres psql -d aglis_production << 'EOF'
INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
  'admin',
  'admin@aglis.biz.id',
  '$2b$10$uIv/97usD2a9c/bT3tr50etSea2BlXTWwtvGMQ2zXdpMzsy8GNrSu',
  'AGLIS Administrator',
  'admin',
  true,
  NOW(),
  NOW()
);
EOF
```

---

### Issue #9: CORS Blocked Origin
**Error:**
```
🚫 CORS: Blocked origin: https://portal.aglis.biz.id
```

**Cause:**
- Backend CORS configuration only allowed localhost origins
- Production domain not in allowed origins list

**Solution:**
```bash
# Update backend config.env
echo "CORS_ORIGIN=https://portal.aglis.biz.id" >> /home/aglis/AGLIS_Tech/backend/config.env

# Restart backend
sudo -u aglis pm2 restart aglis-backend
```

---

### Issue #10: Nginx Server Name Not Set
**Error:**
```
Could not automatically find a matching server block for portal.aglis.biz.id
```

**Cause:**
- Nginx configuration had `server_name _;` instead of actual domain
- Certbot couldn't install SSL certificate

**Solution:**
```bash
# Update Nginx configuration
sudo sed -i 's/server_name _;/server_name portal.aglis.biz.id;/' /etc/nginx/sites-available/aglis

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate
sudo certbot install --cert-name portal.aglis.biz.id
```

---

## ✅ Solutions Applied (Summary)

1. **Frontend Fixes:**
   - Created `.env.production` with HTTPS URLs
   - Converted `postcss.config.js` to CommonJS
   - Rebuilt frontend with `npm install` then `npm run build`

2. **Backend Fixes:**
   - Updated `database.js` to load `config.env` explicitly
   - Updated `migrate.js` to load `config.env` explicitly
   - Fixed fallback database credentials
   - Added CORS_ORIGIN for production domain

3. **Database Fixes:**
   - Reset database password to simple string
   - Ran migrations manually as postgres user
   - Granted all permissions to aglis_user
   - Created admin user with bcrypt password

4. **System Fixes:**
   - Fixed home directory permissions (755)
   - Fixed application directory ownership
   - Updated Nginx server_name
   - Configured SSL certificate

5. **PM2 Configuration:**
   - Restarted backend with correct environment
   - Verified 4 instances running in cluster mode

---

## 🔧 Final Configuration

### Backend Environment (`config.env`)
```bash
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aglis_production
DB_USER=aglis_user
DB_PASSWORD=aglis_secure_2025
JWT_SECRET=GKCRxY1Y7qGNSfLNElsYXYocN3KWdsO9H6AMjLkwnCqm6IxUVfYmXzGwPmoyj794
UPLOAD_PATH=./uploads
CORS_ORIGIN=https://portal.aglis.biz.id
```

### Frontend Environment (`.env.production`)
```bash
VITE_API_URL=https://portal.aglis.biz.id/api
VITE_SOCKET_URL=https://portal.aglis.biz.id
```

### Database Credentials
```yaml
Database: aglis_production
User: aglis_user
Password: aglis_secure_2025
Host: localhost
Port: 5432
```

### Admin Account
```yaml
Username: admin
Password: admin123
Email: admin@aglis.biz.id
Role: admin
```

---

## 🚀 Quick Fix Commands

### If Frontend Shows Mixed Content Error:
```bash
cd /home/aglis/AGLIS_Tech/frontend
cat > .env.production << 'EOF'
VITE_API_URL=https://portal.aglis.biz.id/api
VITE_SOCKET_URL=https://portal.aglis.biz.id
EOF
sudo -u aglis npm install
sudo -u aglis npm run build
sudo systemctl reload nginx
```

### If Backend Can't Connect to Database:
```bash
# Check config.env has correct credentials
grep "DB_" /home/aglis/AGLIS_Tech/backend/config.env

# Test connection
cd /home/aglis/AGLIS_Tech/backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'aglis_user',
  host: 'localhost',
  database: 'aglis_production',
  password: 'aglis_secure_2025',
  port: 5432,
});
pool.query('SELECT COUNT(*) FROM users', (err, res) => {
  if (err) console.error('Error:', err.message);
  else console.log('Success! Users:', res.rows[0].count);
  pool.end();
});
"
```

### If Database Permissions Error:
```bash
sudo -u postgres psql -d aglis_production << 'EOF'
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aglis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aglis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO aglis_user;
EOF
```

### If Migrations Not Run:
```bash
cd /home/aglis/AGLIS_Tech/backend
for file in migrations/*.sql; do
    sudo -u postgres psql -d aglis_production -f "$file"
done
```

### If No Admin User:
```bash
# Generate new hash
cd /home/aglis/AGLIS_Tech/backend
HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10, (e,h) => console.log(h));")

# Create admin
sudo -u postgres psql -d aglis_production -c "
INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES ('admin', 'admin@aglis.biz.id', '$HASH', 'AGLIS Administrator', 'admin', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
"
```

### If CORS Error:
```bash
# Update config
echo "CORS_ORIGIN=https://portal.aglis.biz.id" | sudo -u aglis tee -a /home/aglis/AGLIS_Tech/backend/config.env

# Restart backend
sudo -u aglis pm2 restart aglis-backend
```

### Restart All Services:
```bash
# Restart backend
sudo -u aglis pm2 restart aglis-backend

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo -u aglis pm2 status
sudo systemctl status nginx
```

---

## 🔍 Troubleshooting Guide

### Problem: Frontend Shows 500 Error
**Check:**
```bash
# 1. Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# 2. Check if frontend build exists
ls -la /home/aglis/AGLIS_Tech/frontend/dist/

# 3. Test Nginx configuration
sudo nginx -t

# 4. Check permissions
ls -ld /home/aglis
ls -ld /home/aglis/AGLIS_Tech/frontend/dist/
```

**Fix:**
```bash
# Rebuild frontend
cd /home/aglis/AGLIS_Tech/frontend
sudo -u aglis npm install
sudo -u aglis npm run build

# Fix permissions
sudo chmod 755 /home/aglis
sudo chmod -R 755 /home/aglis/AGLIS_Tech/frontend/dist/

# Restart Nginx
sudo systemctl reload nginx
```

---

### Problem: Backend Returns 500 Error
**Check:**
```bash
# 1. Check PM2 logs
sudo -u aglis pm2 logs aglis-backend --lines 50

# 2. Check database connection
cd /home/aglis/AGLIS_Tech/backend
node -e "
const pool = require('./src/config/database');
pool.query('SELECT 1', (err) => {
  if (err) console.error('DB Error:', err.message);
  else console.log('DB Connected!');
  pool.end();
});
"

# 3. Check config.env
cat /home/aglis/AGLIS_Tech/backend/config.env
```

**Fix:**
```bash
# Restart backend with updated env
sudo -u aglis pm2 restart aglis-backend

# Check logs
sudo -u aglis pm2 logs aglis-backend --lines 20
```

---

### Problem: Login Returns "Invalid Credentials"
**Check:**
```bash
# 1. Check if admin user exists
sudo -u postgres psql -d aglis_production -c "SELECT username, email, role FROM users WHERE username='admin';"

# 2. Check backend logs
sudo -u aglis pm2 logs aglis-backend --lines 20 | grep -i "login"

# 3. Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Fix:**
```bash
# Create/reset admin user
cd /home/aglis/AGLIS_Tech/backend
HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hashSync('admin123', 10)" | tail -1)
sudo -u postgres psql -d aglis_production -c "
DELETE FROM users WHERE username='admin';
INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES ('admin', 'admin@aglis.biz.id', '$HASH', 'AGLIS Administrator', 'admin', true, NOW(), NOW());
"
```

---

### Problem: Database Connection Timeout
**Check:**
```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Check PostgreSQL logs
sudo tail -50 /var/log/postgresql/postgresql-12-main.log

# 3. Test connection
sudo -u postgres psql -d aglis_production -c "SELECT current_database();"
```

**Fix:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='aglis_production';"
```

---

### Problem: PM2 Not Starting
**Check:**
```bash
# 1. Check PM2 status
sudo -u aglis pm2 status

# 2. Check PM2 logs
sudo -u aglis pm2 logs --lines 50

# 3. Try starting manually
cd /home/aglis/AGLIS_Tech/backend
sudo -u aglis pm2 start src/server.js --name aglis-backend
```

**Fix:**
```bash
# Delete PM2 processes
sudo -u aglis pm2 delete all

# Start from ecosystem file
cd /home/aglis/AGLIS_Tech
sudo -u aglis pm2 start ecosystem.config.js

# Save configuration
sudo -u aglis pm2 save
```

---

## 📞 Emergency Recovery Commands

### Complete Backend Restart:
```bash
#!/bin/bash
# Stop all
sudo -u aglis pm2 stop all

# Check database
sudo -u postgres psql -d aglis_production -c "SELECT COUNT(*) FROM users;"

# Start backend
sudo -u aglis pm2 start ecosystem.config.js

# Wait and check
sleep 5
sudo -u aglis pm2 status
sudo -u aglis pm2 logs --lines 10

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Complete System Restart:
```bash
#!/bin/bash
echo "Stopping services..."
sudo -u aglis pm2 stop all
sudo systemctl stop nginx

echo "Starting PostgreSQL..."
sudo systemctl start postgresql
sleep 2

echo "Starting PM2..."
sudo -u aglis pm2 start ecosystem.config.js
sleep 3

echo "Starting Nginx..."
sudo systemctl start nginx
sleep 2

echo "Checking status..."
sudo -u aglis pm2 status
sudo systemctl status nginx --no-pager
sudo systemctl status postgresql --no-pager

echo "Testing endpoints..."
curl -I https://portal.aglis.biz.id
curl -I http://localhost:3001/health
```

---

## 📚 Related Documentation

- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [PRODUCTION_QUICK_START.md](./PRODUCTION_QUICK_START.md) - Quick deployment steps
- [README.md](./README.md) - Project overview
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - System architecture

---

## 📝 Notes

- **Always backup** `config.env` before making changes
- **Test in staging** before applying fixes to production
- **Monitor logs** after applying fixes: `sudo -u aglis pm2 logs`
- **Document any new issues** and solutions in this file

---

## 🆘 Support

If issues persist after trying these fixes:

1. Check PM2 logs: `sudo -u aglis pm2 logs aglis-backend --lines 100`
2. Check Nginx logs: `sudo tail -100 /var/log/nginx/error.log`
3. Check PostgreSQL logs: `sudo tail -100 /var/log/postgresql/postgresql-12-main.log`
4. Check system resources: `htop` or `free -h` and `df -h`

---

**Last Updated:** October 13, 2025  
**Version:** 1.0.0  
**Status:** Production Stable ✅

