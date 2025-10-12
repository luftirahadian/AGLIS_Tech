#!/bin/bash

# 🔧 Fix Frontend Environment for Production
# Update API URL to use HTTPS

echo "🔧 Fixing Frontend Environment for Production"
echo "============================================="

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

APP_DIR="/home/aglis/AGLIS_Tech"
FRONTEND_DIR="$APP_DIR/frontend"

echo ""
echo "🔍 Step 1: Check Current Environment"
echo "===================================="

print_info "Checking current .env.production..."
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    cat "$FRONTEND_DIR/.env.production"
else
    print_warning ".env.production not found"
fi

echo ""
echo "🔧 Step 2: Check Logo Files"
echo "==========================="

print_info "Checking AGLIS logo files..."

# Check if logo files exist
LOGO_FILES=(
    "$FRONTEND_DIR/public/aglis-logo.svg"
    "$FRONTEND_DIR/public/aglis-logo.png"
    "$FRONTEND_DIR/public/favicon.svg"
)

MISSING_LOGOS=0
for logo in "${LOGO_FILES[@]}"; do
    if [ -f "$logo" ]; then
        print_status "Found: $(basename $logo)"
    else
        print_warning "Missing: $(basename $logo)"
        MISSING_LOGOS=$((MISSING_LOGOS + 1))
    fi
done

if [ $MISSING_LOGOS -gt 0 ]; then
    print_warning "$MISSING_LOGOS logo file(s) missing. You need to upload logo files first."
    print_info "Logo files should be in: $FRONTEND_DIR/public/"
    echo ""
    echo "To upload logos, run on your LOCAL machine:"
    echo "  scp frontend/public/aglis-logo.svg aglis@portal.aglis.biz.id:/home/aglis/AGLIS_Tech/frontend/public/"
    echo "  scp frontend/public/aglis-logo.png aglis@portal.aglis.biz.id:/home/aglis/AGLIS_Tech/frontend/public/"
    echo "  scp frontend/public/favicon.svg aglis@portal.aglis.biz.id:/home/aglis/AGLIS_Tech/frontend/public/"
    echo ""
    read -p "Press Enter to continue after uploading logos, or Ctrl+C to exit..."
fi

echo ""
echo "🔧 Step 3: Create Production Environment"
echo "========================================"

print_info "Creating .env.production with HTTPS API URL..."

# Create .env.production with correct settings
sudo -u aglis tee "$FRONTEND_DIR/.env.production" > /dev/null << 'EOF'
# Production Environment Variables
VITE_API_URL=https://portal.aglis.biz.id/api
VITE_SOCKET_URL=https://portal.aglis.biz.id
NODE_ENV=production
EOF

print_status ".env.production created"

print_info "Contents:"
cat "$FRONTEND_DIR/.env.production"

echo ""
echo "🔧 Step 4: Rebuild Frontend"
echo "==========================="

print_info "Installing dependencies (including build tools)..."
cd "$FRONTEND_DIR"
sudo -u aglis npm install

print_status "Dependencies installed"

print_info "Building frontend for production..."
print_info "This will include AGLIS logo and branding..."
sudo -u aglis npm run build

if [ $? -eq 0 ]; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

echo ""
echo "🔧 Step 5: Verify Build"
echo "======================="

print_info "Checking build output..."
ls -lh "$FRONTEND_DIR/dist/"

print_info "Checking index.html..."
if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    print_status "index.html exists"
else
    print_error "index.html not found"
    exit 1
fi

echo ""
echo "🔧 Step 6: Restart Services"
echo "==========================="

print_info "Reloading Nginx..."
sudo systemctl reload nginx
print_status "Nginx reloaded"

print_info "Clearing browser cache might be needed..."

echo ""
echo "🔧 Step 7: Final Test"
echo "===================="

sleep 2

print_info "Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://portal.aglis.biz.id)
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_status "Frontend accessible: HTTP $FRONTEND_STATUS"
else
    print_warning "Frontend status: HTTP $FRONTEND_STATUS"
fi

echo ""
echo "📊 Summary"
echo "=========="
print_info "Environment file:"
cat "$FRONTEND_DIR/.env.production"

echo ""
echo "🎯 Next Steps"
echo "============"
echo "1. Clear browser cache (Ctrl+Shift+Del)"
echo "2. Hard refresh the page (Ctrl+Shift+R)"
echo "3. Test login at: https://portal.aglis.biz.id/login"
echo ""
echo "✅ Frontend environment fix completed!"
