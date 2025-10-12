# Debug Checklist - Registration Errors

## ❓ **PERTANYAAN UNTUK USER:**

### **1. Apakah Anda SUDAH restart frontend server?**

**Cara restart:**
```bash
# Di terminal yang running npm run dev
Ctrl + C  (stop server)

cd /Users/luftirahadian/AGLIS_Tech/frontend
npm run dev  (start lagi)
```

⚠️ **JIKA BELUM RESTART:** Error masih muncul karena `.env.local` yang baru belum ter-load!

---

### **2. Setelah restart, apakah sudah hard refresh browser?**

**Cara hard refresh:**
- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`  
- Atau: `Ctrl + F5`

⚠️ **JIKA BELUM HARD REFRESH:** Browser masih pakai cache lama!

---

### **3. Check API URL di Browser Console**

**Buka Browser DevTools → Console → Paste code ini:**
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL)
```

**Expected Result (BENAR):**
```
API URL: http://localhost:3001/api  ✅
```

**If you see (SALAH):**
```
API URL: http://192.168.1.44:3001/api  ❌ ← Frontend belum restart!
```

---

### **4. Check Network Requests di Browser**

**Saat klik "Kirim OTP", buka DevTools → Network tab**

**Expected (BENAR):**
```
POST http://localhost:3001/api/registrations/public/request-otp
Status: 200 OK  ✅
```

**If you see (SALAH):**
```
POST http://192.168.1.44:3001/api/...
Status: (failed) atau (pending forever)  ❌ ← Frontend belum restart!
```

---

## 🎯 **VERIFICATION STEPS:**

Sebelum test registration lagi, pastikan:

### ✅ **Checklist Sebelum Test:**

1. **[ ] Frontend server sudah di-stop (Ctrl+C)**
2. **[ ] Frontend server sudah di-start lagi (npm run dev)**
3. **[ ] Browser sudah di-hard refresh (Cmd+Shift+R)**
4. **[ ] API URL di console = localhost** (bukan 192.168.1.44)
5. **[ ] Network requests ke localhost** (bukan 192.168.1.44)

### ✅ **Checklist Saat Test:**

**Step 1 - Kirim OTP:**
- [ ] Fill: Nama, Email, WhatsApp
- [ ] Klik "Kirim OTP"
- [ ] Check DevTools → Network: Request ke **localhost** (✅) atau 192.168.1.44 (❌)?
- [ ] Check Console: Ada "Dev mode OTP: xxxxxx"?
- [ ] Check Toast: Hanya "Kode OTP telah dikirim" (**tidak** ada "Gagal")?

**Step 2 - Alamat:**
- [ ] Fill alamat & kota
- [ ] Klik "Selanjutnya"
- [ ] Berhasil ke Step 3?

**Step 3 - Pilih Paket:**
- [ ] Apakah 4 paket muncul?
- [ ] Bronze, Silver, Gold, Platinum visible?
- [ ] Pilih salah satu
- [ ] Klik "Selanjutnya"
- [ ] Berhasil ke Step 4?

**Step 4 - Konfirmasi:**
- [ ] Data review tampil lengkap?
- [ ] Klik "Daftar Sekarang"
- [ ] Check Network: POST ke localhost?
- [ ] Check Response: success: true?
- [ ] Redirect ke tracking page?

---

## 🚨 **JIKA MASIH ERROR SETELAH RESTART:**

**Kasih tau saya:**

1. **Screenshot** dari:
   - Error message (toast notification)
   - Browser Console (copy all logs)
   - Network tab (request yang failed)
   - Network tab → Response (API response)

2. **Confirm:**
   - [ ] Sudah restart frontend? (Ya/Tidak)
   - [ ] Sudah hard refresh browser? (Ya/Tidak)
   - [ ] API URL di console = localhost? (Ya/Tidak/Tidak tau)
   - [ ] Network request ke localhost? (Ya/Tidak/Tidak tau)

3. **Exact error message:**
   - Di Step mana error terjadi? (1/2/3/4)
   - Apa bunyi exact error message nya?
   - Screenshot error message

---

## 💡 **TIPS:**

**Cara paling mudah verify frontend sudah restart:**

1. **Check timestamp di Vite output:**
   ```
   VITE v5.x.x  ready in 234 ms
   ```
   **Timestamp ini harus BARU** (bukan dari hours ago)

2. **Check di browser:**
   - Hard refresh → Check console → Should see "connecting..." dan "connected"
   - Timestamp log harus baru (bukan dari sebelumnya)

---

## ✅ **SUMMARY:**

**Root Cause:**  
- `.env.local` sudah di-fix ke `localhost`
- Tapi Vite **TIDAK** auto-reload `.env` files
- **WAJIB manual restart server** untuk load config baru

**Solution:**
1. ✅ Stop frontend (Ctrl+C)
2. ✅ Start frontend (npm run dev)
3. ✅ Hard refresh browser (Cmd+Shift+R)
4. ✅ Test lagi

**Seharusnya setelah restart, semua error HILANG! 🎉**

---

**Jika sudah restart tapi masih error, screenshot + detail error nya ya!**

