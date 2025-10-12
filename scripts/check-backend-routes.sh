#!/bin/bash

# 🔍 Check Backend Routes Script
# Find all available backend routes

echo "🔍 Checking Backend Routes"
echo "=========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "📂 Checking Backend Route Files"
echo "==============================="

print_info "Looking for route definitions in backend..."
cd /home/aglis/AGLIS_Tech/backend

# Find all route files
print_info "Route files found:"
find src/routes -type f -name "*.js" 2>/dev/null

echo ""
echo "📋 Checking server.js for route mounting"
echo "========================================"
print_info "Checking how routes are mounted..."
grep -n "app.use" src/server.js | grep -E "(/api|routes)" | head -20

echo ""
echo "🔍 Testing Common API Endpoints"
echo "==============================="

# Common endpoints to test
ENDPOINTS=(
    "http://localhost:3001/health"
    "http://localhost:3001/api/health"
    "http://localhost:3001/healthcheck"
    "http://localhost:3001/api/healthcheck"
    "http://localhost:3001/api/auth/login"
    "http://localhost:3001/api/tickets"
    "http://localhost:3001/api/customers"
    "http://localhost:3001/api/registrations"
    "http://localhost:3001/api/users"
)

print_info "Testing endpoints..."
for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "400" ]; then
        print_status "$endpoint → HTTP $STATUS"
    else
        echo "  $endpoint → HTTP $STATUS"
    fi
done

echo ""
echo "📊 Backend Environment"
echo "====================="
print_info "Current environment variables:"
grep -E "^PORT|^NODE_ENV|^API_" /home/aglis/AGLIS_Tech/backend/config.env 2>/dev/null | head -10

echo ""
echo "✅ Route check completed!"
