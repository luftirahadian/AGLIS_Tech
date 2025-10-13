#!/bin/bash

# Performance Monitoring Script
# Checks if system needs Redis scaling upgrade

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       AGLIS Backend Performance Monitor                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
CPU_INT=${CPU_USAGE%.*}

# Get memory usage
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
MEM_INT=${MEM_USAGE%.*}

# Get backend process info
BACKEND_PID=$(pm2 jlist | jq -r '.[] | select(.name=="aglis-backend") | .pid' | head -1)
BACKEND_CPU=$(ps aux | grep $BACKEND_PID | grep -v grep | awk '{print $3}')
BACKEND_MEM=$(ps aux | grep $BACKEND_PID | grep -v grep | awk '{print $4}')

# Get PM2 info
PM2_INSTANCES=$(pm2 jlist | jq '.[] | select(.name=="aglis-backend")' | jq -s 'length')
PM2_MODE=$(pm2 jlist | jq -r '.[] | select(.name=="aglis-backend") | .pm2_env.exec_mode' | head -1)

# Get active connections (approximate)
ACTIVE_CONNECTIONS=$(netstat -an | grep :3001 | grep ESTABLISHED | wc -l)

echo "📊 Current System Metrics:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "CPU Usage (System):    %s%%\n" "$CPU_INT"
printf "Memory Usage (System): %s%%\n" "$MEM_INT"
printf "Backend CPU:           %s%%\n" "${BACKEND_CPU:-N/A}"
printf "Backend Memory:        %s%%\n" "${BACKEND_MEM:-N/A}"
printf "Active Connections:    %s\n" "$ACTIVE_CONNECTIONS"
printf "PM2 Mode:              %s\n" "$PM2_MODE"
printf "PM2 Instances:         %s\n" "$PM2_INSTANCES"
echo ""

# Recommendations
echo "💡 Recommendations:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEEDS_UPGRADE=0

if [ "$CPU_INT" -gt 70 ]; then
    echo -e "${RED}⚠️  CPU Usage > 70% - Consider upgrading to cluster mode${NC}"
    NEEDS_UPGRADE=1
fi

if [ "$ACTIVE_CONNECTIONS" -gt 300 ]; then
    echo -e "${YELLOW}⚠️  Active connections > 300 - Monitor closely${NC}"
    [ "$ACTIVE_CONNECTIONS" -gt 500 ] && NEEDS_UPGRADE=1
fi

if [ "$PM2_MODE" = "fork_mode" ] && [ "$CPU_INT" -gt 50 ]; then
    echo -e "${YELLOW}ℹ️  Running in fork mode with moderate CPU - Cluster mode would help${NC}"
fi

if [ $NEEDS_UPGRADE -eq 0 ]; then
    echo -e "${GREEN}✅ System performance is good. No immediate upgrade needed.${NC}"
else
    echo ""
    echo -e "${RED}🚀 RECOMMENDATION: Upgrade to Cluster Mode with Redis${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review documentation: cat SOCKET_IO_REDIS_OPTIMIZATION.md"
    echo "2. Install Redis: sudo apt install redis-server"
    echo "3. Follow implementation guide"
fi

echo ""
echo "📈 Historical Data:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run this script regularly and save output to track trends:"
echo "  ./scripts/monitoring/check-performance.sh >> logs/performance-$(date +%Y%m%d).log"
