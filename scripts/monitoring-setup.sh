#!/bin/bash

# 📊 AGLIS Management System - Monitoring Setup Script
# Author: AI Assistant
# Date: $(date)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_USER="aglis"
APP_DIR="/home/$APP_USER/AGLIS_Tech"

echo -e "${BLUE}📊 AGLIS Management System - Monitoring Setup${NC}"
echo -e "${BLUE}============================================${NC}"

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Install additional monitoring tools
echo -e "${YELLOW}📦 Installing monitoring tools...${NC}"
sudo apt install -y htop iotop nethogs netstat-nat jnettop iftop nload

# Install log analysis tools
sudo apt install -y logrotate logwatch

print_status "Monitoring tools installed"

# Create monitoring scripts directory
sudo -u $APP_USER mkdir -p $APP_DIR/scripts/monitoring

# Create system monitoring script
sudo -u $APP_USER tee $APP_DIR/scripts/monitoring/system-monitor.sh > /dev/null << 'EOF'
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
EOF

sudo -u $APP_USER chmod +x $APP_DIR/scripts/monitoring/system-monitor.sh

# Create application health check script
sudo -u $APP_USER tee $APP_DIR/scripts/monitoring/health-check.sh > /dev/null << 'EOF'
#!/bin/bash

# Application Health Check Script
DATE=$(date '+%Y-%m-%d %H:%M:%S')
DOMAIN="yourdomain.com"  # Change this to your domain
HEALTH_LOG="/home/aglis/logs/health-check.log"

echo "=========================================="
echo "AGLIS Health Check - $DATE"
echo "=========================================="

# Function to check HTTP response
check_http() {
    local url=$1
    local expected_status=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo "✅ $url - HTTP $response (OK)"
        return 0
    else
        echo "❌ $url - HTTP $response (Expected: $expected_status)"
        return 1
    fi
}

# Function to check service status
check_service() {
    local service=$1
    local status=$(systemctl is-active "$service")
    
    if [ "$status" = "active" ]; then
        echo "✅ $service - $status"
        return 0
    else
        echo "❌ $service - $status"
        return 1
    fi
}

# Function to check database connection
check_database() {
    local result=$(sudo -u postgres psql -d aglis_production -c "SELECT 1;" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "✅ Database connection - OK"
        return 0
    else
        echo "❌ Database connection - FAILED"
        return 1
    fi
}

echo ""
echo "🌐 APPLICATION HEALTH CHECKS:"
echo "-----------------------------"

# Check main application
check_http "https://$DOMAIN" 200
main_app_status=$?

# Check API endpoint
check_http "https://$DOMAIN/api/health" 200
api_status=$?

# Check login page
check_http "https://$DOMAIN/login" 200
login_status=$?

# Check registration page
check_http "https://$DOMAIN/register" 200
register_status=$?

echo ""
echo "⚙️  SERVICE STATUS:"
echo "-----------------"

check_service "nginx"
nginx_status=$?

check_service "postgresql"
postgres_status=$?

echo ""
echo "🗄️  DATABASE HEALTH:"
echo "------------------"

check_database
db_status=$?

echo ""
echo "📊 PM2 PROCESS STATUS:"
echo "--------------------"

pm2_status=$(sudo -u aglis pm2 status --no-color)
echo "$pm2_status"

# Check if PM2 processes are online
if echo "$pm2_status" | grep -q "online"; then
    echo "✅ PM2 processes - OK"
    pm2_health=0
else
    echo "❌ PM2 processes - ISSUES DETECTED"
    pm2_health=1
fi

echo ""
echo "📈 PERFORMANCE METRICS:"
echo "---------------------"

# CPU Usage
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
echo "CPU Usage: ${cpu_usage}%"

# Memory Usage
memory_usage=$(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')
echo "Memory Usage: $memory_usage"

# Disk Usage
disk_usage=$(df / | tail -1 | awk '{print $5}')
echo "Disk Usage: $disk_usage"

# Load Average
load_avg=$(uptime | awk -F'load average:' '{print $2}')
echo "Load Average:$load_avg"

echo ""
echo "🔒 SECURITY CHECKS:"
echo "------------------"

# Check SSL certificate expiry
ssl_expiry=$(sudo certbot certificates | grep -A2 "yourdomain.com" | grep "Expiry Date" | awk '{print $3, $4}')
if [ -n "$ssl_expiry" ]; then
    echo "✅ SSL Certificate expires: $ssl_expiry"
else
    echo "❌ SSL Certificate check failed"
fi

# Check firewall status
firewall_status=$(sudo ufw status | head -1)
echo "Firewall: $firewall_status"

echo ""
echo "📋 OVERALL HEALTH SUMMARY:"
echo "------------------------"

total_checks=7
failed_checks=0

[ $main_app_status -ne 0 ] && ((failed_checks++))
[ $api_status -ne 0 ] && ((failed_checks++))
[ $nginx_status -ne 0 ] && ((failed_checks++))
[ $postgres_status -ne 0 ] && ((failed_checks++))
[ $db_status -ne 0 ] && ((failed_checks++))
[ $pm2_health -ne 0 ] && ((failed_checks++))

health_percentage=$(( (total_checks - failed_checks) * 100 / total_checks ))

if [ $health_percentage -eq 100 ]; then
    echo "🎉 HEALTH STATUS: EXCELLENT (100%)"
    health_color="\033[0;32m"
elif [ $health_percentage -ge 80 ]; then
    echo "✅ HEALTH STATUS: GOOD ($health_percentage%)"
    health_color="\033[0;32m"
elif [ $health_percentage -ge 60 ]; then
    echo "⚠️  HEALTH STATUS: WARNING ($health_percentage%)"
    health_color="\033[0;33m"
else
    echo "❌ HEALTH STATUS: CRITICAL ($health_percentage%)"
    health_color="\033[0;31m"
fi

echo -e "${health_color}Failed checks: $failed_checks out of $total_checks${NC}"

# Log health check results
echo "$DATE - Health: $health_percentage% - Failed: $failed_checks/$total_checks" >> "$HEALTH_LOG"

echo ""
echo "=========================================="
echo "Health check completed at $(date)"
echo "=========================================="
EOF

sudo -u $APP_USER chmod +x $APP_DIR/scripts/monitoring/health-check.sh

# Create log analysis script
sudo -u $APP_USER tee $APP_DIR/scripts/monitoring/log-analyzer.sh > /dev/null << 'EOF'
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
EOF

sudo -u $APP_USER chmod +x $APP_DIR/scripts/monitoring/log-analyzer.sh

# Create automated monitoring cron jobs
echo -e "${YELLOW}⏰ Setting up automated monitoring...${NC}"

# Add monitoring cron jobs
sudo -u $APP_USER crontab -l 2>/dev/null | { 
    cat; 
    echo "# AGLIS Monitoring Jobs";
    echo "*/5 * * * * $APP_DIR/scripts/monitoring/health-check.sh >> $APP_DIR/logs/health-check.log 2>&1";
    echo "0 */6 * * * $APP_DIR/scripts/monitoring/system-monitor.sh >> $APP_DIR/logs/system-monitor.log 2>&1";
    echo "0 1 * * * $APP_DIR/scripts/monitoring/log-analyzer.sh >> $APP_DIR/logs/log-analysis.log 2>&1";
} | sudo -u $APP_USER crontab -

print_status "Automated monitoring configured"

# Create monitoring dashboard script
sudo -u $APP_USER tee $APP_DIR/scripts/monitoring/dashboard.sh > /dev/null << 'EOF'
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
EOF

sudo -u $APP_USER chmod +x $APP_DIR/scripts/monitoring/dashboard.sh

# Create alerts script
sudo -u $APP_USER tee $APP_DIR/scripts/monitoring/alerts.sh > /dev/null << 'EOF'
#!/bin/bash

# AGLIS Alert System
ALERT_LOG="/home/aglis/logs/alerts.log"
ADMIN_EMAIL="admin@yourdomain.com"  # Change this

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    echo "$(date): [$severity] $message" >> "$ALERT_LOG"
    
    # Send email alert (requires mailutils)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "AGLIS Alert: $severity" "$ADMIN_EMAIL"
    fi
    
    # Log to system log
    logger "AGLIS Alert [$severity]: $message"
}

# Check disk space
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    send_alert "Disk usage is ${disk_usage}% (critical)" "CRITICAL"
elif [ $disk_usage -gt 70 ]; then
    send_alert "Disk usage is ${disk_usage}% (warning)" "WARNING"
fi

# Check memory usage
memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $memory_usage -gt 90 ]; then
    send_alert "Memory usage is ${memory_usage}% (critical)" "CRITICAL"
elif [ $memory_usage -gt 80 ]; then
    send_alert "Memory usage is ${memory_usage}% (warning)" "WARNING"
fi

# Check CPU load
load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | sed 's/^[ \t]*//')
cpu_cores=$(nproc)
if (( $(echo "$load_avg > $cpu_cores" | bc -l) )); then
    send_alert "High CPU load: $load_avg (cores: $cpu_cores)" "WARNING"
fi

# Check application status
if ! sudo -u aglis pm2 status | grep -q "online"; then
    send_alert "PM2 application processes are not all online" "CRITICAL"
fi

# Check nginx status
if ! systemctl is-active --quiet nginx; then
    send_alert "Nginx service is not running" "CRITICAL"
fi

# Check database status
if ! systemctl is-active --quiet postgresql; then
    send_alert "PostgreSQL service is not running" "CRITICAL"
fi

# Check SSL certificate expiry (30 days warning)
ssl_expiry=$(sudo certbot certificates 2>/dev/null | grep -A2 "yourdomain.com" | grep "Expiry Date" | awk '{print $3, $4}')
if [ -n "$ssl_expiry" ]; then
    expiry_date=$(date -d "$ssl_expiry" +%s)
    current_date=$(date +%s)
    days_until_expiry=$(( (expiry_date - current_date) / 86400 ))
    
    if [ $days_until_expiry -lt 30 ] && [ $days_until_expiry -gt 0 ]; then
        send_alert "SSL certificate expires in $days_until_expiry days" "WARNING"
    elif [ $days_until_expiry -lt 0 ]; then
        send_alert "SSL certificate has expired!" "CRITICAL"
    fi
fi

echo "Alert check completed at $(date)"
EOF

sudo -u $APP_USER chmod +x $APP_DIR/scripts/monitoring/alerts.sh

# Add alert cron job (every 15 minutes)
sudo -u $APP_USER crontab -l 2>/dev/null | { 
    cat; 
    echo "*/15 * * * * $APP_DIR/scripts/monitoring/alerts.sh";
} | sudo -u $APP_USER crontab -

print_status "Alert system configured"

echo ""
echo -e "${GREEN}🎉 Monitoring setup completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📊 Available Monitoring Commands:${NC}"
echo -e "   • Live Dashboard: sudo -u $APP_USER $APP_DIR/scripts/monitoring/dashboard.sh"
echo -e "   • System Monitor: sudo -u $APP_USER $APP_DIR/scripts/monitoring/system-monitor.sh"
echo -e "   • Health Check: sudo -u $APP_USER $APP_DIR/scripts/monitoring/health-check.sh"
echo -e "   • Log Analyzer: sudo -u $APP_USER $APP_DIR/scripts/monitoring/log-analyzer.sh"
echo -e "   • Manual Alerts: sudo -u $APP_USER $APP_DIR/scripts/monitoring/alerts.sh"
echo ""
echo -e "${BLUE}📋 Automated Monitoring:${NC}"
echo -e "   • Health checks: Every 5 minutes"
echo -e "   • System monitoring: Every 6 hours"
echo -e "   • Log analysis: Daily at 1 AM"
echo -e "   • Alert checks: Every 15 minutes"
echo -e "   • Database backups: Daily at 2 AM"
echo ""
echo -e "${BLUE}📁 Log Locations:${NC}"
echo -e "   • Health checks: $APP_DIR/logs/health-check.log"
echo -e "   • System monitor: $APP_DIR/logs/system-monitor.log"
echo -e "   • Log analysis: $APP_DIR/logs/log-analysis.log"
echo -e "   • Alerts: $APP_DIR/logs/alerts.log"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo -e "   1. Update domain configuration in monitoring scripts"
echo -e "   2. Configure email alerts (install mailutils if needed)"
echo -e "   3. Test all monitoring scripts"
echo -e "   4. Set up external monitoring (optional)"
echo ""
echo -e "${GREEN}✅ Monitoring system is ready!${NC}"
