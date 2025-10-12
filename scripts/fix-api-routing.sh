#!/bin/bash

# 🔧 AGLIS API Routing Fix Script
# Fix API routing issues

echo "🔧 AGLIS API Routing Fix Script"
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

echo ""
echo "🔍 Step 1: Test Backend Routes"
echo "=============================="

print_info "Testing various endpoints..."

# Test /health
print_info "Testing: http://localhost:3001/health"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
echo "Response: HTTP $HEALTH"

# Test /api/health
print_info "Testing: http://localhost:3001/api/health"
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
echo "Response: HTTP $API_HEALTH"

# Test /api/auth/login
print_info "Testing: http://localhost:3001/api/auth/login"
AUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login)
echo "Response: HTTP $AUTH"

# Test /auth/login (without /api prefix)
print_info "Testing: http://localhost:3001/auth/login"
AUTH_NO_API=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/auth/login)
echo "Response: HTTP $AUTH_NO_API"

echo ""
echo "📊 Diagnosis"
echo "============"

if [ "$HEALTH" = "200" ] && [ "$API_HEALTH" = "404" ]; then
    print_warning "Backend does NOT use /api prefix"
    echo "Routes are directly accessible without /api:"
    echo "  ✅ /health → 200"
    echo "  ❌ /api/health → 404"
    echo ""
    print_info "Solution: Remove /api from Nginx proxy_pass"
    FIX_TYPE="remove_api_prefix"
elif [ "$API_HEALTH" = "200" ]; then
    print_status "Backend uses /api prefix correctly"
    echo "Routes are accessible with /api:"
    echo "  ✅ /api/health → 200"
    echo ""
    print_info "Nginx configuration is correct"
    FIX_TYPE="none"
else
    print_error "Backend may have other issues"
    FIX_TYPE="unknown"
fi

echo ""
echo "🔧 Step 2: Apply Fix"
echo "===================="

if [ "$FIX_TYPE" = "remove_api_prefix" ]; then
    print_info "Fixing Nginx configuration..."
    
    # Backup current config
    sudo cp /etc/nginx/sites-available/aglis /etc/nginx/sites-available/aglis.backup.api-$(date +%Y%m%d%H%M%S)
    print_status "Config backed up"
    
    # Update Nginx config to strip /api prefix
    print_info "Updating proxy_pass to strip /api prefix..."
    sudo sed -i 's|proxy_pass http://localhost:3001/api;|proxy_pass http://localhost:3001;|' /etc/nginx/sites-available/aglis
    
    # Test Nginx configuration
    print_info "Testing Nginx configuration..."
    if sudo nginx -t; then
        print_status "Nginx configuration is valid"
        
        # Reload Nginx
        print_info "Reloading Nginx..."
        sudo systemctl reload nginx
        print_status "Nginx reloaded"
        
        # Wait and test
        sleep 2
        
        print_info "Testing fixed API endpoint..."
        API_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id/api/health)
        if [ "$API_TEST" = "200" ]; then
            print_status "API endpoint is now working! (HTTP $API_TEST)"
        else
            print_warning "API endpoint status: HTTP $API_TEST"
        fi
    else
        print_error "Nginx configuration test failed"
        print_warning "Restoring backup..."
        sudo cp /etc/nginx/sites-available/aglis.backup.api-* /etc/nginx/sites-available/aglis 2>/dev/null | tail -1
    fi
    
elif [ "$FIX_TYPE" = "none" ]; then
    print_status "No fix needed, configuration is correct"
    print_info "Testing via Nginx..."
    API_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id/api/health)
    if [ "$API_TEST" = "200" ]; then
        print_status "API endpoint is working! (HTTP $API_TEST)"
    else
        print_warning "API endpoint status: HTTP $API_TEST"
        print_info "Try clearing browser cache or waiting a moment"
    fi
else
    print_error "Unknown issue, manual investigation needed"
fi

echo ""
echo "🔍 Step 3: Final Verification"
echo "============================="

print_info "Testing all endpoints..."

# Test frontend
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id)
if [ "$FRONTEND" = "200" ]; then
    print_status "Frontend: HTTP $FRONTEND"
else
    print_warning "Frontend: HTTP $FRONTEND"
fi

# Test API health
API=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id/api/health)
if [ "$API" = "200" ]; then
    print_status "API Health: HTTP $API"
else
    print_warning "API Health: HTTP $API"
fi

# Test login endpoint
LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://portal.aglis.biz.id/api/auth/login)
if [ "$LOGIN" = "400" ] || [ "$LOGIN" = "422" ]; then
    print_status "Login endpoint: HTTP $LOGIN (expected, no credentials sent)"
elif [ "$LOGIN" = "404" ]; then
    print_warning "Login endpoint: HTTP $LOGIN (not found)"
else
    print_warning "Login endpoint: HTTP $LOGIN"
fi

echo ""
echo "📊 Final Status"
echo "==============="
print_info "Current Nginx configuration:"
sudo grep -A 6 "location /api" /etc/nginx/sites-available/aglis

echo ""
echo "🎯 Test Your Site"
echo "================="
echo "• Frontend: https://portal.aglis.biz.id"
echo "• Login: https://portal.aglis.biz.id/login"
echo "• Registration: https://portal.aglis.biz.id/register"
echo ""
echo "✅ Routing fix completed!"
