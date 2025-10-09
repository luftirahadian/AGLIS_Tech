# 🌐 Cara Mengakses Aplikasi dari Perangkat Lain (Bukan Localhost)

---

## 📱 **Skenario Penggunaan**

Panduan ini untuk mengakses aplikasi ISP Technician Management dari:
- **HP Android/iOS** di WiFi yang sama
- **Laptop/Komputer lain** di jaringan yang sama
- **Tablet** di WiFi yang sama

---

## 🔍 **Informasi Penting**

**IP Address Server Anda**: `192.168.121.20`
**Port Backend**: `3001`
**Port Frontend**: `3000`

**URL Akses dari Perangkat Lain**:
```
http://192.168.121.20:3000
```

---

## ✅ **Konfigurasi Sudah Dilakukan (Otomatis)**

Saya sudah mengkonfigurasi:

1. ✅ **Backend bind ke `0.0.0.0`** (semua network interfaces)
2. ✅ **CORS dikonfigurasi** untuk menerima request dari IP lokal
3. ✅ **Frontend dikonfigurasi** untuk listen di `0.0.0.0`

---

## 🚀 **Cara Mengakses (3 Langkah Mudah)**

### **Step 1: Pastikan Backend & Frontend Running**

Backend sudah running dengan konfigurasi network access. Anda bisa lihat di log:
```
🚀 Server running on 0.0.0.0:3001
📡 Local access: http://localhost:3001
🌐 Network access: http://192.168.121.20:3001
```

Frontend juga harus running. Pastikan di terminal frontend menunjukkan:
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.121.20:3000/
```

### **Step 2: Buka Browser di Perangkat Lain**

Dari HP, laptop, atau tablet lain yang **terhubung ke WiFi yang sama**:

1. Buka browser (Chrome, Safari, Firefox, dll)
2. Ketik URL:
   ```
   http://192.168.121.20:3000
   ```
3. Halaman login akan muncul

### **Step 3: Login**

Gunakan kredensial yang sama:
- **Username**: `admin`
- **Password**: `admin123`

---

## 🔥 **PENTING! Jika Tidak Bisa Akses**

### **Masalah 1: Connection Refused atau Cannot Connect**

**Solusi A - Cek Firewall macOS**:

```bash
# Nonaktifkan firewall sementara untuk testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Test akses dari perangkat lain

# Aktifkan kembali firewall setelah testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

**Solusi B - Allow Node.js di Firewall**:

1. Buka **System Preferences** → **Security & Privacy** → **Firewall**
2. Klik ikon gembok (masukkan password)
3. Klik **"Firewall Options..."**
4. Klik tombol **"+"** untuk menambahkan aplikasi
5. Cari dan tambahkan `/usr/local/bin/node` atau path ke Node.js
6. Set ke **"Allow incoming connections"**
7. Klik **OK**

### **Masalah 2: Frontend Connect tapi API Calls Gagal (401/403/CORS Error)**

Frontend perlu tahu API URL yang benar. **Buat file** `frontend/.env.local`:

```bash
cd /Users/luftirahadian/AGLIS_Tech/frontend
cat > .env.local << 'EOF'
VITE_API_URL=http://192.168.121.20:3001
EOF
```

Kemudian **restart frontend**:
```bash
# Stop frontend (Ctrl+C di terminal frontend)
# Jalankan ulang:
npm run dev
```

### **Masalah 3: IP Address Berubah**

Jika IP server berubah (router DHCP renewal), cari IP baru:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Output contoh:
```
inet 192.168.121.20 netmask 0xffffff00 broadcast 192.168.121.255
```

IP baru adalah `192.168.121.20`. Update URL akses sesuai IP baru.

---

## 🧪 **Testing Koneksi**

### **Test 1: Ping Server dari Perangkat Lain**

Dari HP/laptop lain, buka **Terminal** (atau app network tools) dan ping:
```
ping 192.168.121.20
```

Jika berhasil, akan muncul response:
```
PING 192.168.121.20: 56 data bytes
64 bytes from 192.168.121.20: icmp_seq=0 ttl=64 time=2.123 ms
```

### **Test 2: Akses Health Check Endpoint**

Dari browser di perangkat lain, akses:
```
http://192.168.121.20:3001/health
```

Seharusnya muncul JSON:
```json
{
  "status": "OK",
  "timestamp": "2025-10-09T...",
  "uptime": 123.456
}
```

### **Test 3: Akses Frontend**

Dari browser di perangkat lain, akses:
```
http://192.168.121.20:3000
```

Seharusnya muncul halaman login.

---

## 📝 **Catatan Penting**

### **1. WiFi Yang Sama**
Pastikan **semua perangkat terhubung ke WiFi yang sama**. Jika server di WiFi A dan HP di WiFi B, tidak akan bisa akses.

### **2. IP Address Dinamis**
IP `192.168.121.20` bisa berubah jika:
- Router restart
- Mac restart
- DHCP lease expired

**Solusi**: Set static IP di router untuk Mac Anda.

### **3. Keamanan**
Konfigurasi ini untuk **development/testing only**. Untuk production:
- Gunakan HTTPS
- Gunakan domain name (bukan IP)
- Implementasikan firewall yang ketat
- Setup VPN jika akses dari luar jaringan

---

## 🎯 **Quick Reference**

| Item | URL |
|------|-----|
| **Akses Lokal (di Mac)** | `http://localhost:3000` |
| **Akses dari HP/Perangkat Lain** | `http://192.168.121.20:3000` |
| **Backend API** | `http://192.168.121.20:3001` |
| **Health Check** | `http://192.168.121.20:3001/health` |

---

## 📞 **Troubleshooting Checklist**

- [ ] Backend running di terminal 1
- [ ] Frontend running di terminal 2
- [ ] Kedua perangkat terhubung ke WiFi yang sama
- [ ] Firewall macOS tidak memblokir Node.js
- [ ] IP address benar (`192.168.121.20`)
- [ ] File `.env.local` dibuat di frontend (jika API calls gagal)
- [ ] Frontend sudah di-restart setelah membuat `.env.local`

---

## 💡 **Tips**

### **Akses Cepat dari HP**

1. **Scan QR Code**: Buat QR code dari URL `http://192.168.121.20:3000`
2. **Bookmark**: Save URL di browser HP untuk akses cepat
3. **Add to Home Screen**: Di Safari (iOS) atau Chrome (Android), tambahkan ke home screen seperti native app

### **Development dengan Multiple Devices**

Jika sering develop dan test di multiple devices:

1. Buat script `start-network.sh`:
```bash
#!/bin/bash
# Start backend
cd backend && HOST=0.0.0.0 node src/server.js &

# Start frontend
cd frontend && npm run dev &

echo "✅ Server running"
echo "📡 Local: http://localhost:3000"
echo "🌐 Network: http://192.168.121.20:3000"
```

2. Jalankan dengan: `./start-network.sh`

---

## 🔐 **Keamanan untuk Production**

Jika deploy ke production, **JANGAN gunakan konfigurasi ini** secara langsung. Gunakan:

1. **Reverse Proxy** (nginx/Apache)
2. **HTTPS dengan SSL Certificate**
3. **Domain Name** (bukan IP address)
4. **Environment-specific CORS** (whitelist domain tertentu)
5. **Rate Limiting** yang lebih ketat
6. **Authentication yang lebih kuat** (2FA, OAuth, dll)

---

**Selamat mencoba! 🎉**

Jika masih ada masalah, cek konsol browser (F12 → Console) untuk error message dan cek terminal backend untuk CORS errors.

