# ⚡ AGLIS Deployment Quick Reference

**Quick commands for common deployment issues**

---

## 🚨 Emergency Fixes (Copy-Paste Ready)

### Frontend Not Loading (500 Error)
```bash
sudo chmod 755 /home/aglis
sudo chmod -R 755 /home/aglis/AGLIS_Tech/frontend/dist
sudo systemctl reload nginx
```

### Backend Not Responding
```bash
sudo -u aglis pm2 restart aglis-backend
sudo -u aglis pm2 logs --lines 20
```

### Database Connection Failed
```bash
# Check config
grep "DB_" /home/aglis/AGLIS_Tech/backend/config.env

# Grant permissions
sudo -u postgres psql -d aglis_production -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aglis_user;"

# Restart backend
sudo -u aglis pm2 restart aglis-backend
```

### Login Not Working
```bash
# Check admin user exists
sudo -u postgres psql -d aglis_production -c "SELECT username, role FROM users WHERE username='admin';"

# Create if missing (run in backend directory)
cd /home/aglis/AGLIS_Tech/backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10, (e,h) => console.log('sudo -u postgres psql -d aglis_production -c \"INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES (\\\'admin\\\', \\\'admin@aglis.biz.id\\\', \\\'' + h + '\\\', \\\'AGLIS Administrator\\\', \\\'admin\\\', true, NOW(), NOW());\"'));"
```

---

## 📊 System Status Checks

### Check All Services
```bash
echo "=== PM2 Status ==="
sudo -u aglis pm2 status

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo "=== PostgreSQL Status ==="
sudo systemctl status postgresql --no-pager

echo "=== Frontend Test ==="
curl -I https://portal.aglis.biz.id

echo "=== Backend Test ==="
curl -I http://localhost:3001/health
```

### View Logs
```bash
# Backend logs (last 50 lines)
sudo -u aglis pm2 logs aglis-backend --lines 50 --nostream

# Nginx error log
sudo tail -50 /var/log/nginx/error.log

# PostgreSQL log
sudo tail -50 /var/log/postgresql/postgresql-12-main.log
```

---

## 🔄 Restart Services

### Restart Everything
```bash
sudo -u aglis pm2 restart aglis-backend
sudo systemctl restart nginx
sudo systemctl restart postgresql
sleep 3
sudo -u aglis pm2 status
```

### Restart Just Backend
```bash
sudo -u aglis pm2 restart aglis-backend
sleep 2
curl -I http://localhost:3001/health
```

### Restart Just Frontend (Nginx)
```bash
sudo systemctl reload nginx
curl -I https://portal.aglis.biz.id
```

---

## 🔧 Rebuild Frontend

```bash
cd /home/aglis/AGLIS_Tech/frontend

# Create production env if missing
cat > .env.production << 'EOF'
VITE_API_URL=https://portal.aglis.biz.id/api
VITE_SOCKET_URL=https://portal.aglis.biz.id
EOF

# Rebuild
sudo -u aglis npm install
sudo -u aglis npm run build

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🗄️ Database Quick Fixes

### Grant All Permissions
```bash
sudo -u postgres psql -d aglis_production << 'EOF'
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aglis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aglis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO aglis_user;
EOF
```

### Check Tables
```bash
sudo -u postgres psql -d aglis_production -c "\dt"
```

### Count Users
```bash
sudo -u postgres psql -d aglis_production -c "SELECT COUNT(*) FROM users;"
```

### List All Users
```bash
sudo -u postgres psql -d aglis_production -c "SELECT username, email, role FROM users;"
```

---

## 🔐 Credentials

### Database
```
Host: localhost
Port: 5432
Database: aglis_production
User: aglis_user
Password: aglis_secure_2025
```

### Admin Account
```
URL: https://portal.aglis.biz.id/login
Username: admin
Password: admin123
Email: admin@aglis.biz.id
```

---

## 📁 Important Paths

```bash
# Application
/home/aglis/AGLIS_Tech

# Frontend
/home/aglis/AGLIS_Tech/frontend/dist

# Backend
/home/aglis/AGLIS_Tech/backend

# Config
/home/aglis/AGLIS_Tech/backend/config.env

# Logs
/home/aglis/AGLIS_Tech/logs
~/.pm2/logs

# Nginx
/etc/nginx/sites-available/aglis
/var/log/nginx/error.log
/var/log/nginx/access.log
```

---

## 🧪 Test Endpoints

```bash
# Frontend
curl -I https://portal.aglis.biz.id

# Backend health
curl http://localhost:3001/health

# Login API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🆘 If Everything Fails

```bash
# Complete restart sequence
echo "Stopping services..."
sudo -u aglis pm2 stop all
sudo systemctl stop nginx

echo "Starting PostgreSQL..."
sudo systemctl start postgresql
sleep 2

echo "Starting backend..."
cd /home/aglis/AGLIS_Tech
sudo -u aglis pm2 start ecosystem.config.js
sleep 3

echo "Starting Nginx..."
sudo systemctl start nginx
sleep 2

echo "Testing..."
sudo -u aglis pm2 status
curl -I https://portal.aglis.biz.id
curl http://localhost:3001/health
```

---

## 📞 Support Files

- Full fixes: [PRODUCTION_DEPLOYMENT_FIXES.md](./PRODUCTION_DEPLOYMENT_FIXES.md)
- Deployment guide: [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- Quick start: [PRODUCTION_QUICK_START.md](./PRODUCTION_QUICK_START.md)

---

**Last Updated:** October 13, 2025

