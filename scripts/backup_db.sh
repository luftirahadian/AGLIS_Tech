#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/aglis/backups"
DB_NAME="aglis_production"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U aglis_user $DB_NAME > $BACKUP_DIR/aglis_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/aglis_db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: aglis_db_$DATE.sql.gz"
