#!/bin/bash

# 🔍 Check Backend Error Logs
# Debug 500 error on login

echo "🔍 Checking Backend Error Logs"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
print_info "Recent PM2 Logs (Last 50 lines)"
echo "================================"
sudo -u aglis pm2 logs aglis-backend --lines 50 --nostream

echo ""
print_info "PM2 Process Status"
echo "=================="
sudo -u aglis pm2 status

echo ""
print_info "Test Login Endpoint Directly"
echo "============================"
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v 2>&1 | tail -20

echo ""
print_info "Check Database Connection"
echo "========================="
sudo -u postgres psql -d aglis_production -c "SELECT COUNT(*) as user_count FROM users;" 2>&1

echo ""
print_info "Backend Environment"
echo "==================="
sudo -u aglis cat /home/aglis/AGLIS_Tech/backend/config.env | grep -v "PASSWORD"

echo ""
print_info "Next Steps"
echo "=========="
echo "1. Check the logs above for specific errors"
echo "2. Common issues:"
echo "   - Database connection failed"
echo "   - Missing environment variables"
echo "   - Backend not properly started"
echo "3. Try restarting backend:"
echo "   sudo -u aglis pm2 restart aglis-backend"
