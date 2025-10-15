#!/bin/bash

#############################################################################
# AGLIS Backup Verification Script
# 
# Purpose: Verify backup file integrity
# Schedule: Daily at 4 AM (after backups complete)
# Action: Alert if backup missing or corrupted
#############################################################################

# Configuration
BACKUP_DIR="/home/aglis/AGLIS_Tech/backups/database"
LOG_FILE="/home/aglis/AGLIS_Tech/logs/backup.log"

# WhatsApp alert configuration
WHATSAPP_TOKEN="NC37Cge5xtzb6zQFwxTg"
ALERT_PHONE="628179380800"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start verification
log "🔍 Starting backup verification..."

# Find latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/aglis_db_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    log "❌ No backup file found!"
    
    # Send alert
    curl -s -X POST "https://api.fonnte.com/send" \
      -H "Authorization: $WHATSAPP_TOKEN" \
      -d "target=$ALERT_PHONE" \
      -d "message=🚨 *ALERT: NO BACKUP FOUND*%0A%0ATime: $(date '+%Y-%m-%d %H:%M:%S')%0AExpected: Daily database backup%0A%0AAction: Check backup script!%0A%0A_AGLIS Backup System_" \
      >> "$LOG_FILE" 2>&1
    
    exit 1
fi

log "📁 Latest backup: $(basename $LATEST_BACKUP)"

# Check backup age (should be < 25 hours for daily backup)
BACKUP_AGE_HOURS=$((($(date +%s) - $(stat -c%Y "$LATEST_BACKUP" 2>/dev/null || stat -f%m "$LATEST_BACKUP")) / 3600))

if [ $BACKUP_AGE_HOURS -gt 25 ]; then
    log "⚠️  Backup is $BACKUP_AGE_HOURS hours old (expected < 25 hours)"
    
    # Send alert
    curl -s -X POST "https://api.fonnte.com/send" \
      -H "Authorization: $WHATSAPP_TOKEN" \
      -d "target=$ALERT_PHONE" \
      -d "message=🚨 *ALERT: BACKUP TOO OLD*%0A%0ALatest backup: $BACKUP_AGE_HOURS hours old%0AExpected: < 25 hours%0A%0AAction: Check backup cron job!%0A%0A_AGLIS Backup System_" \
      >> "$LOG_FILE" 2>&1
    
    exit 1
fi

log "✅ Backup age OK: $BACKUP_AGE_HOURS hours"

# Check file size (should be > 10KB for database)
SIZE=$(stat -c%s "$LATEST_BACKUP" 2>/dev/null || stat -f%z "$LATEST_BACKUP")
SIZE_KB=$((SIZE / 1024))
SIZE_MB=$((SIZE / 1024 / 1024))

if [ $SIZE -lt 10240 ]; then
    log "❌ Backup file too small: ${SIZE_KB}KB (expected > 10KB)"
    
    # Send alert
    curl -s -X POST "https://api.fonnte.com/send" \
      -H "Authorization: $WHATSAPP_TOKEN" \
      -d "target=$ALERT_PHONE" \
      -d "message=🚨 *ALERT: BACKUP FILE TOO SMALL*%0A%0ASize: ${SIZE_KB}KB%0AExpected: > 10KB%0A%0ABackup may be corrupted!%0A%0A_AGLIS Backup System_" \
      >> "$LOG_FILE" 2>&1
    
    exit 1
fi

if [ $SIZE_MB -gt 0 ]; then
    log "✅ Backup size OK: ${SIZE_MB}MB"
else
    log "✅ Backup size OK: ${SIZE_KB}KB"
fi

# Test gzip integrity
gunzip -t "$LATEST_BACKUP" 2>/dev/null

if [ $? -eq 0 ]; then
    log "✅ Backup file integrity OK (gzip valid)"
else
    log "❌ Backup file corrupted (gzip test failed)!"
    
    # Send alert
    curl -s -X POST "https://api.fonnte.com/send" \
      -H "Authorization: $WHATSAPP_TOKEN" \
      -d "target=$ALERT_PHONE" \
      -d "message=🚨 *ALERT: BACKUP FILE CORRUPTED*%0A%0AFile: $(basename $LATEST_BACKUP)%0AGzip test: FAILED%0A%0AAction: Re-run backup!%0A%0A_AGLIS Backup System_" \
      >> "$LOG_FILE" 2>&1
    
    exit 1
fi

# All checks passed
log "✅✅✅ Backup verification SUCCESSFUL"
log "📊 Backup summary:"
log "   - File: $(basename $LATEST_BACKUP)"
log "   - Size: ${SIZE_MB}MB"
log "   - Age: $BACKUP_AGE_HOURS hours"
log "   - Status: Valid & ready for restore"

exit 0

