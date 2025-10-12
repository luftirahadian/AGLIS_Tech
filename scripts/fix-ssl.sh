#!/bin/bash

# 🔧 AGLIS SSL Certificate Fix Script
# Fix Nginx configuration for SSL

echo "🔧 AGLIS SSL Certificate Fix Script"
echo "=================================="

DOMAIN="portal.aglis.biz.id"

echo "📝 Updating Nginx configuration..."

# Update Nginx config
sudo tee /etc/nginx/sites-available/aglis > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (React build)
    location / {
        root /home/aglis/AGLIS_Tech/frontend/dist;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files (uploads)
    location /uploads {
        alias /home/aglis/AGLIS_Tech/backend/uploads;
    }
}
EOF

echo "✅ Nginx configuration updated"

# Test Nginx config
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    
    # Install SSL certificate
    echo "🔐 Installing SSL certificate..."
    sudo certbot install --cert-name $DOMAIN
    
    echo ""
    echo "🎉 SSL Certificate Fix Complete!"
    echo "================================"
    echo ""
    echo "✅ Your site is now available at:"
    echo "   • https://$DOMAIN"
    echo "   • https://$DOMAIN/login"
    echo "   • https://$DOMAIN/register"
    echo ""
    echo "🔍 Test your site:"
    echo "   curl -I https://$DOMAIN"
    echo ""
else
    echo "❌ Nginx configuration error"
    echo "Please check the configuration manually"
fi
