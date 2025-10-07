# PostgreSQL Setup Guide untuk macOS
## ISP Technician Management System

Saya melihat kita berada di environment Linux container, tapi Anda menyebutkan menggunakan macOS. Berikut adalah panduan lengkap untuk setup PostgreSQL di **macOS** Anda:

## 🍎 **Setup PostgreSQL di macOS**

### **Step 1: Install Homebrew (jika belum ada)**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### **Step 2: Stop MySQL (jika ada)**
```bash
# Cek status MySQL
brew services list | grep mysql

# Stop MySQL jika berjalan
brew services stop mysql
# atau
sudo launchctl unload -w /Library/LaunchDaemons/com.oracle.oss.mysql.mysqld.plist
```

### **Step 3: Install PostgreSQL**
```bash
# Install PostgreSQL terbaru
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Atau install PostgreSQL versi default
brew install postgresql
brew services start postgresql
```

### **Step 4: Create Database dan User**
```bash
# Masuk ke PostgreSQL sebagai superuser
psql postgres

# Di dalam psql prompt:
CREATE USER isp_admin WITH PASSWORD 'isp_secure_2024';
CREATE DATABASE isp_management OWNER isp_admin;
GRANT ALL PRIVILEGES ON DATABASE isp_management TO isp_admin;

# Enable extensions
\c isp_management
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# Exit psql
\q
```

### **Step 5: Test Koneksi**
```bash
# Test koneksi dengan user baru
psql -h localhost -U isp_admin -d isp_management

# Jika berhasil, Anda akan masuk ke database
# Exit dengan \q
```

### **Step 6: Setup Database Schema**
```bash
# Download file SQL dari repository ini
# Lalu jalankan:
psql -h localhost -U isp_admin -d isp_management -f database/init/01_create_extensions.sql
psql -h localhost -U isp_admin -d isp_management -f database/init/02_create_tables.sql
psql -h localhost -U isp_admin -d isp_management -f database/init/03_create_indexes.sql
psql -h localhost -U isp_admin -d isp_management -f database/init/04_create_triggers.sql
psql -h localhost -U isp_admin -d isp_management -f database/init/05_seed_data.sql
```

## 🐳 **Alternative: Docker Setup (Recommended)**

Jika Anda prefer menggunakan Docker di macOS:

### **Step 1: Install Docker Desktop**
Download dan install Docker Desktop dari: https://www.docker.com/products/docker-desktop/

### **Step 2: Create docker-compose.yml**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: isp_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: isp_management
      POSTGRES_USER: isp_admin
      POSTGRES_PASSWORD: isp_secure_2024
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: isp_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@isp-management.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "8080:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### **Step 3: Start Services**
```bash
# Start PostgreSQL dan PgAdmin
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs postgres
```

### **Step 4: Access Database**
- **psql**: `psql -h localhost -U isp_admin -d isp_management`
- **PgAdmin**: http://localhost:8080 (admin@isp-management.com / admin123)

## 📊 **Database Connection Info**

```yaml
Host: localhost
Port: 5432
Database: isp_management
Username: isp_admin
Password: isp_secure_2024
```

## 🔧 **Useful Commands**

```bash
# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Restart PostgreSQL
brew services restart postgresql@15

# Check PostgreSQL status
brew services list | grep postgres

# Connect to database
psql -h localhost -U isp_admin -d isp_management

# Backup database
pg_dump -h localhost -U isp_admin isp_management > backup.sql

# Restore database
psql -h localhost -U isp_admin -d isp_management < backup.sql
```

## 🎯 **Next Steps**

Setelah PostgreSQL setup berhasil:

1. **Verify Installation**: Test koneksi dan cek tables
2. **Start Phase 1 Development**: Setup Node.js project
3. **Create API Endpoints**: Authentication dan basic CRUD
4. **Setup Frontend**: React/Next.js dashboard

## 🚨 **Troubleshooting**

### **Connection Issues:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgres

# Check port 5432
lsof -i :5432

# Reset PostgreSQL if needed
brew services stop postgresql@15
brew services start postgresql@15
```

### **Permission Issues:**
```bash
# Fix PostgreSQL permissions
sudo chown -R $(whoami) /usr/local/var/postgres
```

### **Database Issues:**
```bash
# Drop and recreate database
psql postgres
DROP DATABASE isp_management;
CREATE DATABASE isp_management OWNER isp_admin;
```

---

**Silakan ikuti panduan di atas di macOS Anda, lalu kita bisa lanjut ke Phase 1 development!** 🚀