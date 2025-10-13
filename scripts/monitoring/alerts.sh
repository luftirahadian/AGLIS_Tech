#!/bin/bash

# AGLIS Alert System
ALERT_LOG="/home/aglis/logs/alerts.log"
ADMIN_EMAIL="noc@gapuradigital.co.id"  # Change this

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
