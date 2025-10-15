#!/bin/bash

#############################################################################
# AGLIS File Uploads Backup Script
# 
# Purpose: Automated weekly backup of uploaded files
# Schedule: Weekly (Sunday) at 3 AM via cron
# Retention: Current + 90 days of weekly archives
#############################################################################

# Configuration
BACKUP_DIR="/home/aglis/AGLIS_Tech/backups/uploads"
SOURCE_DIR="/home/aglis/AGLIS_Tech/backend/uploads"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/home/aglis/AGLIS_Tech/logs/backup.log"

# WhatsApp alert configuration
WHATSAPP_TOKEN="NC37Cge5xtzb6zQFwxTg"
ALERT_PHONE="628179380800"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start backup
log "🔄 Starting file uploads backup..."

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR/current"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    log "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Sync uploads to current backup
rsync -avz --delete "$SOURCE_DIR/" "$BACKUP_DIR/current/" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    # Get total size
    SIZE=$(du -sh "$BACKUP_DIR/current" | cut -f1)
    FILE_COUNT=$(find "$BACKUP_DIR/current" -type f | wc -l)
    
    log "✅ File sync successful: $FILE_COUNT files, Total size: $SIZE"
    
    # Create weekly archive (if today is Sunday)
    if [ $(date +%u) -eq 7 ]; then
        log "📦 Creating weekly archive..."
        
        tar -czf "$BACKUP_DIR/uploads_weekly_$DATE.tar.gz" -C "$BACKUP_DIR" current/
        
        if [ $? -eq 0 ]; then
            ARCHIVE_SIZE=$(stat -c%s "$BACKUP_DIR/uploads_weekly_$DATE.tar.gz" 2>/dev/null || stat -f%z "$BACKUP_DIR/uploads_weekly_$DATE.tar.gz")
            ARCHIVE_SIZE_MB=$((ARCHIVE_SIZE / 1024 / 1024))
            
            log "✅ Weekly archive created: uploads_weekly_$DATE.tar.gz (${ARCHIVE_SIZE_MB}MB)"
            
            # Delete archives older than 90 days
            DELETED=$(find "$BACKUP_DIR" -name "uploads_weekly_*.tar.gz" -mtime +90 -delete -print | wc -l)
            if [ $DELETED -gt 0 ]; then
                log "🗑️  Cleaned up $DELETED old archives (>90 days)"
            fi
            
            # Count total archives
            ARCHIVE_COUNT=$(ls -1 "$BACKUP_DIR"/uploads_weekly_*.tar.gz 2>/dev/null | wc -l)
            log "📦 Total archives stored: $ARCHIVE_COUNT"
        else
            log "⚠️  Weekly archive creation failed (non-critical)"
        fi
    fi
    
    log "✅ File uploads backup completed"
    exit 0
else
    log "❌ File uploads backup FAILED!"
    
    # Send WhatsApp alert
    curl -s -X POST "https://api.fonnte.com/send" \
      -H "Authorization: $WHATSAPP_TOKEN" \
      -d "target=$ALERT_PHONE" \
      -d "message=🚨 *ALERT: FILE BACKUP FAILED*%0A%0ATime: $(date '+%Y-%m-%d %H:%M:%S')%0ASource: $SOURCE_DIR%0A%0APlease check immediately!%0A%0A_AGLIS Backup System_" \
      >> "$LOG_FILE" 2>&1
    
    log "📱 Alert sent to admin"
    exit 1
fi

