#!/bin/bash

# 🎨 Upload AGLIS Logo Files to Production Server
# Run this script from your LOCAL machine

echo "🎨 Upload AGLIS Logos to Production Server"
echo "=========================================="

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

# Configuration
SERVER="aglis@portal.aglis.biz.id"
REMOTE_DIR="/home/aglis/AGLIS_Tech/frontend/public"
LOCAL_DIR="frontend/public"

echo ""
print_info "This script will upload AGLIS logo files to production server"
print_info "Server: $SERVER"
print_info "Remote directory: $REMOTE_DIR"
echo ""

# Check if running from project root
if [ ! -d "$LOCAL_DIR" ]; then
    print_error "Please run this script from the project root directory"
    print_error "Expected directory: $LOCAL_DIR"
    exit 1
fi

# Check if logo files exist
echo "🔍 Checking logo files..."
echo "========================"

LOGO_FILES=(
    "aglis-logo.svg"
    "aglis-logo.png"
    "favicon.svg"
)

MISSING_FILES=0
for logo in "${LOGO_FILES[@]}"; do
    if [ -f "$LOCAL_DIR/$logo" ]; then
        print_status "Found: $logo"
    else
        print_error "Missing: $logo"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    print_error "$MISSING_FILES logo file(s) missing!"
    exit 1
fi

echo ""
echo "📤 Uploading logo files..."
echo "=========================="

for logo in "${LOGO_FILES[@]}"; do
    print_info "Uploading $logo..."
    scp "$LOCAL_DIR/$logo" "$SERVER:$REMOTE_DIR/"
    
    if [ $? -eq 0 ]; then
        print_status "$logo uploaded successfully"
    else
        print_error "Failed to upload $logo"
        exit 1
    fi
done

echo ""
echo "🔧 Setting permissions..."
echo "========================"

print_info "Setting correct ownership and permissions on server..."
ssh "$SERVER" "sudo chown aglis:aglis $REMOTE_DIR/aglis-logo.* $REMOTE_DIR/favicon.svg && sudo chmod 644 $REMOTE_DIR/aglis-logo.* $REMOTE_DIR/favicon.svg"

if [ $? -eq 0 ]; then
    print_status "Permissions set successfully"
else
    print_warning "Failed to set permissions, but files are uploaded"
fi

echo ""
echo "✅ Logo Upload Complete!"
echo "======================="
print_info "All AGLIS logo files have been uploaded to the server"
echo ""
echo "🎯 Next Steps:"
echo "============="
echo "1. SSH to the server:"
echo "   ssh $SERVER"
echo ""
echo "2. Run the frontend rebuild script:"
echo "   cd ~/AGLIS_Tech/scripts"
echo "   sudo ./fix-frontend-env.sh"
echo ""
echo "3. The script will rebuild frontend with AGLIS branding"
echo ""
print_status "Done!"
