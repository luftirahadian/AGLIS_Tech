#!/bin/bash

# 🚀 AGLIS Management System - Fixed Production Deployment Script
# Author: AI Assistant
# Date: $(date)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="aglis"
APP_USER="aglis"
APP_DIR="/home/$APP_USER/AGLIS_Tech"
DOMAIN="yourdomain.com"  # Change this to your domain
DB_NAME="aglis_production"
DB_USER="aglis_user"
DB_PASSWORD="$(openssl rand -base64 32)"  # Generate secure password

echo -e "${BLUE}🚀 AGLIS Management System - Fixed Production Deployment${NC}"
echo -e "${BLUE}====================================================${NC}"

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu. Please use Ubuntu 22.04 LTS."
fi

echo -e "${BLUE}📋 Starting production deployment...${NC}"

# Step 1: System Update
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
print_status "System updated"

# Step 2: Install Essential Packages
echo -e "${YELLOW}📦 Installing essential packages...${NC}"
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib fail2ban ufw htop
print_status "Essential packages installed"

# Step 3: Create Application User
echo -e "${YELLOW}👤 Creating application user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    sudo adduser --disabled-password --gecos "" $APP_USER
    sudo usermod -aG sudo $APP_USER
    print_status "User $APP_USER created"
else
    print_warning "User $APP_USER already exists"
fi

# Step 4: Install Node.js
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
print_status "Node.js $(node --version) installed"

# Step 5: Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2
print_status "PM2 installed"

# Step 6: Configure PostgreSQL
echo -e "${YELLOW}🗄️  Configuring PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
print_status "PostgreSQL configured"

# Step 7: Setup Application Directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

# Copy application files (assuming script is run from project root)
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📂 Copying application files...${NC}"
    sudo cp -r . $APP_DIR/
    sudo chown -R $APP_USER:$APP_USER $APP_DIR
    sudo chmod -R 755 $APP_DIR
    print_status "Application files copied"
else
    print_error "Please run this script from the project root directory where package.json exists"
fi

# Step 8: Install Application Dependencies
echo -e "${YELLOW}📦 Installing application dependencies...${NC}"

# Install backend dependencies
echo -e "${YELLOW}   📦 Installing backend dependencies...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
npm ci --production
echo "Backend dependencies installed"
EOF

# Install frontend dependencies and build
echo -e "${YELLOW}   📦 Installing frontend dependencies...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech/frontend
npm ci --production
npm run build
echo "Frontend built"
EOF

print_status "All dependencies installed and frontend built"

# Step 9: Create Environment Configuration
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

# Step 10: Run Database Migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
npm run migrate
echo "Database migrations completed"
EOF
print_status "Database migrations completed"

# Step 11: Create PM2 Ecosystem
echo -e "${YELLOW}⚙️  Creating PM2 configuration...${NC}"
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

print_status "PM2 configuration created"

# Step 12: Start Application with PM2
echo -e "${YELLOW}🚀 Starting application...${NC}"
sudo -u $APP_USER bash << 'EOF'
cd /home/aglis/AGLIS_Tech
pm2 start ecosystem.config.js
pm2 save
echo "Application started with PM2"
EOF

# Setup PM2 startup
sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

print_status "Application started with PM2"

# Step 13: Configure Nginx
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

# Step 14: Configure Firewall
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432
print_status "Firewall configured"

# Step 15: Setup SSL Certificate (Let's Encrypt)
echo -e "${YELLOW}🔐 Setting up SSL certificate...${NC}"
print_warning "Please make sure your domain $DOMAIN points to this server before proceeding"
read -p "Press Enter when your domain is ready for SSL setup..."

sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
print_status "SSL certificate installed"

# Step 16: Setup Backup Script
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
sudo -u $APP_USER crontab -l 2>/dev/null | { cat; echo "0 2 * * * /home/aglis/backup_db.sh"; } | sudo -u $APP_USER crontab -
print_status "Backup system configured"

# Step 17: Install Monitoring Tools
echo -e "${YELLOW}📊 Installing monitoring tools...${NC}"
sudo -u $APP_USER pm2 install pm2-server-monit
sudo -u $APP_USER pm2 install pm2-logrotate
print_status "Monitoring tools installed"

# Step 18: Create Deployment Script
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

# Final Status
echo -e "${GREEN}🎉 AGLIS Management System Production Deployment Complete!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "   • Application: $APP_NAME"
echo -e "   • User: $APP_USER"
echo -e "   • Directory: $APP_DIR"
echo -e "   • Database: $DB_NAME"
echo -e "   • Domain: $DOMAIN"
echo -e "   • SSL: Enabled"
echo -e "   • Monitoring: PM2 + Logs"
echo -e "   • Backup: Daily automated"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo -e "   • Application: https://$DOMAIN"
echo -e "   • Admin Panel: https://$DOMAIN/login"
echo -e "   • Registration: https://$DOMAIN/register"
echo -e "   • Tracking: https://$DOMAIN/track/[ID]"
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
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "   • Change default passwords"
echo -e "   • Update domain configuration"
echo -e "   • Test all functionality"
echo -e "   • Monitor logs for errors"
echo ""
echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
