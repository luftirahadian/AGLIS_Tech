#!/bin/bash

#############################################################################
# AGLIS Database Backup Script
# 
# Purpose: Automated daily backup of PostgreSQL database
# Schedule: Daily at 2 AM via cron
# Retention: 30 days local, 90 days external
#############################################################################

# Configuration
BACKUP_DIR="/home/aglis/AGLIS_Tech/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="aglis_production"
DB_USER="aglis_user"
DB_PASSWORD="aglis_secure_password_2024"
LOG_FILE="/home/aglis/AGLIS_Tech/logs/backup.log"

# WhatsApp alert configuration
WHATSAPP_TOKEN="NC37Cge5xtzb6zQFwxTg"
ALERT_PHONE="628179380800"

# Ensure log directory exists
mkdir -p "$(dirname $LOG_FILE)"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start backup
log "🔄 Starting database backup..."

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Perform backup
PGPASSWORD="$DB_PASSWORD" pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_DIR/aglis_db_$DATE.sql.gz"

# Check if backup successful
if [ $? -eq 0 ]; then
    # Get backup file size
    SIZE=$(stat -c%s "$BACKUP_DIR/aglis_db_$DATE.sql.gz" 2>/dev/null || stat -f%z "$BACKUP_DIR/aglis_db_$DATE.sql.gz")
    SIZE_MB=$((SIZE / 1024 / 1024))
    
    log "✅ Database backup successful: aglis_db_$DATE.sql.gz (${SIZE_MB}MB)"
    
    # Delete backups older than 30 days
    DELETED=$(find "$BACKUP_DIR" -name "aglis_db_*.sql.gz" -mtime +30 -delete -print | wc -l)
    if [ $DELETED -gt 0 ]; then
        log "🗑️  Cleaned up $DELETED old backups (>30 days)"
    fi
    
    # List current backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/aglis_db_*.sql.gz 2>/dev/null | wc -l)
    log "📦 Total backups stored: $BACKUP_COUNT"
    
    log "✅ Backup process completed successfully"
    exit 0
else
    log "❌ Database backup FAILED!"
    
    # Send WhatsApp alert
    curl -s -X POST "https://api.fonnte.com/send" \
      -H "Authorization: $WHATSAPP_TOKEN" \
      -d "target=$ALERT_PHONE" \
      -d "message=🚨 *ALERT: DATABASE BACKUP FAILED*%0A%0ATime: $(date '+%Y-%m-%d %H:%M:%S')%0ADatabase: $DB_NAME%0A%0APlease check immediately!%0A%0A_AGLIS Backup System_" \
      >> "$LOG_FILE" 2>&1
    
    log "📱 Alert sent to admin"
    exit 1
fi

