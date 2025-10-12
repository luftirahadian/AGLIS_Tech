#!/bin/bash

# 🔍 AGLIS 500 Error Debug Script
# Debug frontend 500 error

echo "🔍 AGLIS 500 Error Debug Script"
echo "================================"

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
echo "🔍 Step 1: Check Nginx Error Logs"
echo "================================="
print_info "Recent Nginx errors:"
sudo tail -10 /var/log/nginx/error.log

echo ""
echo "🔍 Step 2: Check Nginx Configuration"
echo "===================================="
print_info "Nginx site configuration:"
sudo cat /etc/nginx/sites-available/aglis

echo ""
echo "🔍 Step 3: Test Backend Endpoints"
echo "================================="
print_info "Testing backend endpoints..."

# Test root endpoint
print_info "Testing http://localhost:3001/"
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
echo "Root endpoint: HTTP $ROOT_STATUS"

# Test API endpoint
print_info "Testing http://localhost:3001/api/"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/)
echo "API endpoint: HTTP $API_STATUS"

# Test health endpoint
print_info "Testing http://localhost:3001/health"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
echo "Health endpoint: HTTP $HEALTH_STATUS"

# Test with verbose output
print_info "Testing backend with verbose output:"
curl -v http://localhost:3001/ 2>&1 | head -20

echo ""
echo "🔍 Step 4: Check Backend Logs"
echo "============================="
print_info "Recent backend logs:"
sudo -u aglis pm2 logs aglis-backend --lines 10

echo ""
echo "🔍 Step 5: Check Frontend Files"
echo "==============================="
print_info "Frontend directory structure:"
ls -la /home/aglis/AGLIS_Tech/frontend/dist/

print_info "Frontend index.html content (first 10 lines):"
head -10 /home/aglis/AGLIS_Tech/frontend/dist/index.html

echo ""
echo "🔍 Step 6: Check Backend Directory"
echo "=================================="
print_info "Backend directory structure:"
ls -la /home/aglis/AGLIS_Tech/backend/

print_info "Backend package.json:"
cat /home/aglis/AGLIS_Tech/backend/package.json | grep -A 5 -B 5 "scripts"

echo ""
echo "🔍 Step 7: Check Environment Variables"
echo "====================================="
print_info "Backend environment:"
sudo -u aglis cat /home/aglis/AGLIS_Tech/backend/config.env

echo ""
echo "🔍 Step 8: Test Direct File Access"
echo "=================================="
print_info "Testing direct file access:"
sudo -u nginx cat /home/aglis/AGLIS_Tech/frontend/dist/index.html > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Nginx can read frontend files"
else
    print_error "Nginx cannot read frontend files"
fi

echo ""
echo "🔍 Step 9: Check Nginx Process User"
echo "==================================="
print_info "Nginx process info:"
ps aux | grep nginx | grep -v grep

echo ""
echo "🔍 Step 10: Check File Permissions"
echo "=================================="
print_info "Frontend file permissions:"
ls -la /home/aglis/AGLIS_Tech/frontend/dist/index.html
ls -la /home/aglis/AGLIS_Tech/frontend/dist/assets/

echo ""
echo "🎯 Summary & Next Steps"
echo "======================="
echo "1. Check the output above for specific errors"
echo "2. Look for permission issues in Nginx logs"
echo "3. Verify backend API endpoints are working"
echo "4. Check if frontend files are properly built"
echo "5. Test with: curl -v https://portal.aglis.biz.id"

echo ""
echo "✅ Debug script completed!"
