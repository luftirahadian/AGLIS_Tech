#!/bin/bash

# 🔧 AGLIS Final Issues Fix Script
# Fix permission and Nginx configuration

echo "🔧 AGLIS Final Issues Fix Script"
echo "================================="

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
echo "🔧 Step 1: Fix Home Directory Permission"
echo "========================================"
print_info "Fixing /home/aglis permission for Nginx access..."

# Fix /home/aglis permission
sudo chmod 755 /home/aglis
print_status "/home/aglis permission fixed"

# Fix application directory permissions
sudo chmod 755 /home/aglis/AGLIS_Tech
sudo chmod 755 /home/aglis/AGLIS_Tech/frontend
sudo chmod 755 /home/aglis/AGLIS_Tech/frontend/dist
print_status "Application directory permissions fixed"

# Verify Nginx can access
print_info "Testing if Nginx user can access files..."
sudo -u www-data stat /home/aglis/AGLIS_Tech/frontend/dist/index.html > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Nginx user can now access frontend files"
else
    print_error "Nginx user still cannot access files"
fi

echo ""
echo "🔧 Step 2: Fix Nginx Configuration"
echo "=================================="
print_info "Updating Nginx configuration for correct API routing..."

# Backup current config
sudo cp /etc/nginx/sites-available/aglis /etc/nginx/sites-available/aglis.backup.$(date +%Y%m%d%H%M%S)
print_status "Current config backed up"

# Update Nginx config
print_info "Updating proxy_pass directive..."
sudo sed -i 's|proxy_pass http://localhost:3001;|proxy_pass http://localhost:3001/api;|' /etc/nginx/sites-available/aglis
print_status "Nginx configuration updated"

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    print_warning "Restoring backup..."
    sudo cp /etc/nginx/sites-available/aglis.backup.* /etc/nginx/sites-available/aglis 2>/dev/null
    exit 1
fi

echo ""
echo "🔧 Step 3: Restart Services"
echo "=========================="

# Reload Nginx
print_info "Reloading Nginx..."
sudo systemctl reload nginx
print_status "Nginx reloaded"

# Check Nginx status
print_info "Checking Nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx is not running"
fi

echo ""
echo "🔧 Step 4: Final Test"
echo "===================="

# Wait a moment
sleep 2

# Test frontend
print_info "Testing frontend access..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id)
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_status "Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
    print_warning "Frontend status: HTTP $FRONTEND_STATUS"
fi

# Test backend health via Nginx
print_info "Testing backend health via Nginx..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id/api/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    print_status "Backend API is accessible (HTTP $HEALTH_STATUS)"
else
    print_warning "Backend API status: HTTP $HEALTH_STATUS"
fi

# Test backend direct
print_info "Testing backend directly..."
DIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "$DIRECT_STATUS" = "200" ]; then
    print_status "Backend direct access works (HTTP $DIRECT_STATUS)"
else
    print_warning "Backend direct status: HTTP $DIRECT_STATUS"
fi

echo ""
echo "📊 Final Results"
echo "================"
print_info "Directory Permissions:"
ls -ld /home/aglis/
ls -ld /home/aglis/AGLIS_Tech/
ls -ld /home/aglis/AGLIS_Tech/frontend/dist/

print_info "Nginx Configuration:"
sudo grep -A 5 "location /api" /etc/nginx/sites-available/aglis

echo ""
echo "🎯 Test Your Site"
echo "================="
echo "• Frontend: https://portal.aglis.biz.id"
echo "• Login: https://portal.aglis.biz.id/login"
echo "• Registration: https://portal.aglis.biz.id/register"
echo "• API Health: https://portal.aglis.biz.id/api/health"
echo ""
echo "✅ All fixes completed!"
