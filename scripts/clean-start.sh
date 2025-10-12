#!/bin/bash

# 🧹 AGLIS Clean Start Script
# Remove everything and start fresh

echo "🧹 AGLIS Clean Start Script"
echo "=========================="

# Stop PM2 processes
echo "🛑 Stopping PM2 processes..."
sudo -u aglis pm2 stop all 2>/dev/null || true
sudo -u aglis pm2 delete all 2>/dev/null || true

# Remove application directory
echo "🗑️ Removing application directory..."
sudo rm -rf /home/aglis/AGLIS_Tech

# Remove user (optional)
read -p "Remove aglis user? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "👤 Removing aglis user..."
    sudo deluser aglis 2>/dev/null || true
    sudo rm -rf /home/aglis
fi

# Remove database
echo "🗄️ Removing database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS aglis_production;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS aglis_user;" 2>/dev/null || true

# Remove Nginx config
echo "🌐 Removing Nginx config..."
sudo rm -f /etc/nginx/sites-available/aglis
sudo rm -f /etc/nginx/sites-enabled/aglis

# Restart Nginx
sudo systemctl restart nginx

echo ""
echo "✅ Clean start completed!"
echo ""
echo "🚀 Now you can run the deployment script:"
echo "   wget https://raw.githubusercontent.com/luftirahadian/AGLIS_Tech/main/scripts/quick-deploy.sh"
echo "   chmod +x quick-deploy.sh"
echo "   ./quick-deploy.sh"
