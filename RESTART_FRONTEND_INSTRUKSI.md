# 🚨 INSTRUKSI RESTART FRONTEND - WAJIB DILAKUKAN!

**Tanggal:** 10 Oktober 2025  
**Status:** ⚠️ **CRITICAL - Anda HARUS restart frontend!**

---

## ❌ **KENAPA MASIH ERROR?**

Anda masih dapat error:
- ❌ "Gagal mengirim OTP" 
- ❌ "Validation errors"

**PENYEBAB:**  
File `.env.local` sudah saya ubah dari `192.168.1.44` ke `localhost`, **TAPI** Vite dev server **BELUM** load config yang baru!

**Browser Anda masih pakai config LAMA:**
```env
❌ OLD: VITE_API_URL=http://192.168.1.44:3001/api  (tidak accessible!)
```

**Config yang BARU (sudah di-fix tapi belum ter-load):**
```env
✅ NEW: VITE_API_URL=http://localhost:3001/api  (accessible!)
```

---

## ✅ **SOLUSI: RESTART FRONTEND SERVER**

### **📋 LANGKAH-LANGKAH (Ikuti PERSIS!):**

#### **Step 1: Cari Terminal yang Running Frontend**
- Cari terminal/window yang ada tulisan:
  ```
  VITE v... ready in ...ms
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.44:3000/
  ```

#### **Step 2: Stop Frontend Server**
- Di terminal tersebut, tekan:
  ```
  Ctrl + C  (tahan Ctrl, tekan C)
  ```
- Wait sampai process berhenti (kembali ke prompt `$`)

#### **Step 3: Start Frontend Server Lagi**
- Di terminal yang sama, ketik:
  ```bash
  npm run dev
  ```
- Wait 2-3 detik sampai muncul:
  ```
  VITE v... ready in ...ms
  ➜  Local:   http://localhost:3000/
  ```

#### **Step 4: Hard Refresh Browser**
- **Mac:** `Cmd + Shift + R`
- **Windows/Linux:** `Ctrl + Shift + R`
- Atau: `Ctrl + F5`

#### **Step 5: Test Registration Lagi**
- Buka: `http://localhost:3000/register`
- Fill form Step 1
- Klik "Kirim OTP"
- **✅ Seharusnya TIDAK ada "Gagal mengirim OTP" lagi!**

---

## 🔍 **CARA VERIFY SUDAH BENAR:**

### **Test 1: Check API URL di Browser Console**

Buka Browser DevTools → Console → Ketik:
```javascript
import.meta.env.VITE_API_URL
```

**Expected Result:**
```
"http://localhost:3001/api"  ✅ CORRECT
```

**If you see:**
```
"http://192.168.1.44:3001/api"  ❌ WRONG - Frontend belum restart!
```

### **Test 2: Check Network Requests**

Buka Browser DevTools → Network tab → Klik "Kirim OTP"

**Expected Result:**
```
POST http://localhost:3001/api/registrations/public/request-otp
Status: 200 OK  ✅
Response: { "success": true, "message": "...", "data": { "otp": "..." } }
```

**If you see:**
```
POST http://192.168.1.44:3001/api/...
Status: (failed)  ❌ WRONG - Frontend belum restart!
```

---

## 🎯 **EXPECTED RESULTS (Setelah Restart):**

### **✅ Step 1 - Data Pribadi:**
```
Fill form → Klik "Kirim OTP"
✅ Toast: "Kode OTP telah dikirim ke WhatsApp Anda" (hijau)
✅ Toast: "Dev mode - OTP: xxxxxx" (biru)
❌ NO "Gagal mengirim OTP" (merah) ← Error ini HARUS HILANG!
✅ Console: Dev mode OTP: xxxxxx
```

### **✅ Step 2 - Alamat:**
```
Fill alamat → Klik "Selanjutnya"
✅ Langsung ke Step 3
❌ NO validation errors
```

### **✅ Step 3 - Pilih Paket:**
```
✅ 4 Packages muncul:
   - Home Bronze 30M (Rp 149.900)
   - Home Silver 50M (Rp 199.900)
   - Home Gold 75M (Rp 249.900)
   - Home Platinum 100M (Rp 289900)
✅ Pilih paket → Klik "Selanjutnya"
✅ Langsung ke Step 4
❌ NO validation errors
```

### **✅ Step 4 - Konfirmasi:**
```
✅ Review data tampil lengkap
✅ Klik "Daftar Sekarang"
✅ Toast: "Pendaftaran berhasil!"
✅ Redirect ke tracking page
✅ Database: REG20251010xxx created
❌ NO validation errors
```

---

## ⚠️ **PENTING!**

**Jika Anda SUDAH restart tapi MASIH error:**

1. **Clear Browser Cache:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Atau: Open Incognito/Private Window

2. **Check .env.local sudah benar:**
   ```bash
   cat /Users/luftirahadian/AGLIS_Tech/frontend/.env.local
   ```
   **Harus menunjukkan:**
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Restart Backend juga (optional):**
   ```bash
   # Kill backend
   lsof -ti:3001 | xargs kill -9
   
   # Start backend
   cd /Users/luftirahadian/AGLIS_Tech/backend
   npm start
   ```

---

## 📊 **TROUBLESHOOTING:**

### **Jika masih error setelah restart, kasih tau saya:**

1. **Screenshot** error message yang muncul
2. **Browser Console** log (copy semua text yang merah)
3. **Network tab** → Klik request yang failed → Tab "Response" → Screenshot
4. **Confirm:** Apakah Anda sudah restart frontend? (Ctrl+C kemudian npm run dev)

---

## ✅ **QUICK CHECKLIST:**

- [ ] Frontend server di-stop (Ctrl+C)
- [ ] Frontend server di-start lagi (npm run dev)
- [ ] Browser di-hard refresh (Cmd+Shift+R)
- [ ] Test registration dari Step 1
- [ ] Verify "Gagal mengirim OTP" TIDAK muncul
- [ ] Verify packages muncul di Step 3
- [ ] Test sampai submit final

**Jika semua checklist ✅, seharusnya registration 100% berhasil!** 🚀

---

**Catatan:** Vite **TIDAK** auto-reload environment variables. Server **HARUS** di-restart manual!

