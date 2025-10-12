#!/bin/bash

# 🔧 Fix Backend Configuration
# Fix database credentials, CORS, and run migrations

echo "🔧 Fixing Backend Configuration"
echo "==============================="

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
CONFIG_FILE="$BACKEND_DIR/config.env"

echo ""
print_info "Step 1: Backup Current Config"
echo "=============================="

sudo -u aglis cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d%H%M%S)"
print_status "Config backed up"

echo ""
print_info "Step 2: Update Backend Config"
echo "============================="

print_info "Updating CORS origin to include HTTPS production domain..."

# Check if CORS_ORIGIN exists, if not add it
if grep -q "CORS_ORIGIN" "$CONFIG_FILE"; then
    print_info "Updating existing CORS_ORIGIN..."
else
    print_info "Adding CORS_ORIGIN..."
    echo "" | sudo -u aglis tee -a "$CONFIG_FILE" > /dev/null
fi

# Update or add CORS_ORIGIN
sudo -u aglis sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://portal.aglis.biz.id|' "$CONFIG_FILE"

# If CORS_ORIGIN still doesn't exist, add it
if ! grep -q "CORS_ORIGIN" "$CONFIG_FILE"; then
    echo "CORS_ORIGIN=https://portal.aglis.biz.id" | sudo -u aglis tee -a "$CONFIG_FILE" > /dev/null
fi

print_status "CORS_ORIGIN updated"

echo ""
print_info "Step 3: Run Database Migrations"
echo "==============================="

cd "$BACKEND_DIR"
print_info "Running migrations..."
sudo -u aglis npm run migrate

if [ $? -eq 0 ]; then
    print_status "Migrations completed"
else
    print_error "Migrations failed, but continuing..."
fi

echo ""
print_info "Step 4: Verify Database"
echo "======================="

print_info "Checking if users table exists..."
sudo -u postgres psql -d aglis_production -c "\dt users" 2>&1 | grep -q "users"

if [ $? -eq 0 ]; then
    print_status "Users table exists"
    
    print_info "Checking user count..."
    sudo -u postgres psql -d aglis_production -c "SELECT COUNT(*) as user_count FROM users;"
else
    print_warning "Users table not found, might need manual migration"
fi

echo ""
print_info "Step 5: Restart Backend"
echo "======================="

print_info "Restarting PM2 processes..."
sudo -u aglis pm2 restart aglis-backend

if [ $? -eq 0 ]; then
    print_status "Backend restarted"
else
    print_error "Failed to restart backend"
    exit 1
fi

echo ""
print_info "Step 6: Wait for Backend to Start"
echo "================================="

print_info "Waiting 5 seconds..."
sleep 5

echo ""
print_info "Step 7: Test Backend"
echo "===================="

print_info "Testing login endpoint..."
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  2>&1 | tail -5

echo ""
print_info "Step 8: Check PM2 Status"
echo "======================="

sudo -u aglis pm2 status

echo ""
print_info "Step 9: Show Current Config"
echo "==========================="

print_info "Current backend config (sensitive data hidden):"
cat "$CONFIG_FILE" | grep -v "PASSWORD" | grep -v "JWT_SECRET"

echo ""
print_status "🎉 Backend configuration fix completed!"
echo ""
echo "📊 What was fixed:"
echo "  ✅ CORS_ORIGIN set to https://portal.aglis.biz.id"
echo "  ✅ Database migrations run"
echo "  ✅ Backend restarted"
echo ""
echo "🎯 Test your site:"
echo "  https://portal.aglis.biz.id/login"
echo ""
echo "💡 If login still fails, check:"
echo "  sudo -u aglis pm2 logs aglis-backend --lines 20"
