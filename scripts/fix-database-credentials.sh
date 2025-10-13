#!/bin/bash

# 🔧 Fix Database Credentials
# Update database.js to use correct env file

echo "🔧 Fixing Database Credentials"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

BACKEND_DIR="/home/aglis/AGLIS_Tech/backend"
DB_CONFIG="$BACKEND_DIR/src/config/database.js"

echo ""
print_info "Step 1: Check DB Password in config.env"
echo "========================================"

if sudo -u aglis grep -q "DB_PASSWORD" "$BACKEND_DIR/config.env"; then
    print_status "DB_PASSWORD exists in config.env"
else
    print_warning "DB_PASSWORD not found, will use from deployment"
fi

echo ""
print_info "Step 2: Update database.js to load config.env"
echo "=============================================="

# Backup
sudo -u aglis cp "$DB_CONFIG" "$DB_CONFIG.backup"
print_status "Backed up database.js"

# Update database.js to explicitly load config.env
sudo -u aglis tee "$DB_CONFIG" > /dev/null << 'EOF'
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

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
EOF

print_status "database.js updated"

echo ""
print_info "Step 3: Run Migrations"
echo "======================"

cd "$BACKEND_DIR"
print_info "Running migrations..."
sudo -u aglis npm run migrate

if [ $? -eq 0 ]; then
    print_status "Migrations completed successfully"
else
    print_warning "Migrations had issues, checking database..."
fi

echo ""
print_info "Step 4: Verify Database Tables"
echo "=============================="

print_info "Checking users table..."
sudo -u postgres psql -d aglis_production -c "\dt" | grep users

if [ $? -eq 0 ]; then
    print_status "Users table exists"
    
    print_info "Checking user count..."
    sudo -u postgres psql -d aglis_production -c "SELECT COUNT(*) FROM users;"
else
    print_warning "Users table not found"
fi

echo ""
print_info "Step 5: Restart Backend with New Config"
echo "======================================="

print_info "Restarting PM2..."
sudo -u aglis pm2 restart aglis-backend

if [ $? -eq 0 ]; then
    print_status "Backend restarted"
else
    print_error "Failed to restart"
    exit 1
fi

print_info "Waiting for backend to start..."
sleep 5

echo ""
print_info "Step 6: Test Database Connection"
echo "================================="

print_info "Testing health endpoint..."
curl -s http://localhost:3001/health | head -5

echo ""
print_info "Testing login endpoint..."
RESULT=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "$RESULT" | head -5

if echo "$RESULT" | grep -q "success"; then
    print_status "Login endpoint responding"
else
    print_warning "Login might have issues, check logs"
fi

echo ""
print_info "Step 7: Check PM2 Logs"
echo "======================"

print_info "Recent logs (last 10 lines):"
sudo -u aglis pm2 logs aglis-backend --lines 10 --nostream | tail -20

echo ""
print_status "🎉 Database credentials fix completed!"
echo ""
echo "📊 What was fixed:"
echo "  ✅ database.js explicitly loads config.env"
echo "  ✅ Updated fallback values to aglis_user/aglis_production"
echo "  ✅ Database migrations run"
echo "  ✅ Backend restarted with new config"
echo ""
echo "🎯 Test your site:"
echo "  https://portal.aglis.biz.id/login"
echo ""
echo "💡 If still having issues:"
echo "  sudo -u aglis pm2 logs aglis-backend"
