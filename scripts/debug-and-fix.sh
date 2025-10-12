#!/bin/bash

# 🔧 AGLIS Debug and Fix Script
# Debug and fix common production issues

echo "🔧 AGLIS Debug and Fix Script"
echo "============================="

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

echo ""
echo "🔍 Step 1: Checking PM2 Status"
echo "=============================="
sudo -u aglis pm2 status

echo ""
echo "🔍 Step 2: Checking PM2 Logs (Last 20 lines)"
echo "============================================"
sudo -u aglis pm2 logs --lines 20

echo ""
echo "🔍 Step 3: Checking Backend Health"
echo "=================================="
print_info "Testing backend directly on port 3001..."
curl -I http://localhost:3001 2>/dev/null || print_error "Backend not responding on port 3001"

echo ""
print_info "Testing API health endpoint..."
curl -I http://localhost:3001/api/health 2>/dev/null || print_error "API health endpoint not found"

echo ""
echo "🔍 Step 4: Checking Application Files"
echo "====================================="
print_info "Checking frontend build..."
if [ -d "/home/aglis/AGLIS_Tech/frontend/dist" ]; then
    print_status "Frontend build directory exists"
    ls -la /home/aglis/AGLIS_Tech/frontend/dist/ | head -5
else
    print_error "Frontend build directory missing"
fi

print_info "Checking backend directory..."
if [ -d "/home/aglis/AGLIS_Tech/backend" ]; then
    print_status "Backend directory exists"
    ls -la /home/aglis/AGLIS_Tech/backend/ | head -5
else
    print_error "Backend directory missing"
fi

echo ""
echo "🔍 Step 5: Checking Nginx Configuration"
echo "======================================="
print_info "Testing Nginx configuration..."
sudo nginx -t

echo ""
echo "🔍 Step 6: Checking Recent Nginx Errors"
echo "======================================="
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || print_warning "No recent Nginx errors"

echo ""
echo "🔧 Step 7: Attempting Fixes"
echo "=========================="

# Fix 1: Restart PM2 processes
print_info "Restarting PM2 processes..."
sudo -u aglis pm2 restart all

# Fix 2: Check if backend is running
print_info "Waiting for backend to start..."
sleep 5

# Fix 3: Test backend again
print_info "Testing backend after restart..."
curl -I http://localhost:3001 2>/dev/null && print_status "Backend is responding" || print_error "Backend still not responding"

# Fix 4: Check if frontend build exists, if not rebuild
if [ ! -d "/home/aglis/AGLIS_Tech/frontend/dist" ]; then
    print_info "Rebuilding frontend..."
    sudo -u aglis bash << 'EOF'
cd /home/aglis/AGLIS_Tech/frontend
npm run build
EOF
    print_status "Frontend rebuild completed"
fi

# Fix 5: Update environment config
print_info "Updating environment configuration..."
sudo -u aglis bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
# Update CORS origin to include HTTPS
sed -i 's|CORS_ORIGIN=http://yourdomain.com|CORS_ORIGIN=https://portal.aglis.biz.id|' config.env
EOF

# Fix 6: Restart PM2 again
print_info "Restarting PM2 after config update..."
sudo -u aglis pm2 restart all

echo ""
echo "🔍 Step 8: Final Health Check"
echo "============================="
sleep 3

print_info "Testing HTTPS frontend..."
curl -I https://portal.aglis.biz.id 2>/dev/null | head -1

print_info "Testing HTTPS API..."
curl -I https://portal.aglis.biz.id/api/health 2>/dev/null | head -1

echo ""
echo "📊 Final PM2 Status"
echo "=================="
sudo -u aglis pm2 status

echo ""
echo "🎯 Next Steps"
echo "============="
echo "1. Check the output above for any errors"
echo "2. If backend is not responding, check:"
echo "   • sudo -u aglis pm2 logs aglis-backend"
echo "   • sudo -u aglis pm2 show aglis-backend"
echo "3. If frontend has issues, check:"
echo "   • ls -la /home/aglis/AGLIS_Tech/frontend/dist/"
echo "   • sudo tail -f /var/log/nginx/error.log"
echo "4. Test in browser: https://portal.aglis.biz.id"
echo ""
echo "✅ Debug and fix script completed!"
