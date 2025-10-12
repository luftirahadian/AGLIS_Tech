#!/bin/bash

# 🔧 AGLIS Production - Permission Fix Script
# Author: AI Assistant

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_USER="aglis"
APP_DIR="/home/$APP_USER/AGLIS_Tech"

echo -e "${BLUE}🔧 AGLIS Permission Fix Script${NC}"
echo -e "${BLUE}=============================${NC}"

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo privileges"
fi

echo -e "${YELLOW}🔧 Fixing permissions for AGLIS application...${NC}"

# Fix ownership
echo -e "${YELLOW}📁 Fixing directory ownership...${NC}"
chown -R $APP_USER:$APP_USER $APP_DIR
print_status "Directory ownership fixed"

# Fix permissions
echo -e "${YELLOW}🔐 Setting proper permissions...${NC}"
chmod -R 755 $APP_DIR
chmod +x $APP_DIR/scripts/*.sh
print_status "Directory permissions set"

# Fix specific files
echo -e "${YELLOW}📄 Fixing specific file permissions...${NC}"
if [ -f "$APP_DIR/backend/config.env" ]; then
    chmod 600 $APP_DIR/backend/config.env
    print_status "Environment file permissions secured"
fi

if [ -d "$APP_DIR/backend/uploads" ]; then
    chmod 755 $APP_DIR/backend/uploads
    chown -R $APP_USER:$APP_USER $APP_DIR/backend/uploads
    print_status "Upload directory permissions fixed"
fi

if [ -d "$APP_DIR/logs" ]; then
    chmod 755 $APP_DIR/logs
    chown -R $APP_USER:$APP_USER $APP_DIR/logs
    print_status "Log directory permissions fixed"
fi

# Test access as aglis user
echo -e "${YELLOW}🧪 Testing access as aglis user...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo ""
echo "Backend directory:"
ls -la backend/
echo ""
echo "Frontend directory:"
ls -la frontend/
echo ""
echo "✅ Successfully accessed as aglis user"
EOF

print_status "Permission test completed successfully"

echo ""
echo -e "${GREEN}🎉 Permission fix completed successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}📋 What was fixed:${NC}"
echo -e "   • Directory ownership set to aglis:aglis"
echo -e "   • Directory permissions set to 755"
echo -e "   • Script files made executable"
echo -e "   • Environment file secured (600)"
echo -e "   • Upload directory permissions fixed"
echo -e "   • Log directory permissions fixed"
echo ""
echo -e "${BLUE}🔄 Next steps:${NC}"
echo -e "   • Continue with deployment script"
echo -e "   • Or run: sudo -u aglis /home/aglis/AGLIS_Tech/scripts/production-deploy.sh"
echo ""
echo -e "${GREEN}✅ Ready to continue deployment!${NC}"
