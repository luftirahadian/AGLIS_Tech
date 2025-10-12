#!/bin/bash

# 🔧 AGLIS Update Instances Script
# Update PM2 instances count

echo "🔧 AGLIS Update Instances Script"
echo "================================"

# Check current instances
echo "📊 Current PM2 Status:"
sudo -u aglis pm2 status

echo ""
echo "🔍 Current Configuration:"
cat /home/aglis/AGLIS_Tech/ecosystem.config.js | grep -A2 -B2 "instances"

echo ""
read -p "Enter new number of instances (1-8): " INSTANCES

# Validate input
if ! [[ "$INSTANCES" =~ ^[1-8]$ ]]; then
    echo "❌ Invalid input. Please enter a number between 1-8."
    exit 1
fi

echo ""
echo "🔧 Updating instances to $INSTANCES..."

# Update ecosystem config
sudo -u aglis bash << EOF
cd /home/aglis/AGLIS_Tech
sed -i "s/instances: [0-9]*/instances: $INSTANCES/" ecosystem.config.js
echo "✅ Configuration updated"
EOF

# Show updated config
echo ""
echo "📝 Updated Configuration:"
cat /home/aglis/AGLIS_Tech/ecosystem.config.js | grep -A2 -B2 "instances"

# Restart PM2 with new configuration
echo ""
echo "🔄 Restarting PM2 with new configuration..."
sudo -u aglis pm2 restart ecosystem.config.js

# Wait a moment
sleep 3

# Show final status
echo ""
echo "📊 Final PM2 Status:"
sudo -u aglis pm2 status

echo ""
echo "✅ Instances updated to $INSTANCES successfully!"

# Performance info
echo ""
echo "📈 Performance Information:"
echo "• Load balancing across $INSTANCES processes"
echo "• Better CPU utilization"
echo "• Higher availability"
echo "• Memory usage: ~$(($INSTANCES * 72))MB total"
