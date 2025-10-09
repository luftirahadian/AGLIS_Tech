# 🌐 Panduan Akses dari Jaringan Lokal

Dokumentasi ini menjelaskan cara mengakses aplikasi ISP Technician Management System dari perangkat lain di jaringan yang sama (bukan hanya localhost).

---

## 📋 Informasi Jaringan

**IP Address Server**: `192.168.121.20`
**Backend Port**: `3001`
**Frontend Port**: `3000`

---

## 🔧 Konfigurasi yang Sudah Dilakukan

### 1. **Backend Server Binding**
Server backend sudah dikonfigurasi untuk bind ke semua network interfaces (`0.0.0.0`) sehingga dapat diakses dari perangkat lain di jaringan.

```javascript
// backend/src/server.js
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
});
```

### 2. **CORS Configuration**
Backend sudah dikonfigurasi untuk menerima request dari:
- `http://localhost:3000` (akses lokal)
- `http://127.0.0.1:3000` (akses lokal)
- `http://192.168.x.x:3000` (jaringan lokal 192.168.x.x)
- `http://10.x.x.x:3000` (jaringan lokal 10.x.x.x)
- `http://172.16-31.x.x:3000` (jaringan lokal 172.16-31.x.x)

---

## 🚀 Cara Mengakses dari Perangkat Lain

### **Step 1: Jalankan Backend Server**

```bash
cd /Users/luftirahadian/AGLIS_Tech/backend
node src/server.js
```

Server akan menampilkan:
```
🚀 Server running on 0.0.0.0:3001
📡 Local access: http://localhost:3001
🌐 Network access: http://192.168.121.20:3001
```

### **Step 2: Jalankan Frontend Server**

Untuk mengakses dari perangkat lain, frontend Vite perlu dikonfigurasi untuk accept connections dari network:

```bash
cd /Users/luftirahadian/AGLIS_Tech/frontend
npm run dev -- --host 0.0.0.0
```

Atau tambahkan ke `package.json`:
```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "dev:network": "vite --host 0.0.0.0 --port 3000"
  }
}
```

### **Step 3: Update Frontend Environment Variable**

Buat file `frontend/.env.local`:
```env
VITE_API_URL=http://192.168.121.20:3001
```

**ATAU** untuk development yang fleksibel (auto-detect):
```env
# Gunakan IP lokal untuk akses dari perangkat lain
VITE_API_URL=http://192.168.121.20:3001

# Atau tetap gunakan localhost jika hanya akses dari komputer yang sama
# VITE_API_URL=http://localhost:3001
```

### **Step 4: Restart Frontend**

Setelah membuat `.env.local`, restart frontend:
```bash
# Stop frontend (Ctrl+C)
# Kemudian jalankan ulang:
npm run dev -- --host 0.0.0.0
```

### **Step 5: Akses dari Perangkat Lain**

Dari perangkat lain di jaringan yang sama (HP, laptop lain, tablet), buka browser dan akses:

```
http://192.168.121.20:3000
```

---

## 🔒 Firewall & Security

### **macOS Firewall**

Jika tidak bisa akses, pastikan firewall tidak memblokir:

1. Buka **System Preferences** → **Security & Privacy** → **Firewall**
2. Jika Firewall aktif, klik **"Firewall Options..."**
3. Tambahkan `node` ke daftar allowed applications
4. Atau matikan firewall sementara untuk testing

### **Terminal Command untuk Check Firewall**

```bash
# Cek status firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Nonaktifkan firewall sementara (memerlukan password)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Aktifkan kembali
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

---

## 🧪 Testing Koneksi

### **1. Test Backend Accessible**

Dari perangkat lain, test di browser:
```
http://192.168.121.20:3001/health
```

Seharusnya muncul JSON response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-09T...",
  "uptime": 123.456
}
```

### **2. Test Frontend Accessible**

Dari perangkat lain, buka:
```
http://192.168.121.20:3000
```

Seharusnya muncul halaman login.

### **3. Test dengan curl**

Dari terminal di perangkat server:
```bash
# Test backend dari localhost
curl http://localhost:3001/health

# Test backend dari IP lokal
curl http://192.168.121.20:3001/health
```

Dari perangkat lain di jaringan:
```bash
curl http://192.168.121.20:3001/health
```

---

## ⚙️ Konfigurasi Vite untuk Network Access

Update `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3000,
    strictPort: true,
    // Untuk development dengan IP lokal
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

---

## 📱 Contoh Penggunaan

### **Scenario 1: Akses dari Laptop Lain di WiFi yang Sama**

1. Server (Mac): `192.168.121.20`
2. Client (Laptop lain): Terhubung ke WiFi yang sama
3. Buka browser di client: `http://192.168.121.20:3000`
4. Login dengan: `admin` / `admin123`

### **Scenario 2: Akses dari HP Android/iOS**

1. Pastikan HP terhubung ke WiFi yang sama
2. Buka Chrome/Safari di HP
3. Ketik URL: `http://192.168.121.20:3000`
4. Login seperti biasa

---

## 🐛 Troubleshooting

### **Masalah: "ERR_CONNECTION_REFUSED"**

**Penyebab**:
- Backend server tidak running
- Firewall memblokir port 3001 atau 3000
- IP address salah

**Solusi**:
```bash
# 1. Pastikan backend running
lsof -i :3001

# 2. Pastikan frontend running
lsof -i :3000

# 3. Cek IP address yang benar
ifconfig | grep "inet " | grep -v 127.0.0.1

# 4. Test ping dari perangkat lain
ping 192.168.121.20
```

### **Masalah: "CORS Error" di Browser Console**

**Penyebab**:
- Origin tidak diizinkan di CORS configuration

**Solusi**:
1. Cek console backend untuk log: `🚫 CORS blocked origin: ...`
2. Pastikan IP origin sudah match dengan regex pattern di server.js
3. Atau tambahkan origin spesifik ke `CORS_ORIGIN` environment variable

### **Masalah: Login Berhasil tapi Socket.IO Tidak Terhubung**

**Penyebab**:
- Socket.IO masih connect ke `localhost:3001` instead of IP lokal

**Solusi**:
Update `frontend/.env.local`:
```env
VITE_API_URL=http://192.168.121.20:3001
```

Kemudian restart frontend.

### **Masalah: Frontend Bisa Diakses tapi API Calls Gagal**

**Penyebab**:
- Frontend masih config ke `localhost:3001` instead of IP lokal

**Solusi**:
1. Buat file `frontend/.env.local`
2. Isi dengan: `VITE_API_URL=http://192.168.121.20:3001`
3. Restart frontend

---

## 🔄 Quick Start (Network Access)

### **One-liner Setup**

```bash
# Terminal 1 - Backend
cd /Users/luftirahadian/AGLIS_Tech/backend && HOST=0.0.0.0 PORT=3001 node src/server.js

# Terminal 2 - Frontend (dengan network access)
cd /Users/luftirahadian/AGLIS_Tech/frontend && VITE_API_URL=http://192.168.121.20:3001 npm run dev -- --host 0.0.0.0
```

### **Akses dari Perangkat Lain**

Buka browser dan ketik:
```
http://192.168.121.20:3000
```

---

## 📝 Catatan Penting

1. **IP Address Dinamis**: IP `192.168.121.20` bisa berubah jika router melakukan DHCP renewal. Untuk production, gunakan static IP.

2. **WiFi vs Ethernet**: Pastikan semua perangkat terhubung ke jaringan yang sama (WiFi yang sama atau LAN yang sama).

3. **Keamanan**: Konfigurasi ini untuk development only. Untuk production:
   - Gunakan HTTPS
   - Implementasikan firewall rules yang ketat
   - Gunakan environment-specific CORS configuration
   - Setup reverse proxy (nginx/Apache)

4. **Port Forwarding**: Jika ingin akses dari internet (bukan hanya LAN), perlu setup port forwarding di router.

---

## 🎯 Checklist Access dari Perangkat Lain

- [ ] Backend running dengan `HOST=0.0.0.0`
- [ ] Frontend running dengan `--host 0.0.0.0`
- [ ] File `.env.local` di frontend dengan `VITE_API_URL=http://192.168.121.20:3001`
- [ ] Firewall tidak memblokir port 3000 dan 3001
- [ ] Kedua perangkat terhubung ke WiFi/LAN yang sama
- [ ] Test akses: `http://192.168.121.20:3000`

---

## 📚 Reference

- **Find Your IP**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Check Ports**: `lsof -i :3000` dan `lsof -i :3001`
- **Test Connectivity**: `ping 192.168.121.20` dari perangkat lain
- **Backend Health Check**: `http://192.168.121.20:3001/health`

