# 🧪 Customer Portal Testing Guide

**Quick guide untuk testing customer portal**

---

## 🚀 **QUICK ACCESS**

**Portal URL:** https://portal.aglis.biz.id/customer/login

---

## 📋 **TESTING CHECKLIST**

### **1. Login & Authentication** 🔐

**Test Case 1.1: Login dengan WhatsApp OTP**
```
Steps:
1. Buka: https://portal.aglis.biz.id/customer/login
2. Masukkan nomor WhatsApp customer (format: 08xxx)
3. Klik "Kirim Kode OTP"
4. Buka WhatsApp, tunggu pesan OTP
5. Copy kode 6 digit
6. Paste ke form OTP
7. Klik "Login"

Expected Result:
✅ OTP diterima di WhatsApp dalam 10 detik
✅ Login berhasil
✅ Redirect ke /customer/dashboard
✅ Token tersimpan 7 hari
```

**Test Case 1.2: OTP Invalid**
```
Steps:
1. Login sampai step OTP
2. Masukkan kode salah (123456)
3. Klik "Login"

Expected Result:
❌ Error: "Kode OTP salah atau sudah expired"
```

---

### **2. Dashboard** 📊

**Test Case 2.1: View Dashboard**
```
Steps:
1. Login berhasil
2. Otomatis redirect ke dashboard

Expected Result:
✅ Tampil stats:
   - Active tickets
   - Completed tickets
   - Pending invoices
   - Outstanding amount
✅ Tampil customer info (nama, package, dll)
✅ Tampil recent tickets (max 5)
✅ Quick action buttons kerja
```

**Test Case 2.2: Navigation**
```
Steps:
1. Di dashboard, klik menu:
   - "Tiket Saya"
   - "Invoice"
   - "Profil"
   - "FAQ"

Expected Result:
✅ Semua menu navigasi bekerja
✅ Active state highlight
✅ Content muncul sesuai menu
```

---

### **3. Invoice Management** 💳

**Test Case 3.1: View All Invoices**
```
Steps:
1. Klik menu "Invoice"
2. Lihat daftar invoice

Expected Result:
✅ Tampil semua invoice customer
✅ Tampil: invoice number, date, amount, status
✅ Status badge warna sesuai (paid=green, pending=yellow, overdue=red)
```

**Test Case 3.2: Filter Invoice**
```
Steps:
1. Di halaman Invoice
2. Klik filter "Pending"
3. Klik filter "Paid"
4. Klik filter "Overdue"

Expected Result:
✅ Invoice terfilter sesuai status
✅ Filter button active state berubah
```

---

### **4. Ticket Management** 🎫

**Test Case 4.1: View All Tickets**
```
Steps:
1. Klik menu "Tiket Saya"
2. Lihat daftar tiket

Expected Result:
✅ Tampil semua tiket customer
✅ Tampil: ticket number, status, priority, title, description
✅ Status & priority badge warna sesuai
✅ Technician name (jika sudah assigned)
```

**Test Case 4.2: Create New Ticket**
```
Steps:
1. Klik "Buat Tiket Baru"
2. Isi form:
   - Jenis: "Perbaikan (Repair)"
   - Judul: "Internet lambat"
   - Deskripsi: "Kecepatan turun drastis sejak kemarin"
   - Priority: "Normal"
3. Klik "Buat Tiket"

Expected Result:
✅ Modal close
✅ Toast success: "Tiket berhasil dibuat!"
✅ WhatsApp notification diterima
✅ Tiket muncul di list
✅ Ticket number auto-generated
```

**Test Case 4.3: Filter Tickets**
```
Steps:
1. Di halaman Tiket
2. Klik filter "Open"
3. Klik filter "In Progress"
4. Klik filter "Completed"

Expected Result:
✅ Tiket terfilter sesuai status
```

---

### **5. Profile Management** 👤

**Test Case 5.1: View Profile**
```
Steps:
1. Klik menu "Profil"
2. Lihat info profil

Expected Result:
✅ Tampil customer info:
   - Customer ID (read-only)
   - Nama (read-only)
   - WhatsApp
   - Email
   - Alamat
   - City/Province
✅ Tampil service info:
   - Package name
   - Bandwidth
   - Monthly price
   - Account status
```

**Test Case 5.2: Edit Profile**
```
Steps:
1. Klik "Edit Profil"
2. Ubah email: test@example.com
3. Ubah alamat: Jl. Test No. 123
4. Klik "Simpan Perubahan"

Expected Result:
✅ Modal edit mode
✅ Form editable
✅ Save berhasil
✅ Toast success
✅ Data terupdate
✅ Kembali ke view mode
```

---

### **6. FAQ & Knowledge Base** 📚

**Test Case 6.1: View FAQ**
```
Steps:
1. Klik menu "FAQ"
2. Lihat semua kategori

Expected Result:
✅ Tampil 5 kategori:
   - Umum
   - Pembayaran & Invoice
   - Teknis & Gangguan
   - Akun & Keamanan
   - Instalasi & Pemasangan
✅ Setiap kategori ada beberapa FAQ
```

**Test Case 6.2: Search FAQ**
```
Steps:
1. Di halaman FAQ
2. Ketik di search: "pembayaran"
3. Enter

Expected Result:
✅ Hasil filter sesuai keyword
✅ Hanya FAQ yang match
```

**Test Case 6.3: Expand FAQ**
```
Steps:
1. Klik FAQ question
2. Klik lagi untuk collapse

Expected Result:
✅ Answer expand
✅ Chevron icon rotate
✅ Re-click collapse
```

---

### **7. Logout** 🚪

**Test Case 7.1: Logout**
```
Steps:
1. Klik tombol "Logout" di header
2. Confirm

Expected Result:
✅ Toast: "Logout berhasil"
✅ Redirect ke /customer/login
✅ Token cleared dari localStorage
✅ Tidak bisa akses portal tanpa login ulang
```

---

## 🔍 **TESTING WITH REAL DATA**

### **Gunakan Customer Existing:**

**Cara mendapatkan customer untuk testing:**
```sql
-- Pilih customer existing
SELECT id, customer_id, name, phone, email 
FROM customers 
WHERE account_status = 'active'
LIMIT 5;
```

**Set portal_active = TRUE:**
```sql
UPDATE customers 
SET portal_active = TRUE 
WHERE id = <customer_id>;
```

**Test login dengan nomor WhatsApp customer tersebut**

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue 1: OTP tidak diterima**
```
Possible Causes:
- WhatsApp service down
- Nomor tidak terdaftar
- Token Fonnte expired

Fix:
1. Cek PM2 logs: pm2 logs
2. Cek WhatsApp service status
3. Test dengan nomor valid
```

### **Issue 2: Login berhasil tapi redirect error**
```
Possible Cause:
- Frontend routing issue

Fix:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check console errors
```

### **Issue 3: Stats tidak muncul**
```
Possible Cause:
- API endpoint error
- Database query issue

Fix:
1. Check browser console
2. Check PM2 logs
3. Verify customer_id in database
```

---

## 📊 **EXPECTED BEHAVIOR SUMMARY**

### **Authentication:**
- ✅ OTP sent in <10 seconds
- ✅ OTP valid for 10 minutes
- ✅ Token valid for 7 days
- ✅ Auto logout after 7 days

### **Performance:**
- ✅ Page load < 3 seconds
- ✅ API response < 500ms
- ✅ Smooth transitions
- ✅ No console errors

### **Mobile Responsive:**
- ✅ Works on mobile devices
- ✅ Touch-friendly buttons
- ✅ Readable fonts
- ✅ Proper spacing

---

## ✅ **VERIFICATION CHECKLIST**

Before declaring testing complete:

**Functionality:**
- [ ] Login dengan OTP works
- [ ] Dashboard loads with correct data
- [ ] All menu navigation works
- [ ] Invoice list displays
- [ ] Invoice filter works
- [ ] Ticket list displays
- [ ] Create ticket works
- [ ] Ticket filter works
- [ ] Profile view works
- [ ] Profile edit & save works
- [ ] FAQ displays all categories
- [ ] FAQ search works
- [ ] FAQ accordion works
- [ ] Logout works
- [ ] WhatsApp notifications sent

**UI/UX:**
- [ ] Design consistent
- [ ] Colors correct (blue/green)
- [ ] Icons display properly
- [ ] Loading states show
- [ ] Error messages clear
- [ ] Success toasts appear
- [ ] Mobile responsive
- [ ] No layout breaks

**Security:**
- [ ] Only own data visible
- [ ] Cannot access other customer data
- [ ] Token expires after 7 days
- [ ] Logout clears token
- [ ] OTP expires after 10 minutes

---

## 🎯 **QUICK TEST SCRIPT**

**5-Minute Smoke Test:**
```
1. Login (1 min)
   ✓ Enter phone → Receive OTP → Login

2. Dashboard (30 sec)
   ✓ View stats → Check customer info

3. Create Ticket (1 min)
   ✓ Click Buat Tiket → Fill form → Submit

4. View Invoice (30 sec)
   ✓ Navigate → View list → Filter

5. Edit Profile (1 min)
   ✓ Click Edit → Change email → Save

6. FAQ (30 sec)
   ✓ View → Search → Expand

7. Logout (30 sec)
   ✓ Click Logout → Verify redirect
```

**If all 7 steps pass → ✅ Portal is working!**

---

## 📞 **SUPPORT**

**If you encounter issues:**
- Check browser console (F12)
- Check PM2 logs: `pm2 logs`
- Check database connection
- Verify environment variables

**Documentation:**
- Full guide: CUSTOMER_PORTAL_COMPLETE.md
- API routes: backend/src/routes/customerPortal.js

---

**Happy Testing! 🚀**

