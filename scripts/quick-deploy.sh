#!/bin/bash

# 🚀 AGLIS Quick Deployment Script
# Simple, Fast, No Confusion

set -e

echo "🚀 AGLIS Quick Deployment Script"
echo "================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Don't run as root. Run as regular user with sudo access."
   exit 1
fi

# Install packages
echo "📦 Installing packages..."
sudo apt update
sudo apt install -y curl wget git nginx postgresql postgresql-contrib

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create user
echo "👤 Creating aglis user..."
sudo adduser --disabled-password --gecos "" aglis 2>/dev/null || echo "User exists"
sudo usermod -aG sudo aglis

# Setup PostgreSQL
echo "🗄️ Setting up database..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE aglis_production;
CREATE USER aglis_user WITH PASSWORD 'aglis123';
GRANT ALL PRIVILEGES ON DATABASE aglis_production TO aglis_user;
EOF

# Create app directory
echo "📁 Setting up application..."
sudo rm -rf /home/aglis/AGLIS_Tech
sudo mkdir -p /home/aglis/AGLIS_Tech
sudo chown aglis:aglis /home/aglis/AGLIS_Tech

# Clone repository
sudo -u aglis git clone https://github.com/luftirahadian/AGLIS_Tech.git /home/aglis/AGLIS_Tech

# Install dependencies
echo "📦 Installing dependencies..."
sudo -u aglis bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
npm install --production
cd ../frontend
npm install --production
npm run build
EOF

# Create config
echo "⚙️ Creating config..."
sudo -u aglis bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
cat > config.env << 'CONFIGEOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aglis_production
DB_USER=aglis_user
DB_PASSWORD=aglis123
JWT_SECRET=aglis-secret-key-123
UPLOAD_PATH=./uploads
CORS_ORIGIN=http://yourdomain.com
CONFIGEOF
EOF

# Run migrations
echo "🗄️ Running migrations..."
sudo -u aglis bash << 'EOF'
cd /home/aglis/AGLIS_Tech/backend
npm run migrate
EOF

# Create PM2 config
echo "⚙️ Setting up PM2..."
sudo -u aglis bash << 'EOF'
cd /home/aglis/AGLIS_Tech
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'aglis-backend',
    script: './backend/src/server.js',
    cwd: '/home/aglis/AGLIS_Tech',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
PM2EOF
EOF

# Start application
echo "🚀 Starting application..."
sudo -u aglis pm2 start /home/aglis/AGLIS_Tech/ecosystem.config.js
sudo -u aglis pm2 save

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/aglis > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /home/aglis/AGLIS_Tech/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /home/aglis/AGLIS_Tech/backend/uploads;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/aglis /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Setup firewall
echo "🔒 Setting up firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

echo ""
echo "🎉 AGLIS Deployment Complete!"
echo "============================="
echo ""
echo "✅ Application is running at: http://your-server-ip"
echo "✅ Admin panel: http://your-server-ip/login"
echo "✅ Registration: http://your-server-ip/register"
echo ""
echo "📊 Commands:"
echo "  • Check status: sudo -u aglis pm2 status"
echo "  • View logs: sudo -u aglis pm2 logs"
echo "  • Restart: sudo -u aglis pm2 restart aglis-backend"
echo ""
echo "⚠️  Next steps:"
echo "  1. Update domain in config: nano /home/aglis/AGLIS_Tech/backend/config.env"
echo "  2. Setup SSL: sudo certbot --nginx -d yourdomain.com"
echo "  3. Test the application"
echo ""
echo "🚀 AGLIS is now LIVE!"
