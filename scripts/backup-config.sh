#!/bin/bash

#############################################################################
# AGLIS Configuration Backup Script
# 
# Purpose: Backup critical configuration files
# Schedule: Daily at 2 AM (with database backup)
# Retention: 30 days
#############################################################################

# Configuration
BACKUP_DIR="/home/aglis/AGLIS_Tech/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/home/aglis/AGLIS_Tech/logs/backup.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start backup
log "🔄 Starting configuration backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create temporary directory for this backup
TEMP_DIR="$BACKUP_DIR/temp_$DATE"
mkdir -p "$TEMP_DIR"

# Copy configuration files
cp /home/aglis/AGLIS_Tech/backend/.env "$TEMP_DIR/" 2>/dev/null
cp /home/aglis/AGLIS_Tech/backend/config.env "$TEMP_DIR/" 2>/dev/null
cp /home/aglis/AGLIS_Tech/ecosystem.config.js "$TEMP_DIR/" 2>/dev/null
cp /home/aglis/AGLIS_Tech/frontend/.env.production "$TEMP_DIR/" 2>/dev/null
cp /home/aglis/AGLIS_Tech/frontend/.env.local "$TEMP_DIR/" 2>/dev/null

# Create archive
cd "$BACKUP_DIR"
tar -czf "config_$DATE.tar.gz" -C "$TEMP_DIR" .

if [ $? -eq 0 ]; then
    # Get archive size
    SIZE=$(stat -c%s "config_$DATE.tar.gz" 2>/dev/null || stat -f%z "config_$DATE.tar.gz")
    SIZE_KB=$((SIZE / 1024))
    
    log "✅ Configuration backup successful: config_$DATE.tar.gz (${SIZE_KB}KB)"
    
    # Cleanup temp directory
    rm -rf "$TEMP_DIR"
    
    # Delete old backups (>30 days)
    DELETED=$(find "$BACKUP_DIR" -name "config_*.tar.gz" -mtime +30 -delete -print | wc -l)
    if [ $DELETED -gt 0 ]; then
        log "🗑️  Cleaned up $DELETED old config backups"
    fi
    
    # Count total backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/config_*.tar.gz 2>/dev/null | wc -l)
    log "📦 Total config backups: $BACKUP_COUNT"
    
    log "✅ Configuration backup completed"
    exit 0
else
    log "❌ Configuration backup FAILED!"
    rm -rf "$TEMP_DIR"
    exit 1
fi

