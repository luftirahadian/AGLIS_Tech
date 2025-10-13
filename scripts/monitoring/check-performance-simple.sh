#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "       AGLIS Backend Performance Monitor"
echo "════════════════════════════════════════════════════════════"
echo ""

# Get CPU and Memory
echo "📊 System Metrics:"
echo "────────────────────────────────────────────────────────────"
top -bn1 | grep "Cpu(s)" | awk '{print "CPU Usage: " $2}'
free -h | grep Mem | awk '{print "Memory: " $3 " / " $2 " (" int($3/$2 * 100) "%)"}'
echo ""

# Get PM2 status
echo "🔧 Backend Status:"
echo "────────────────────────────────────────────────────────────"
pm2 list | grep aglis-backend
echo ""

# Get process stats
echo "💻 Backend Process:"
echo "────────────────────────────────────────────────────────────"
ps aux | grep "backend/src/server.js" | grep -v grep | awk '{print "PID: " $2 " | CPU: " $3 "% | Memory: " $4 "%"}'
echo ""

# Active connections
echo "🌐 Network Connections:"
echo "────────────────────────────────────────────────────────────"
CONN=$(ss -tan | grep :3001 | grep ESTAB | wc -l)
echo "Active connections to port 3001: $CONN"
echo ""

# Recommendations
echo "💡 Status:"
echo "────────────────────────────────────────────────────────────"
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'.' -f1)

if [ "$CPU" -gt 70 ]; then
    echo "⚠️  HIGH CPU: Consider upgrading to cluster mode with Redis"
elif [ "$CPU" -gt 50 ]; then
    echo "⚡ MODERATE CPU: Monitor usage, prepare for upgrade if needed"
else
    echo "✅ GOOD: System performance is healthy"
fi

if [ "$CONN" -gt 300 ]; then
    echo "⚠️  HIGH TRAFFIC: $CONN connections (consider scaling)"
else
    echo "✅ NORMAL TRAFFIC: $CONN connections"
fi

echo ""
echo "📖 For upgrade guide, see: SOCKET_IO_REDIS_OPTIMIZATION.md"
echo "════════════════════════════════════════════════════════════"
