#!/bin/bash

# AGLIS Monitoring Dashboard
clear

while true; do
    echo "=========================================="
    echo "AGLIS MANAGEMENT SYSTEM - LIVE DASHBOARD"
    echo "=========================================="
    echo "Last updated: $(date)"
    echo ""

    # PM2 Status
    echo "⚙️  APPLICATION STATUS:"
    echo "---------------------"
    sudo -u aglis pm2 status --no-color
    echo ""

    # System Resources
    echo "🖥️  SYSTEM RESOURCES:"
    echo "-------------------"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
    echo "Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
    echo "Disk: $(df / | tail -1 | awk '{print $5}')"
    echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
    echo ""

    # Network Status
    echo "🌐 NETWORK STATUS:"
    echo "-----------------"
    echo "Active connections: $(netstat -tuln | grep LISTEN | wc -l)"
    echo "Nginx status: $(sudo systemctl is-active nginx)"
    echo ""

    # Database Status
    echo "🗄️  DATABASE STATUS:"
    echo "------------------"
    echo "PostgreSQL: $(sudo systemctl is-active postgresql)"
    echo "Active connections: $(sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'aglis_production';" -t 2>/dev/null || echo 'N/A')"
    echo ""

    # Recent Errors
    echo "❌ RECENT ERRORS:"
    echo "----------------"
    echo "Nginx errors: $(sudo tail -1 /var/log/nginx/error.log 2>/dev/null | cut -c1-80 || echo 'None')"
    echo "PM2 errors: $(sudo -u aglis pm2 logs --err --lines 1 2>/dev/null | tail -1 | cut -c1-80 || echo 'None')"
    echo ""

    echo "Press Ctrl+C to exit dashboard"
    echo "Auto-refresh in 30 seconds..."
    sleep 30
    clear
done
