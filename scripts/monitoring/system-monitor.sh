#!/bin/bash

# System Resource Monitoring Script
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "=========================================="
echo "AGLIS System Monitor - $DATE"
echo "=========================================="

echo ""
echo "🖥️  SYSTEM RESOURCES:"
echo "-------------------"
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}'
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "Load Average:"
uptime
echo ""

echo "🌐 NETWORK STATUS:"
echo "-----------------"
echo "Active Connections:"
netstat -tuln | grep LISTEN
echo ""
echo "Network Traffic:"
cat /proc/net/dev | head -2
echo ""

echo "🗄️  DATABASE STATUS:"
echo "------------------"
sudo systemctl is-active postgresql
echo "Database Size:"
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('aglis_production'));"
echo "Active Connections:"
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'aglis_production';"
echo ""

echo "⚙️  APPLICATION STATUS:"
echo "---------------------"
echo "PM2 Status:"
sudo -u aglis pm2 status
echo ""
echo "Nginx Status:"
sudo systemctl is-active nginx
echo ""
echo "SSL Certificate:"
sudo certbot certificates
echo ""

echo "📊 LOG SUMMARY:"
echo "--------------"
echo "Recent Nginx Errors:"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No errors"
echo ""
echo "Recent PM2 Errors:"
sudo -u aglis pm2 logs --err --lines 5 2>/dev/null || echo "No errors"
echo ""
echo "System Logs (last 5):"
sudo tail -5 /var/log/syslog
echo ""

echo "🔒 SECURITY STATUS:"
echo "------------------"
echo "Failed Login Attempts:"
sudo grep "Failed password" /var/log/auth.log | tail -5
echo ""
echo "Firewall Status:"
sudo ufw status
echo ""
echo "SSL Certificate Expiry:"
sudo certbot certificates | grep -E "(Certificate Name|Expiry Date)"
echo ""

echo "=========================================="
echo "Monitor completed at $(date)"
echo "=========================================="
