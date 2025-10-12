#!/bin/bash

# 🚀 Quick Frontend Rebuild Script
# Fix vite not found error and rebuild

echo "🚀 Quick Frontend Rebuild"
echo "========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

FRONTEND_DIR="/home/aglis/AGLIS_Tech/frontend"

echo ""
print_info "Step 1: Install Dependencies (including Vite)"
echo "=============================================="

cd "$FRONTEND_DIR"
print_info "Running npm install..."
sudo -u aglis npm install

if [ $? -eq 0 ]; then
    print_status "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
print_info "Step 2: Build Frontend"
echo "======================"

print_info "Building for production..."
sudo -u aglis npm run build

if [ $? -eq 0 ]; then
    print_status "Build successful!"
else
    print_error "Build failed"
    exit 1
fi

echo ""
print_info "Step 3: Verify Build"
echo "===================="

if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    print_status "Build output verified"
    ls -lh "$FRONTEND_DIR/dist/"
else
    print_error "Build output not found"
    exit 1
fi

echo ""
print_info "Step 4: Reload Nginx"
echo "===================="

sudo systemctl reload nginx
print_status "Nginx reloaded"

echo ""
print_status "Frontend rebuild completed!"
echo ""
echo "🎯 Test your site:"
echo "  https://portal.aglis.biz.id"
echo ""
echo "Clear browser cache and refresh!"
