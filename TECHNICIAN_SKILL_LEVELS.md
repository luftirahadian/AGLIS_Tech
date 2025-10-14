# Technician Skill Levels

## Overview
Skill levels menentukan kemampuan, tanggung jawab, dan kompleksitas pekerjaan yang dapat ditangani oleh seorang teknisi.

---

## 🌱 Junior (Level 1)

### Karakteristik:
- **Pengalaman:** 0-2 tahun
- **Training:** Baru lulus training atau fresh graduate
- **Supervisi:** Membutuhkan supervisi ketat

### Tanggung Jawab:
- ✅ Instalasi FTTH dasar (rumah residential)
- ✅ Troubleshooting basic (kabel putus, ONT mati)
- ✅ Customer service & dokumentasi
- ✅ Pemasangan kabel drop wire
- ❌ TIDAK untuk: Splicing, Core network, ODP management

### Ticket Types:
- `installation` - Instalasi residential basic
- `repair` - Perbaikan sederhana (kabel, ONT)
- `customer_service` - Keluhan customer

### Max Daily Tickets: **8 tickets**

### Contoh Tugas:
```
1. Install FTTH untuk rumah baru
2. Ganti ONT rusak
3. Perbaiki kabel drop wire putus
4. Setup WiFi router customer
```

---

## ⭐ Senior (Level 2)

### Karakteristik:
- **Pengalaman:** 2-5 tahun
- **Training:** Certified FTTH, Basic Splicing
- **Supervisi:** Minimal, bisa bekerja mandiri

### Tanggung Jawab:
- ✅ Semua tugas Junior
- ✅ Instalasi kompleks (multi-unit, gedung)
- ✅ Troubleshooting advanced (signal loss, attenuation)
- ✅ Basic fiber splicing
- ✅ Koordinasi dengan junior technician
- ❌ TIDAK untuk: Core network design, OLT configuration

### Ticket Types:
- Semua ticket Junior +
- `installation` - Instalasi gedung/apartemen
- `troubleshooting` - Advanced signal issues
- `maintenance` - Preventive maintenance

### Max Daily Tickets: **6 tickets** (lebih kompleks)

### Contoh Tugas:
```
1. Install FTTH untuk apartemen 10 unit
2. Troubleshoot signal loss di ODP
3. Splicing fiber yang putus
4. Survey lokasi untuk instalasi baru
```

---

## 🏆 Expert (Level 3)

### Karakteristik:
- **Pengalaman:** 5-10 tahun
- **Training:** Advanced Splicing, OTDR Certified, Network Design
- **Supervisi:** Tidak perlu, bisa supervise others

### Tanggung Jawab:
- ✅ Semua tugas Senior
- ✅ Fiber splicing advanced (fusion splicing)
- ✅ OTDR testing & analysis
- ✅ ODP installation & management
- ✅ Network troubleshooting (core network)
- ✅ Training junior & senior technicians
- ❌ TIDAK untuk: OLT configuration (network engineer)

### Ticket Types:
- Semua ticket Senior +
- `network_troubleshooting` - Core network issues
- `odp_management` - ODP installation/maintenance
- `fiber_splicing` - Advanced splicing projects
- `survey` - Site survey & network design

### Max Daily Tickets: **4 tickets** (sangat kompleks)

### Contoh Tugas:
```
1. Install & configure ODP baru
2. OTDR testing untuk troubleshoot signal
3. Splicing fiber backbone
4. Network design untuk area baru
5. Training teknisi junior
```

---

## 💎 Specialist (Level 4)

### Karakteristik:
- **Pengalaman:** 10+ tahun
- **Training:** All certifications, Network Engineer level
- **Supervisi:** Team leader, project manager

### Tanggung Jawab:
- ✅ Semua tugas Expert
- ✅ OLT configuration & management
- ✅ Core network design & optimization
- ✅ Project management (large installations)
- ✅ Technical consultation
- ✅ Emergency response leader
- ✅ Quality assurance & standards

### Ticket Types:
- Semua ticket Expert +
- `core_network` - OLT, backbone issues
- `project_management` - Large scale projects
- `consultation` - Technical advisory
- `emergency` - Critical network failures

### Max Daily Tickets: **2-3 tickets** (critical only)

### Contoh Tugas:
```
1. Configure OLT untuk area baru
2. Design network topology untuk kota baru
3. Handle critical network outage
4. Project manager untuk instalasi 1000+ homes
5. Technical consultation untuk management
```

---

## Comparison Matrix

| Aspect | Junior 🌱 | Senior ⭐ | Expert 🏆 | Specialist 💎 |
|--------|----------|----------|----------|---------------|
| **Experience** | 0-2 years | 2-5 years | 5-10 years | 10+ years |
| **Max Tickets/Day** | 8 | 6 | 4 | 2-3 |
| **Avg Ticket Time** | 2-3 hours | 3-4 hours | 4-6 hours | 6-8 hours |
| **Supervision** | Required | Minimal | None | Leader |
| **Training Required** | Basic FTTH | FTTH + Splicing | OTDR + Network | All + Management |
| **Salary Range** | Rp 3-5 juta | Rp 5-8 juta | Rp 8-12 juta | Rp 12-20 juta |
| **Can Supervise** | No | Junior | Junior + Senior | All |
| **Emergency Response** | No | Yes (with senior) | Yes (lead) | Yes (critical) |
| **Equipment Access** | Basic tools | + Splicing kit | + OTDR | + OLT access |

---

## Skill Progression Path

```
Junior (0-2y) → Senior (2-5y) → Expert (5-10y) → Specialist (10+y)
    ↓               ↓               ↓                ↓
Basic FTTH    Advanced Install  Network Design   Project Mgmt
Customer Svc  Troubleshooting   OTDR Testing     Core Network
Installation  Basic Splicing    ODP Management   OLT Config
                                Fusion Splicing   Consultation
```

---

## Certification Requirements

### Junior → Senior:
- ✅ FTTH Installation Certified
- ✅ Basic Fiber Optic Knowledge
- ✅ 50+ successful installations
- ✅ Customer satisfaction > 4.0/5.0

### Senior → Expert:
- ✅ Advanced Splicing Certified
- ✅ OTDR Testing Certified
- ✅ 200+ successful installations
- ✅ Customer satisfaction > 4.5/5.0
- ✅ Zero critical failures

### Expert → Specialist:
- ✅ Network Design Certified
- ✅ Project Management Certified
- ✅ 500+ successful installations
- ✅ Customer satisfaction > 4.7/5.0
- ✅ Leadership & training experience
- ✅ Emergency response certified

---

## Auto-Assignment Rules

### Ticket Complexity → Skill Level Matching:

```javascript
Ticket Priority + Type → Minimum Skill Level

installation (residential)     → Junior
installation (commercial)      → Senior
repair (basic)                → Junior
repair (advanced)             → Senior
troubleshooting (basic)       → Junior
troubleshooting (advanced)    → Senior
troubleshooting (network)     → Expert
fiber_splicing               → Senior (basic) / Expert (advanced)
odp_management               → Expert
core_network                 → Specialist
emergency (critical)         → Expert / Specialist
```

---

## Performance Metrics by Level

### Junior:
- **Target:** 8 tickets/day
- **Success Rate:** > 85%
- **Customer Rating:** > 4.0/5.0
- **Avg Resolution Time:** 2-3 hours

### Senior:
- **Target:** 6 tickets/day
- **Success Rate:** > 90%
- **Customer Rating:** > 4.3/5.0
- **Avg Resolution Time:** 3-4 hours

### Expert:
- **Target:** 4 tickets/day
- **Success Rate:** > 95%
- **Customer Rating:** > 4.5/5.0
- **Avg Resolution Time:** 4-6 hours

### Specialist:
- **Target:** 2-3 tickets/day
- **Success Rate:** > 98%
- **Customer Rating:** > 4.7/5.0
- **Avg Resolution Time:** 6-8 hours (critical issues)

---

## Notes:
- Skill level dapat diupgrade melalui halaman Technician Detail → Status Card → Edit Skill Level
- Promotion memerlukan approval dari supervisor
- Training records harus di-update di Certifications section
- Performance metrics di-track otomatis oleh sistem

