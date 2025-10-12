# 📋 PENJELASAN FLOW APPROVAL REGISTRATION

**Date:** 10 Oktober 2025  
**Status:** 📖 Documentation & Explanation

---

## 🎯 **RINGKASAN SINGKAT:**

Di kolom **Actions** Registrations Page, memang hanya ada **3 tombol maksimal** yang muncul dalam satu waktu, tapi **tombol tersebut berubah-ubah** tergantung status registration!

**Total ada 6 status** dalam flow registration, dan **2 opsi path** (dengan/tanpa survey).

---

## 🔄 **FLOW LENGKAP DENGAN SEMUA OPSI:**

### **STATUS PROGRESSION:**

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLOW REGISTRATION                             │
└──────────────────────────────────────────────────────────────────┘

1️⃣  PENDING VERIFICATION (Status awal setelah submit)
     │
     ├─► Action: 👁️ View + ✓ Verify
     │
     ▼
     
2️⃣  VERIFIED (Admin sudah verify)
     │
     ├─► OPSI A: Langsung Approve (Skip Survey)
     │   └─► Action: 👁️ View + 📅 Schedule Survey
     │
     ├─► OPSI B: Schedule Survey Dulu
     │   └─► Action: 👁️ View + 📅 Schedule Survey
     │   
     ▼
     
3️⃣  SURVEY SCHEDULED (Survey dijadwalkan)
     │
     ├─► Action: 👁️ View + 📄 (Waiting for survey completion)
     │   (Survey dilakukan via Tickets page)
     │
     ▼
     
4️⃣  SURVEY COMPLETED (Survey selesai)
     │
     ├─► Action: 👁️ View + ✅ Approve
     │
     ▼
     
5️⃣  APPROVED (Final approval)
     │
     ├─► Action: 👁️ View + 👤 Create Customer
     │   (Button hijau untuk create customer & ticket instalasi)
     │
     ▼
     
6️⃣  CUSTOMER CREATED (Customer & installation ticket dibuat)
     │
     └─► Flow selesai! Data masuk ke Customers page

═══════════════════════════════════════════════════════════════════

❌ ALTERNATIF: REJECTED (Bisa di-reject dari status mana pun)
     │
     └─► Flow berhenti, tidak lanjut ke customer
```

---

## 🎬 **2 PATH UTAMA:**

### **PATH A: TANPA SURVEY (Fast Track)** ⚡

```
pending_verification 
   ↓ (Verify)
verified 
   ↓ (Approve tanpa survey)
approved 
   ↓ (Create Customer)
✅ Customer Created
```

**Durasi:** ~2 action (Verify → Approve → Create Customer)

---

### **PATH B: DENGAN SURVEY (Full Process)** 📋

```
pending_verification 
   ↓ (Verify)
verified 
   ↓ (Schedule Survey)
survey_scheduled 
   ↓ (Survey team complete survey via Tickets)
survey_completed 
   ↓ (Approve)
approved 
   ↓ (Create Customer)
✅ Customer Created
```

**Durasi:** ~4-5 action (Verify → Schedule → Survey → Approve → Create Customer)

---

## 🎨 **ACTION BUTTONS DETAIL:**

### **Berdasarkan Status:**

| Status | Button 1 | Button 2 | Button 3 | Warna |
|--------|----------|----------|----------|-------|
| **pending_verification** | 👁️ View | ✓ Verify | - | Yellow |
| **verified** | 👁️ View | 📅 Schedule Survey | ✅ Approve* | Blue |
| **survey_scheduled** | 👁️ View | - | - | Indigo |
| **survey_completed** | 👁️ View | ✅ Approve | - | Purple |
| **approved** | 👁️ View | 👤 Create Customer | - | Green |
| **rejected** | 👁️ View | - | - | Red |

**Note:** Approve dari status `verified` langsung (skip survey) adalah **OPSI A**.

---

## 🔑 **PENJELASAN SETIAP ACTION:**

### **1️⃣ 👁️ View Details** (Selalu ada)
- Melihat detail lengkap registration
- Termasuk foto KTP, alamat lengkap, package selected
- **Tidak mengubah status**

### **2️⃣ ✓ Verify** (pending_verification → verified)
- **Trigger:** Admin cek data dan verify kelengkapan
- **Action:**
  - Update status ke `verified`
  - Set `verified_by` & `verified_at`
  - Send WhatsApp notification ke customer
- **Next Step:** Pilih Schedule Survey atau Langsung Approve

### **3️⃣ 📅 Schedule Survey** (verified → survey_scheduled)
- **Trigger:** Perlu survey lokasi dulu
- **Action:**
  - Update status ke `survey_scheduled`
  - Create survey ticket di Tickets page (type: `maintenance`)
  - Assign teknisi untuk survey
  - Set `survey_scheduled_date`
  - Send WhatsApp notification
- **Next Step:** Teknisi complete survey di Tickets page

### **4️⃣ ✅ Approve** (survey_completed → approved OR verified → approved)
- **Trigger:** 
  - Setelah survey completed (PATH B)
  - Langsung dari verified (PATH A - skip survey)
- **Action:**
  - Update status ke `approved`
  - Set `approved_by` & `approved_at`
  - Send WhatsApp notification
- **Next Step:** Create Customer

### **5️⃣ 👤 Create Customer** (approved → customer created)
- **Trigger:** Registration sudah di-approve
- **Action:**
  - Generate `customer_id` (AGLS20251011001)
  - Insert data ke `customers` table
  - Set `account_status: 'pending_installation'`
  - Create installation ticket (TKT20251011001)
  - Assign teknisi instalasi
  - Update registration status
  - Send WhatsApp notification
- **Next Step:** Teknisi complete instalasi di Tickets page

### **6️⃣ ❌ Reject** (any status → rejected)
- **Trigger:** Data tidak lengkap / tidak valid
- **Action:**
  - Update status ke `rejected`
  - Wajib input `rejection_reason`
  - Send WhatsApp notification dengan alasan
- **Result:** Flow berhenti, tidak lanjut ke customer

---

## 📊 **STATISTIK CARDS:**

| Card | Deskripsi | Warna | Clickable? |
|------|-----------|-------|------------|
| **Total Pendaftaran** | Semua registration | Blue | No |
| **Pending** | pending_verification | Yellow | ✅ Yes |
| **Approved** | approved | Green | ✅ Yes |
| **Rejected** | rejected | Red | ✅ Yes |

**Note:** Click card untuk filter tabel.

---

## 🎯 **REKOMENDASI PENGGUNAAN:**

### **Kapan Pakai PATH A (Tanpa Survey)?** ⚡

✅ Customer broadband rumahan  
✅ Area sudah ada coverage ODP  
✅ Alamat jelas & valid  
✅ Tidak ada kendala infrastruktur  
✅ Package standar (Bronze/Silver/Gold/Platinum)

### **Kapan Pakai PATH B (Dengan Survey)?** 📋

✅ Customer di area baru  
✅ Butuh survey kelayakan lokasi  
✅ Perlu cek jarak ODP ke rumah  
✅ Ada pertimbaan khusus infrastruktur  
✅ Request kustomisasi instalasi

---

## 🔧 **BACKEND ENDPOINTS:**

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| View List | GET | `/api/registrations` | - |
| View Detail | GET | `/api/registrations/:id` | - |
| Update Status | PUT | `/api/registrations/:id/status` | `{ status, notes, rejection_reason, survey_scheduled_date }` |
| Create Customer | POST | `/api/registrations/:id/create-customer` | - |

---

## 💡 **FAQ:**

### **Q: Kenapa hanya ada 3 tombol maksimal?**
A: Karena button conditional berdasarkan status. Tidak semua button relevan untuk setiap status.

### **Q: Apakah bisa skip dari pending langsung ke approved?**
A: Tidak. Harus melalui `verified` dulu (minimal 1 step verify).

### **Q: Apakah wajib survey?**
A: Tidak wajib. Admin bisa pilih OPSI A (skip survey) jika lokasi sudah jelas.

### **Q: Bagaimana cara reject registration?**
A: Saat ini via modal action, bisa ditambahkan tombol reject khusus jika diperlukan.

### **Q: Apakah customer bisa track status nya?**
A: Ya! Via URL: `http://localhost:3000/track/REG20251011001`

### **Q: Setelah create customer, registration bisa di-delete?**
A: Tidak disarankan. Untuk audit trail, tetap simpan history registration.

---

## 🎨 **MOCKUP UI ACTIONS:**

```
┌────────────────────────────────────────────────────────┐
│ Status: PENDING VERIFICATION                           │
│                                                        │
│ Actions: [👁️ View] [✓ Verify]                        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Status: VERIFIED                                       │
│                                                        │
│ Actions: [👁️ View] [📅 Schedule Survey] [✅ Approve]  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Status: SURVEY SCHEDULED                               │
│                                                        │
│ Actions: [👁️ View]                                    │
│ (Waiting for survey completion in Tickets)            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Status: SURVEY COMPLETED                               │
│                                                        │
│ Actions: [👁️ View] [✅ Approve]                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Status: APPROVED                                       │
│                                                        │
│ Actions: [👁️ View] [👤 Create Customer]              │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Status: REJECTED                                       │
│                                                        │
│ Actions: [👁️ View]                                    │
│ (No further actions available)                        │
└────────────────────────────────────────────────────────┘
```

---

## ✅ **KESIMPULAN:**

**Total Opsi:** 2 Path Utama (A dan B)  
**Total Status:** 6 status  
**Total Actions:** 5 jenis action (View, Verify, Schedule, Approve, Create Customer)  
**Button Maksimal:** 3 button per status  
**Flexibility:** High - Admin bisa pilih fast track atau full process

---

**🎯 Recommendation:**  
Untuk broadband customer di Karawang yang sudah punya coverage, **PATH A (Fast Track)** adalah pilihan terbaik untuk kecepatan onboarding customer!

---

*Dokumentasi ini dibuat untuk menjelaskan complete flow registration approval process.*

