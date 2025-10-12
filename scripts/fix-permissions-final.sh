#!/bin/bash

# 🔧 AGLIS Final Permission Fix Script
# Fix all permission issues

echo "🔧 AGLIS Final Permission Fix Script"
echo "==================================="

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
echo "🔧 Step 1: Fix Application Permissions"
echo "====================================="

# Fix ownership
print_info "Setting ownership to aglis:aglis..."
sudo chown -R aglis:aglis /home/aglis/AGLIS_Tech/
print_status "Ownership fixed"

# Fix permissions
print_info "Setting permissions to 755..."
sudo chmod -R 755 /home/aglis/AGLIS_Tech/
print_status "Permissions fixed"

# Fix specific directories
print_info "Fixing specific directories..."
sudo chmod 755 /home/aglis/AGLIS_Tech/frontend/dist/
sudo chmod 755 /home/aglis/AGLIS_Tech/backend/uploads/
sudo chmod 755 /home/aglis/AGLIS_Tech/logs/
print_status "Directory permissions fixed"

# Fix config file
print_info "Securing config file..."
sudo chmod 600 /home/aglis/AGLIS_Tech/backend/config.env
print_status "Config file secured"

echo ""
echo "🔧 Step 2: Test File Access"
echo "=========================="

# Test if Nginx can access files
print_info "Testing file access..."
if [ -r "/home/aglis/AGLIS_Tech/frontend/dist/index.html" ]; then
    print_status "Frontend index.html is readable"
else
    print_error "Frontend index.html is not readable"
fi

# Check file permissions
print_info "Current permissions:"
ls -la /home/aglis/AGLIS_Tech/frontend/dist/

echo ""
echo "🔧 Step 3: Restart Services"
echo "=========================="

# Restart PM2
print_info "Restarting PM2 processes..."
sudo -u aglis pm2 restart all
print_status "PM2 restarted"

# Restart Nginx
print_info "Restarting Nginx..."
sudo systemctl restart nginx
print_status "Nginx restarted"

echo ""
echo "🔧 Step 4: Final Test"
echo "===================="

# Wait a moment
sleep 3

# Test frontend
print_info "Testing frontend access..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id)
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_status "Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
    print_warning "Frontend status: HTTP $FRONTEND_STATUS"
fi

# Test backend
print_info "Testing backend access..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
    print_status "Backend is responding (HTTP $BACKEND_STATUS)"
else
    print_warning "Backend status: HTTP $BACKEND_STATUS"
fi

echo ""
echo "📊 Final Status"
echo "==============="
print_info "PM2 Status:"
sudo -u aglis pm2 status

print_info "Nginx Status:"
sudo systemctl is-active nginx

echo ""
echo "🎯 Test Your Site"
echo "================="
echo "• Frontend: https://portal.aglis.biz.id"
echo "• Admin: https://portal.aglis.biz.id/login"
echo "• Registration: https://portal.aglis.biz.id/register"
echo ""
echo "✅ Permission fix completed!"
