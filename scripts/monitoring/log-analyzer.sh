#!/bin/bash

# Log Analysis Script
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "=========================================="
echo "AGLIS Log Analyzer - $DATE"
echo "=========================================="

echo ""
echo "📊 NGINX ACCESS LOG ANALYSIS:"
echo "----------------------------"
echo "Top 10 IP addresses:"
sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
echo ""
echo "Top 10 requested URLs:"
sudo awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
echo ""
echo "HTTP Status Codes:"
sudo awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
echo ""
echo "Requests in last hour:"
sudo grep "$(date '+%d/%b/%Y:%H')" /var/log/nginx/access.log | wc -l

echo ""
echo "❌ NGINX ERROR LOG ANALYSIS:"
echo "---------------------------"
echo "Recent errors (last 10):"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No errors found"
echo ""
echo "Error frequency (last 24h):"
sudo grep "$(date '+%Y/%m/%d')" /var/log/nginx/error.log | wc -l

echo ""
echo "⚙️  PM2 APPLICATION LOGS:"
echo "------------------------"
echo "Recent application errors:"
sudo -u aglis pm2 logs --err --lines 10 2>/dev/null || echo "No application errors"
echo ""
echo "Recent application output:"
sudo -u aglis pm2 logs --out --lines 5 2>/dev/null || echo "No recent output"

echo ""
echo "🗄️  DATABASE LOG ANALYSIS:"
echo "-------------------------"
echo "Recent database errors:"
sudo tail -10 /var/log/postgresql/postgresql-*.log 2>/dev/null | grep ERROR || echo "No database errors"

echo ""
echo "🔒 SECURITY LOG ANALYSIS:"
echo "------------------------"
echo "Failed login attempts (last 24h):"
sudo grep "Failed password" /var/log/auth.log | grep "$(date '+%b %d')" | wc -l
echo ""
echo "SSH login attempts:"
sudo grep "sshd" /var/log/auth.log | grep "$(date '+%b %d')" | tail -5

echo ""
echo "📈 SYSTEM PERFORMANCE LOGS:"
echo "--------------------------"
echo "System load history:"
uptime
echo ""
echo "Memory usage history:"
free -h
echo ""
echo "Disk I/O:"
sudo iostat 1 1 2>/dev/null || echo "iostat not available"

echo ""
echo "=========================================="
echo "Log analysis completed at $(date)"
echo "=========================================="
