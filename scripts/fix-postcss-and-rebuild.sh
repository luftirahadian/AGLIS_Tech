#!/bin/bash

# 🔧 Fix PostCSS Config and Rebuild Frontend
# Convert ES Module to CommonJS

echo "🔧 Fix PostCSS Config and Rebuild"
echo "================================="

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
print_info "Step 1: Fix PostCSS Config"
echo "=========================="

print_info "Converting postcss.config.js to CommonJS..."

# Backup original
sudo -u aglis cp "$FRONTEND_DIR/postcss.config.js" "$FRONTEND_DIR/postcss.config.js.backup"

# Create CommonJS version
sudo -u aglis tee "$FRONTEND_DIR/postcss.config.js" > /dev/null << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

print_status "PostCSS config updated to CommonJS"

echo ""
print_info "Step 2: Remove NODE_ENV from .env.production"
echo "============================================="

print_info "Creating clean .env.production..."

sudo -u aglis tee "$FRONTEND_DIR/.env.production" > /dev/null << 'EOF'
# Production Environment Variables
VITE_API_URL=https://portal.aglis.biz.id/api
VITE_SOCKET_URL=https://portal.aglis.biz.id
EOF

print_status ".env.production updated (removed NODE_ENV)"

echo ""
print_info "Step 3: Clean and Rebuild"
echo "========================="

cd "$FRONTEND_DIR"

print_info "Cleaning previous build..."
sudo -u aglis rm -rf dist

print_info "Building for production..."
sudo -u aglis NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    print_status "Build successful!"
else
    print_error "Build failed"
    
    print_info "Restoring PostCSS config backup..."
    sudo -u aglis mv "$FRONTEND_DIR/postcss.config.js.backup" "$FRONTEND_DIR/postcss.config.js"
    exit 1
fi

echo ""
print_info "Step 4: Verify Build"
echo "===================="

if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    print_status "Build output verified"
    print_info "Build contents:"
    ls -lh "$FRONTEND_DIR/dist/"
    
    print_info "Checking for AGLIS logo..."
    if [ -f "$FRONTEND_DIR/dist/aglis-logo.svg" ]; then
        print_status "AGLIS logo found in build"
    else
        print_info "Logo will be served from public directory"
    fi
else
    print_error "Build output not found"
    exit 1
fi

echo ""
print_info "Step 5: Reload Nginx"
echo "===================="

sudo systemctl reload nginx
print_status "Nginx reloaded"

echo ""
print_status "🎉 Frontend rebuild completed successfully!"
echo ""
echo "📊 What was fixed:"
echo "  ✅ PostCSS config converted to CommonJS"
echo "  ✅ NODE_ENV removed from .env.production"
echo "  ✅ Frontend built with AGLIS branding"
echo "  ✅ HTTPS API URL configured"
echo ""
echo "🎯 Test your site:"
echo "  https://portal.aglis.biz.id"
echo ""
echo "💡 Tips:"
echo "  • Clear browser cache (Ctrl+Shift+Del)"
echo "  • Hard refresh (Ctrl+Shift+R)"
echo "  • Check logo and branding"
echo "  • Try login with: admin / admin123"
