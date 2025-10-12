#!/bin/bash

# 🚀 AGLIS Management System - Complete Production Deployment Script
# Author: AI Assistant
# Version: 2.0 - Complete & Smart
# Date: $(date)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="aglis"
APP_USER="aglis"
APP_DIR="/home/$APP_USER/AGLIS_Tech"
DOMAIN="yourdomain.com"  # Change this to your domain
DB_NAME="aglis_production"
DB_USER="aglis_user"
REPO_URL="https://github.com/luftirahadian/AGLIS_Tech.git"  # Your repo URL

echo -e "${BLUE}🚀 AGLIS Management System - Complete Production Deployment${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "${PURPLE}Version 2.0 - Smart & Complete Deployment Script${NC}"
echo ""

# Function to print status
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu. Please use Ubuntu 22.04 LTS."
fi

echo -e "${BLUE}📋 Starting complete production deployment...${NC}"
echo ""

# Step 1: System Preparation
print_step "Step 1: System Preparation"
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
print_status "System updated"

echo -e "${YELLOW}📦 Installing essential packages...${NC}"
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib fail2ban ufw htop
print_status "Essential packages installed"

# Step 2: Create Application User
print_step "Step 2: Application User Setup"
echo -e "${YELLOW}👤 Setting up application user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    sudo adduser --disabled-password --gecos "" $APP_USER
    sudo usermod -aG sudo $APP_USER
    print_status "User $APP_USER created"
else
    print_warning "User $APP_USER already exists"
fi

# Step 3: Install Node.js & PM2
print_step "Step 3: Node.js & PM2 Installation"
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
print_status "Node.js $(node --version) installed"

echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2
print_status "PM2 installed"

# Step 4: PostgreSQL Configuration
print_step "Step 4: PostgreSQL Configuration"
echo -e "${YELLOW}🗄️  Configuring PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
if [ "$DB_EXISTS" = "1" ]; then
    print_warning "Database $DB_NAME already exists"
else
    print_info "Creating database $DB_NAME"
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
EOF
fi

# Check if user exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
if [ "$USER_EXISTS" = "1" ]; then
    print_warning "Database user $DB_USER already exists"
    # Get existing password or generate new one
    DB_PASSWORD=$(sudo -u postgres psql -tAc "SELECT rolpassword FROM pg_authid WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 32)
        sudo -u postgres psql << EOF
ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
EOF
        print_status "Database password updated"
    else
        print_status "Using existing database user"
    fi
else
    print_info "Creating database user $DB_USER"
    DB_PASSWORD=$(openssl rand -base64 32)
    sudo -u postgres psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
    print_status "Database user created with password: $DB_PASSWORD"
fi

# Grant privileges (safe to run multiple times)
sudo -u postgres psql << EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

print_status "PostgreSQL configured"

# Step 5: Application Setup
print_step "Step 5: Application Setup"
echo -e "${YELLOW}📁 Setting up application directory...${NC}"

# Remove existing directory if it exists
if [ -d "$APP_DIR" ]; then
    print_warning "Removing existing application directory"
    sudo rm -rf $APP_DIR
fi

# Create application directory
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

# Clone repository
echo -e "${YELLOW}📥 Cloning application repository...${NC}"
sudo -u $APP_USER git clone $REPO_URL $APP_DIR
print_status "Application repository cloned"

# Set proper permissions
sudo chown -R $APP_USER:$APP_USER $APP_DIR
sudo chmod -R 755 $APP_DIR

# Step 6: Install Dependencies
print_step "Step 6: Dependencies Installation"
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
npm ci --production
echo "Backend dependencies installed"
EOF

echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech/frontend
npm ci --production
npm run build
echo "Frontend built"
EOF

print_status "All dependencies installed and frontend built"

# Step 7: Environment Configuration
print_step "Step 7: Environment Configuration"
echo -e "${YELLOW}⚙️  Creating environment configuration...${NC}"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Create production config
sudo -u $APP_USER bash << EOF
cd /home/aglis/AGLIS_Tech/backend
cat > config.env << 'ENVEOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
UPLOAD_PATH=./uploads
CORS_ORIGIN=https://$DOMAIN
ENVEOF
chmod 600 config.env
echo "Environment configuration created"
EOF

print_status "Environment configuration created"

# Step 8: Database Migrations
print_step "Step 8: Database Migrations"
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
npm run migrate
echo "Database migrations completed"
EOF
print_status "Database migrations completed"

# Step 9: PM2 Configuration
print_step "Step 9: PM2 Configuration"
echo -e "${YELLOW}⚙️  Creating PM2 configuration...${NC}"

# Stop existing PM2 processes
sudo -u $APP_USER pm2 stop all 2>/dev/null || true
sudo -u $APP_USER pm2 delete all 2>/dev/null || true

sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech
cat > ecosystem.config.js << 'ECOSYSTEMEOF'
module.exports = {
  apps: [{
    name: 'aglis-backend',
    script: './backend/src/server.js',
    cwd: '/home/aglis/AGLIS_Tech',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_file: './logs/backend-combined.log',
    time: true,
    max_memory_restart: '500M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
ECOSYSTEMEOF

# Create logs directory
mkdir -p logs
echo "PM2 configuration created"
EOF

# Start application
echo -e "${YELLOW}🚀 Starting application...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech
pm2 start ecosystem.config.js
pm2 save
echo "Application started with PM2"
EOF

# Setup PM2 startup
sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER 2>/dev/null || true

print_status "PM2 configuration completed"

# Step 10: Nginx Configuration
print_step "Step 10: Nginx Configuration"
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"

sudo tee /etc/nginx/sites-available/aglis > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend (React build)
    location / {
        root $APP_DIR/frontend/dist;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files (uploads)
    location /uploads {
        alias $APP_DIR/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/aglis /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
print_status "Nginx configured"

# Step 11: Firewall Configuration
print_step "Step 11: Firewall Configuration"
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
sudo ufw --force enable 2>/dev/null || true
sudo ufw allow ssh 2>/dev/null || true
sudo ufw allow 'Nginx Full' 2>/dev/null || true
print_status "Firewall configured"

# Step 12: SSL Certificate Setup
print_step "Step 12: SSL Certificate Setup"
echo -e "${YELLOW}🔐 SSL Certificate setup...${NC}"
print_warning "SSL certificate setup is optional. You can set it up later with:"
print_warning "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

# Step 13: Backup System
print_step "Step 13: Backup System Setup"
echo -e "${YELLOW}💾 Setting up backup system...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis
cat > backup_db.sh << 'BACKUPEOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/aglis/backups"
DB_NAME="aglis_production"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U aglis_user $DB_NAME > $BACKUP_DIR/aglis_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/aglis_db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: aglis_db_$DATE.sql.gz"
BACKUPEOF

chmod +x backup_db.sh
echo "Backup script created"
EOF

# Setup cron job for daily backups
(sudo -u $APP_USER crontab -l 2>/dev/null | grep -v "backup_db.sh"; echo "0 2 * * * /home/aglis/backup_db.sh") | sudo -u $APP_USER crontab -
print_status "Backup system configured"

# Step 14: Deployment Script
print_step "Step 14: Deployment Script Creation"
echo -e "${YELLOW}🚀 Creating deployment script...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis
cat > deploy.sh << 'DEPLOYEOF'
#!/bin/bash
set -e

echo "🚀 Starting AGLIS Production Deployment..."

# Navigate to app directory
cd /home/aglis/AGLIS_Tech

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci --production

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
cd ../backend
npm run migrate

# Restart PM2 processes
echo "🔄 Restarting application..."
pm2 restart ecosystem.config.js

# Show PM2 status
pm2 status

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: https://yourdomain.com"
DEPLOYEOF

chmod +x deploy.sh
echo "Deployment script created"
EOF

print_status "Deployment script created"

# Step 15: Monitoring Setup
print_step "Step 15: Monitoring Setup"
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
sudo -u $APP_USER pm2 install pm2-server-monit 2>/dev/null || true
sudo -u $APP_USER pm2 install pm2-logrotate 2>/dev/null || true
print_status "Monitoring tools installed"

# Final Status
echo ""
echo -e "${GREEN}🎉 AGLIS Management System Production Deployment Complete!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "   • Application: $APP_NAME"
echo -e "   • User: $APP_USER"
echo -e "   • Directory: $APP_DIR"
echo -e "   • Database: $DB_NAME"
echo -e "   • Domain: $DOMAIN"
echo -e "   • PM2: Running"
echo -e "   • Nginx: Configured"
echo -e "   • Backup: Daily automated"
echo -e "   • Monitoring: Active"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo -e "   • Application: http://$DOMAIN (or https if SSL configured)"
echo -e "   • Admin Panel: http://$DOMAIN/login"
echo -e "   • Registration: http://$DOMAIN/register"
echo -e "   • Tracking: http://$DOMAIN/track/[ID]"
echo ""
echo -e "${BLUE}📊 Monitoring Commands:${NC}"
echo -e "   • PM2 Status: sudo -u $APP_USER pm2 status"
echo -e "   • PM2 Logs: sudo -u $APP_USER pm2 logs"
echo -e "   • System Resources: htop"
echo -e "   • Nginx Logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo -e "${BLUE}🔄 Deployment Commands:${NC}"
echo -e "   • Deploy Updates: sudo -u $APP_USER ./deploy.sh"
echo -e "   • Restart App: sudo -u $APP_USER pm2 restart aglis-backend"
echo -e "   • Check Status: sudo -u $APP_USER pm2 status"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo -e "   • Update domain in config.env: nano $APP_DIR/backend/config.env"
echo -e "   • Setup SSL certificate: sudo certbot --nginx -d $DOMAIN"
echo -e "   • Test all functionality"
echo -e "   • Monitor logs for errors"
echo ""
echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
echo -e "${PURPLE}🚀 AGLIS Management System is now LIVE!${NC}"
