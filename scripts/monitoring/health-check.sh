#!/bin/bash

# Application Health Check Script
DATE=$(date '+%Y-%m-%d %H:%M:%S')
DOMAIN="portal.aglis.biz.id"  # Change this to your domain
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
