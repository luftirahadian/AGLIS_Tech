#!/bin/bash

# ISP Technician Management - Network Setup Script
# This script helps configure the application for network access

set -e

echo "🌐 ISP Technician Management - Network Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get local IP address
get_local_ip() {
    local ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    echo "$ip"
}

# Function to detect environment
detect_environment() {
    if [[ -f ".env.production" ]] || [[ "$NODE_ENV" == "production" ]]; then
        echo "production"
    else
        echo "development"
    fi
}

# Main setup function
setup_network() {
    local env=$(detect_environment)
    local local_ip=$(get_local_ip)
    
    echo -e "${BLUE}📋 Environment:${NC} $env"
    echo -e "${BLUE}📡 Local IP:${NC} $local_ip"
    echo ""
    
    if [[ "$env" == "development" ]]; then
        setup_development "$local_ip"
    else
        setup_production
    fi
}

# Setup for development environment
setup_development() {
    local ip=$1
    
    echo -e "${YELLOW}🔧 Setting up DEVELOPMENT environment...${NC}"
    
    # Backend .env
    if [[ ! -f "backend/.env" ]]; then
        echo "Creating backend/.env..."
        cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DB_USER=isp_admin
DB_HOST=localhost
DB_NAME=isp_management
DB_PASSWORD=isp_secure_password_2024
DB_PORT=5432

# JWT
JWT_SECRET=isp_jwt_secret_key_2024_very_secure_and_long
JWT_EXPIRES_IN=7d

# CORS - Development mode (auto-detect local network)
CORS_ORIGIN=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
EOF
    fi
    
    # Frontend .env.local
    echo "Creating frontend/.env.local..."
    cat > frontend/.env.local << EOF
# Auto-detected IP for development
VITE_API_URL=http://$ip:3001/api

# App Configuration
VITE_APP_NAME=ISP Technician Management System
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
EOF
    
    echo -e "${GREEN}✅ Development setup complete!${NC}"
    echo -e "${BLUE}📱 Access from other devices:${NC} http://$ip:3000"
    echo -e "${BLUE}🔗 Backend API:${NC} http://$ip:3001"
    echo ""
    echo -e "${YELLOW}💡 To start the application:${NC}"
    echo "  1. Backend:  cd backend && npm start"
    echo "  2. Frontend: cd frontend && npm run dev"
    echo ""
}

# Setup for production environment
setup_production() {
    echo -e "${YELLOW}🔧 Setting up PRODUCTION environment...${NC}"
    
    echo -e "${BLUE}Please provide the following information:${NC}"
    
    # Get domain from user
    read -p "🌐 Enter your domain (e.g., yourdomain.com): " domain
    
    if [[ -z "$domain" ]]; then
        echo -e "${RED}❌ Domain is required for production setup${NC}"
        exit 1
    fi
    
    # Ask for HTTPS preference
    read -p "🔒 Use HTTPS? (y/n) [y]: " use_https
    use_https=${use_https:-y}
    
    if [[ "$use_https" =~ ^[Yy]$ ]]; then
        protocol="https"
        cors_origin="https://$domain,https://www.$domain"
        api_url="https://$domain/api"
    else
        protocol="http"
        cors_origin="http://$domain,http://www.$domain"
        api_url="http://$domain/api"
    fi
    
    # Backend .env
    echo "Creating backend/.env..."
    cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DB_USER=isp_admin
DB_HOST=localhost
DB_NAME=isp_management
DB_PASSWORD=CHANGE_THIS_PASSWORD_IN_PRODUCTION
DB_PORT=5432

# JWT
JWT_SECRET=CHANGE_THIS_SECRET_IN_PRODUCTION_$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# CORS - Production domains
CORS_ORIGIN=$cors_origin

# Rate Limiting (more restrictive for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
EOF
    
    # Frontend .env.production
    echo "Creating frontend/.env.production..."
    cat > frontend/.env.production << EOF
# Production API URL
VITE_API_URL=$api_url

# App Configuration
VITE_APP_NAME=ISP Technician Management System
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
EOF
    
    echo -e "${GREEN}✅ Production setup complete!${NC}"
    echo -e "${BLUE}🌐 Domain:${NC} $domain"
    echo -e "${BLUE}🔗 Frontend URL:${NC} $protocol://$domain"
    echo -e "${BLUE}🔗 API URL:${NC} $api_url"
    echo ""
    echo -e "${YELLOW}⚠️  Important for production:${NC}"
    echo "  1. Change database password in backend/.env"
    echo "  2. Change JWT secret in backend/.env"
    echo "  3. Setup SSL certificate for HTTPS"
    echo "  4. Configure reverse proxy (nginx/Apache)"
    echo "  5. Setup process manager (PM2)"
    echo ""
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] && [[ ! -d "backend" ]] && [[ ! -d "frontend" ]]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Run setup
setup_network

echo -e "${GREEN}🎉 Network setup completed successfully!${NC}"
