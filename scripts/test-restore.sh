#!/bin/bash

#############################################################################
# AGLIS Backup Restore Test Script
# 
# Purpose: Test restore procedure on test database
# Usage: ./scripts/test-restore.sh [backup_file]
# Note: Creates temporary test database for safety
#############################################################################

# Configuration
DB_NAME="aglis_production"
TEST_DB="aglis_restore_test"
DB_USER="aglis_user"
DB_PASSWORD="aglis_secure_password_2024"
LOG_FILE="/home/aglis/AGLIS_Tech/logs/backup.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get backup file
if [ -z "$1" ]; then
    # Use latest backup
    BACKUP_FILE=$(ls -t /home/aglis/AGLIS_Tech/backups/database/aglis_db_*.sql.gz | head -1)
    log "📁 Using latest backup: $(basename $BACKUP_FILE)"
else
    BACKUP_FILE="$1"
    log "📁 Using specified backup: $(basename $BACKUP_FILE)"
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

log "🔄 Starting restore test..."

# Drop test database if exists
log "🗑️  Dropping test database if exists..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;" >> "$LOG_FILE" 2>&1

# Create test database
log "📦 Creating test database..."
sudo -u postgres psql -c "CREATE DATABASE $TEST_DB;" >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
    log "❌ Failed to create test database"
    exit 1
fi

log "✅ Test database created"

# Restore backup to test database
log "🔄 Restoring backup to test database..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h localhost "$TEST_DB" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "✅ Backup restored successfully to test database"
    
    # Verify data
    log "🔍 Verifying restored data..."
    
    # Count tables
    TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h localhost "$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    # Count users
    USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h localhost "$TEST_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    
    # Count tickets
    TICKET_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h localhost "$TEST_DB" -t -c "SELECT COUNT(*) FROM tickets;" 2>/dev/null | tr -d ' ')
    
    log "📊 Restored database stats:"
    log "   - Tables: $TABLE_COUNT"
    log "   - Users: $USER_COUNT"
    log "   - Tickets: $TICKET_COUNT"
    
    # Cleanup test database
    log "🗑️  Cleaning up test database..."
    sudo -u postgres psql -c "DROP DATABASE $TEST_DB;" >> "$LOG_FILE" 2>&1
    
    log "✅✅✅ RESTORE TEST SUCCESSFUL"
    log "🎉 Backup is valid and can be restored!"
    
    exit 0
else
    log "❌ Restore test FAILED!"
    
    # Cleanup
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;" >> "$LOG_FILE" 2>&1
    
    exit 1
fi

