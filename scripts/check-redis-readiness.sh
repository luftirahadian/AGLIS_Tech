#!/bin/bash

clear
echo "════════════════════════════════════════════════════════════"
echo "     Redis Optimization Readiness Check"
echo "════════════════════════════════════════════════════════════"
echo ""

READY=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Checking Requirements..."
echo "────────────────────────────────────────────────────────────"

# Check 1: Node.js
echo -n "Node.js version: "
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $NODE_VERSION${NC}"
    READY=$((READY+1))
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check 2: NPM
echo -n "NPM version: "
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $NPM_VERSION${NC}"
    READY=$((READY+1))
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check 3: PM2
echo -n "PM2: "
PM2_VERSION=$(pm2 --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Installed (v$PM2_VERSION)${NC}"
    READY=$((READY+1))
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check 4: Redis
echo -n "Redis Server: "
REDIS_VERSION=$(redis-server --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Already installed${NC}"
    READY=$((READY+1))
else
    echo -e "${YELLOW}✗ Not installed (will be installed)${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# Check 5: Disk Space
echo -n "Disk Space: "
DISK_AVAIL=$(df -h /home/aglis | tail -1 | awk '{print $4}')
echo -e "${GREEN}✓ $DISK_AVAIL available${NC}"
READY=$((READY+1))

# Check 6: Memory
echo -n "Memory: "
MEM_TOTAL=$(free -h | grep Mem | awk '{print $2}')
MEM_AVAIL=$(free -h | grep Mem | awk '{print $7}')
echo -e "${GREEN}✓ $MEM_AVAIL available of $MEM_TOTAL${NC}"
READY=$((READY+1))

# Check 7: CPU Cores
echo -n "CPU Cores: "
CPU_CORES=$(nproc)
echo -e "${GREEN}✓ $CPU_CORES cores${NC}"
READY=$((READY+1))

# Check 8: Sudo Access
echo -n "Sudo Access: "
if sudo -n true 2>/dev/null; then
    echo -e "${GREEN}✓ Available${NC}"
    READY=$((READY+1))
else
    echo -e "${YELLOW}⚠ May require password${NC}"
    WARNINGS=$((WARNINGS+1))
    READY=$((READY+1))
fi

# Check 9: Backend Status
echo -n "Backend Status: "
BACKEND_STATUS=$(pm2 jlist 2>/dev/null | grep -c "aglis-backend")
if [ $BACKEND_STATUS -gt 0 ]; then
    echo -e "${GREEN}✓ Running${NC}"
    READY=$((READY+1))
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check 10: Socket.IO Package
echo -n "Socket.IO Package: "
if [ -f "backend/node_modules/socket.io/package.json" ]; then
    SOCKETIO_VER=$(cat backend/node_modules/socket.io/package.json | grep '"version"' | head -1 | awk -F'"' '{print $4}')
    echo -e "${GREEN}✓ v$SOCKETIO_VER${NC}"
    READY=$((READY+1))
else
    echo -e "${RED}✗ Not found${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "📊 Summary"
echo "════════════════════════════════════════════════════════════"

TOTAL_CHECKS=10
PERCENTAGE=$((READY * 100 / TOTAL_CHECKS))

echo ""
printf "Ready: %d/%d checks passed (%d%%)\n" $READY $TOTAL_CHECKS $PERCENTAGE
[ $WARNINGS -gt 0 ] && printf "Warnings: %d\n" $WARNINGS

echo ""
echo "════════════════════════════════════════════════════════════"

if [ $READY -ge 8 ]; then
    echo -e "${GREEN}✅ SYSTEM READY FOR REDIS OPTIMIZATION${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Review guide: cat SOCKET_IO_REDIS_OPTIMIZATION.md"
    echo "2. Install Redis: sudo apt install redis-server -y"
    echo "3. Follow implementation steps"
    echo ""
    echo "Estimated time: 60-90 minutes"
    echo "Estimated cost: \$0"
elif [ $READY -ge 6 ]; then
    echo -e "${YELLOW}⚠️  MOSTLY READY (Some components missing)${NC}"
    echo ""
    echo "Action required:"
    [ -z "$REDIS_VERSION" ] && echo "- Install Redis Server"
    echo ""
    echo "Fix above issues, then re-run this check."
else
    echo -e "${RED}❌ NOT READY (Critical components missing)${NC}"
    echo ""
    echo "Please ensure:"
    echo "- Node.js and NPM are installed"
    echo "- PM2 is installed"
    echo "- Backend is running"
    echo ""
    echo "Then re-run this check."
fi

echo "════════════════════════════════════════════════════════════"
echo ""

# Create report file
REPORT_FILE="logs/readiness-check-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p logs
{
    echo "Redis Readiness Check Report"
    echo "Generated: $(date)"
    echo "Ready: $READY/$TOTAL_CHECKS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Node.js: $NODE_VERSION"
    echo "NPM: $NPM_VERSION"
    echo "PM2: $PM2_VERSION"
    echo "Redis: ${REDIS_VERSION:-Not installed}"
    echo "Disk: $DISK_AVAIL available"
    echo "Memory: $MEM_AVAIL of $MEM_TOTAL"
    echo "CPU: $CPU_CORES cores"
} > "$REPORT_FILE"

echo "📄 Report saved to: $REPORT_FILE"
echo ""
