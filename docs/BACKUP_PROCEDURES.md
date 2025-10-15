# 💾 BACKUP & RECOVERY PROCEDURES
**AGLIS Management System**

**Last Updated:** October 16, 2025  
**Status:** ✅ OPERATIONAL  
**Backup System Version:** 1.0

---

## 📋 **BACKUP OVERVIEW**

### **What is Backed Up:**
1. ✅ **Database** - PostgreSQL (aglis_production)
2. ✅ **File Uploads** - User uploaded files (tickets, photos, documents)
3. ✅ **Configuration** - Environment variables, configs

### **Backup Schedule:**
- **Database:** Daily at 2:00 AM
- **File Uploads:** Weekly (Sunday) at 3:00 AM
- **Configuration:** Daily at 2:00 AM
- **Verification:** Daily at 4:00 AM

### **Retention Policy:**
- **Database:** 30 days local
- **Files:** Current + 90 days of weekly archives
- **Configuration:** 30 days local

---

## 🔧 **AUTOMATED BACKUP SYSTEM**

### **Backup Scripts Location:**
```
/home/aglis/AGLIS_Tech/scripts/
├── backup-database.sh      - Daily database backup
├── backup-files.sh         - Weekly file uploads backup
├── backup-config.sh        - Daily configuration backup
├── verify-backup.sh        - Daily backup verification
└── test-restore.sh         - Manual restore testing
```

### **Backup Storage Location:**
```
/home/aglis/AGLIS_Tech/backups/
├── database/               - Database backups (.sql.gz)
├── uploads/                - File backups (rsync + weekly .tar.gz)
└── config/                 - Configuration backups (.tar.gz)
```

### **Cron Schedule:**
```bash
# View current schedule
crontab -l | grep "AGLIS Automated Backup"

# Schedule:
0 2 * * *   Database backup (daily at 2 AM)
0 3 * * 0   File backup (Sunday at 3 AM)
0 4 * * *   Verification (daily at 4 AM)
0 2 * * *   Config backup (daily at 2 AM)
```

---

## ✅ **BACKUP VERIFICATION**

### **Automatic Verification:**
- **Runs:** Daily at 4 AM
- **Checks:**
  - ✅ Backup file exists
  - ✅ File age < 25 hours
  - ✅ File size > 10KB
  - ✅ Gzip integrity valid

### **Alert System:**
- **Success:** No alert (logged only)
- **Failure:** WhatsApp alert to admin
- **Channels:** WhatsApp (628179380800)

### **Manual Verification:**
```bash
# Run verification manually
cd /home/aglis/AGLIS_Tech
./scripts/verify-backup.sh

# Check verification logs
tail -20 logs/backup.log
```

---

## 🔄 **RESTORE PROCEDURES**

### **Scenario 1: Restore Latest Backup (Emergency)**

**Steps:**
```bash
# 1. Stop backend services
pm2 stop all

# 2. Find latest backup
ls -lht backups/database/ | head -5

# 3. Restore database
LATEST=$(ls -t backups/database/aglis_db_*.sql.gz | head -1)
gunzip -c $LATEST | sudo -u postgres psql aglis_production

# 4. Restart services
pm2 restart all

# 5. Verify system working
curl http://localhost:3001/api/health
```

**Time to Restore:** 2-5 minutes  
**Downtime:** 2-5 minutes

---

### **Scenario 2: Restore Specific Backup Date**

**Steps:**
```bash
# 1. List available backups
ls -lh backups/database/

# 2. Choose backup (example: October 15, 2025)
BACKUP="backups/database/aglis_db_20251015_020000.sql.gz"

# 3. Stop services
pm2 stop all

# 4. Create database backup first (safety!)
sudo -u postgres pg_dump aglis_production | gzip > /tmp/pre_restore_backup.sql.gz

# 5. Restore chosen backup
gunzip -c $BACKUP | sudo -u postgres psql aglis_production

# 6. Restart & verify
pm2 restart all
curl http://localhost:3001/api/health
```

---

### **Scenario 3: Test Restore (Non-Destructive)**

**Steps:**
```bash
# Restore to test database for verification
cd /home/aglis/AGLIS_Tech
./scripts/test-restore.sh

# Or specify backup file
./scripts/test-restore.sh backups/database/aglis_db_20251015_020000.sql.gz

# Check results in log
tail -30 logs/backup.log
```

**Note:** Test database is automatically cleaned up

---

### **Scenario 4: Restore File Uploads**

**Steps:**
```bash
# 1. Stop backend (to prevent file access during restore)
pm2 stop all

# 2. Restore from current sync
rsync -avz backups/uploads/current/ backend/uploads/

# Or restore from weekly archive
cd backups/uploads
tar -xzf uploads_weekly_20251013_030000.tar.gz
rsync -avz current/ ../../backend/uploads/

# 3. Fix permissions
chown -R aglis:aglis backend/uploads/
chmod -R 755 backend/uploads/

# 4. Restart services
pm2 restart all
```

---

### **Scenario 5: Restore Configuration**

**Steps:**
```bash
# 1. Extract config backup
cd /home/aglis/AGLIS_Tech
tar -xzf backups/config/config_20251015_020000.tar.gz -C /tmp/restore_config/

# 2. Review configs
ls -la /tmp/restore_config/

# 3. Copy needed files
cp /tmp/restore_config/.env backend/.env
cp /tmp/restore_config/config.env backend/config.env

# 4. Restart with new config
pm2 restart all --update-env
```

---

## 🚨 **DISASTER RECOVERY PLAN**

### **Complete System Failure Recovery:**

**Scenario:** Server crashed, need to restore everything

**Time to Recovery:** 30-60 minutes

**Steps:**

**1. Setup New Server (if needed):**
```bash
# Install dependencies
sudo apt update
sudo apt install postgresql redis-server nginx nodejs npm

# Install PM2
npm install -g pm2

# Clone repository
git clone [repository_url] /home/aglis/AGLIS_Tech
```

**2. Restore Database:**
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE aglis_production;"
sudo -u postgres psql -c "CREATE USER aglis_user WITH PASSWORD 'aglis_secure_password_2024';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aglis_production TO aglis_user;"

# Restore latest backup
LATEST=$(ls -t backups/database/aglis_db_*.sql.gz | head -1)
gunzip -c $LATEST | sudo -u postgres psql aglis_production
```

**3. Restore Files:**
```bash
# Restore uploads
rsync -avz backups/uploads/current/ backend/uploads/
chown -R aglis:aglis backend/uploads/
```

**4. Restore Configuration:**
```bash
# Extract and copy configs
LATEST_CONFIG=$(ls -t backups/config/config_*.tar.gz | head -1)
tar -xzf $LATEST_CONFIG -C backend/
```

**5. Start Services:**
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install && npm run build

# Start backend
cd ../backend
pm2 start ecosystem.config.js

# Verify
curl http://localhost:3001/api/health
```

---

## 📊 **BACKUP MONITORING**

### **Check Backup Status:**
```bash
# View backup logs
tail -50 logs/backup.log

# List recent backups
ls -lht backups/database/ | head -10

# Check backup sizes
du -sh backups/*

# Verify latest backup
./scripts/verify-backup.sh
```

### **Backup Health Indicators:**

**✅ Healthy:**
- Daily backups created
- Verification passing
- File sizes reasonable
- No alerts

**⚠️ Warning:**
- Backup size unusual
- Verification warnings
- Disk space < 20%

**🚨 Critical:**
- Backup failed
- Verification failed
- No backup in 25+ hours
- Disk space < 10%

---

## 🔔 **ALERT CONFIGURATION**

### **WhatsApp Alerts:**
**Recipient:** Admin (628179380800)

**Alert Triggers:**
- ❌ Database backup failed
- ❌ File backup failed
- ❌ No backup found
- ❌ Backup too old (>25 hours)
- ❌ Backup file corrupted
- ❌ Backup file too small

**Alert Format:**
```
🚨 *ALERT: [ISSUE]*

Time: [timestamp]
Details: [specific issue]

Action: [recommended action]

_AGLIS Backup System_
```

---

## 🛠️ **MAINTENANCE TASKS**

### **Monthly Tasks:**

**1. Test Full Restore (1st of month):**
```bash
# Run restore test
./scripts/test-restore.sh

# Verify in log
tail -50 logs/backup.log | grep "RESTORE TEST"
```

**2. Review Backup Sizes:**
```bash
# Check growth trend
du -h backups/database/aglis_db_* | tail -30

# Should grow gradually as data increases
```

**3. Cleanup Old Backups (if needed):**
```bash
# Check disk space
df -h

# Manual cleanup if needed (backups older than 30 days already auto-deleted)
find backups/ -name "*.sql.gz" -mtime +30 -ls
```

### **Quarterly Tasks:**

**1. External Backup:**
```bash
# Copy to external storage (USB drive, cloud, etc.)
rsync -avz backups/ /external/drive/aglis_backups/

# Or use rclone for cloud storage
rclone sync backups/ remote:aglis-backups/
```

**2. Disaster Recovery Test:**
- Setup test server
- Full system restore
- Verify functionality
- Document time & issues

---

## 📝 **BACKUP LOGS**

### **Log File Location:**
```
/home/aglis/AGLIS_Tech/logs/backup.log
```

### **Log Rotation:**
```bash
# Logs are automatically rotated by PM2 logrotate
# Keeps last 30 days
```

### **View Logs:**
```bash
# All backup activity
cat logs/backup.log

# Today's backups only
grep "$(date +%Y-%m-%d)" logs/backup.log

# Failed backups
grep "FAILED" logs/backup.log

# Successful backups
grep "SUCCESSFUL" logs/backup.log
```

---

## ⚠️ **TROUBLESHOOTING**

### **Problem: Backup Failed**

**Check:**
```bash
# 1. Check disk space
df -h

# 2. Check database connection
sudo -u postgres psql -c "SELECT NOW();" aglis_production

# 3. Check script permissions
ls -l scripts/backup-*.sh

# 4. Run manually to see error
./scripts/backup-database.sh
```

**Common Solutions:**
- Disk full: Clean up old logs/files
- Permission denied: chmod +x scripts/*.sh
- Database offline: Restart PostgreSQL

---

### **Problem: Verification Failed**

**Check:**
```bash
# 1. Check if backup exists
ls -lh backups/database/

# 2. Test gzip integrity manually
gunzip -t backups/database/aglis_db_*.sql.gz

# 3. Check backup age
stat backups/database/aglis_db_*.sql.gz
```

---

### **Problem: Restore Failed**

**Check:**
```bash
# 1. Test backup file integrity
gunzip -t [backup_file]

# 2. Check database exists
sudo -u postgres psql -l

# 3. Check user permissions
sudo -u postgres psql -c "\du"

# 4. Try restore to test database
./scripts/test-restore.sh
```

---

## 🎯 **BEST PRACTICES**

### **DO:**
- ✅ Test restore monthly
- ✅ Monitor backup logs weekly
- ✅ Keep external backup quarterly
- ✅ Document any restore performed
- ✅ Verify alerts working

### **DON'T:**
- ❌ Delete backups manually (unless disk emergency)
- ❌ Modify backup scripts without testing
- ❌ Ignore backup alerts
- ❌ Restore to production without testing first
- ❌ Forget to stop services before restore

---

## 📞 **EMERGENCY CONTACTS**

**Backup Issues:**
- Check logs: `/home/aglis/AGLIS_Tech/logs/backup.log`
- Alert recipient: Admin (628179380800)
- Escalation: [Add escalation contact]

**Recovery Support:**
- Database: PostgreSQL documentation
- Scripts: This document
- Technical: [Add technical support contact]

---

## ✅ **VERIFICATION CHECKLIST**

### **Daily (Automatic):**
- [ ] Database backup created
- [ ] Config backup created
- [ ] Backups verified
- [ ] No alerts received

### **Weekly (Manual Check):**
- [ ] Review backup logs
- [ ] Check disk space
- [ ] Verify file backup (Sunday)
- [ ] Check backup sizes

### **Monthly (Manual):**
- [ ] Run test restore
- [ ] Review backup growth
- [ ] External backup created
- [ ] Update documentation if needed

### **Quarterly:**
- [ ] Full disaster recovery test
- [ ] Review retention policy
- [ ] Update recovery procedures
- [ ] Train team on procedures

---

## 📊 **BACKUP STATISTICS**

### **Current Status:**
```bash
# Check backup stats
ls -lh backups/database/ | wc -l    # Number of database backups
du -sh backups/                     # Total backup size
df -h | grep backups                # Disk usage
```

### **Expected Growth:**
```
Database: ~1-2MB per day growth
Files: ~50-100MB per week growth
Total: ~500MB per month

Disk Space Needed: 50GB recommended
```

---

## 🎊 **BACKUP SYSTEM STATUS**

**Implemented:** ✅ October 16, 2025  
**Status:** ✅ OPERATIONAL  
**Last Test:** [Date]  
**Last Restore Test:** [Date]  
**Next Review:** [Date]

**Automated:**
- ✅ Daily database backups
- ✅ Weekly file backups
- ✅ Daily verification
- ✅ Alert on failure
- ✅ Auto cleanup old backups

**Manual:**
- Monthly restore testing
- Quarterly external backup
- Disaster recovery drills

---

## 🚀 **QUICK COMMANDS REFERENCE**

```bash
# Manual Backup (anytime)
./scripts/backup-database.sh
./scripts/backup-files.sh
./scripts/backup-config.sh

# Verify Backup
./scripts/verify-backup.sh

# Test Restore (safe)
./scripts/test-restore.sh

# View Logs
tail -50 logs/backup.log

# Check Cron Jobs
crontab -l | grep backup

# Check Backups
ls -lh backups/database/
ls -lh backups/uploads/
ls -lh backups/config/
```

---

**✅ Backup system operational! Data is protected! 💾✨**

