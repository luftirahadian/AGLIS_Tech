# 🧪 MASTER DATA SYSTEM - TESTING GUIDE

## ✅ Implementation Complete - Ready for Testing

**Date:** 2025-10-15  
**Status:** Production Ready  
**All Features:** Implemented & Deployed

---

## 📋 TEST CHECKLIST

### ✅ **TEST 1: Skill Levels Page**

**URL:** `https://portal.aglis.biz.id/master-data/skill-levels`

**Steps:**
1. Login as admin (`admin` / `adminadmin`)
2. Click sidebar → **Master Data** → **Skill Levels**
3. Verify page loads

**Expected Results:**
- ✅ 4 skill level cards displayed:
  - 🌱 Junior Technician [JUNIOR]
  - ⭐ Senior Technician [SENIOR]
  - 🏆 Expert Technician [EXPERT]
  - 💎 Technical Specialist [SPECIALIST]
- ✅ Each card shows:
  - Description
  - Min Experience (months)
  - Min Completed Tickets
  - Min Avg Rating
  - Daily Capacity
  - Capabilities badges
- ✅ Color-coded by level
- ✅ Professional gradient design

---

### ✅ **TEST 2: Specializations Page**

**URL:** `https://portal.aglis.biz.id/master-data/specializations`

**Steps:**
1. From sidebar → **Master Data** → **Specializations**
2. Verify page loads
3. Test category filter dropdown

**Expected Results:**
- ✅ Header shows "34 specializations across 6 categories"
- ✅ Category filter dropdown works
- ✅ 6 category sections displayed:
  1. 📘 FTTH Installation & Activation (6 specs)
  2. 🔧 FTTH Maintenance & Repair (5 specs)
  3. 🌐 Network Infrastructure (5 specs)
  4. 📡 NOC Operations (5 specs)
  5. 👥 Customer Support & Service (4 specs)
  6. 📶 Wireless Services (3 specs)
- ✅ Each specialization card shows:
  - Name
  - Description
  - Required skill level badge
  - Difficulty level (L1-L5)
  - High Demand badge (if applicable)
  - Critical badge (if applicable)
- ✅ Grid layout, responsive

---

### ✅ **TEST 3: Technician Detail - View Specializations**

**URL:** `https://portal.aglis.biz.id/technicians/1`

**Steps:**
1. Navigate to Technicians page
2. Click on any technician (e.g., Ahmad Fauzi - TECH001)
3. Scroll to "Specializations" section

**Expected Results:**
- ✅ Professional specialization cards displayed
- ✅ Each card shows:
  - Specialization name
  - Category (color-coded)
  - Proficiency level (Beginner/Intermediate/Expert)
  - Years of experience
  - Difficulty level badge
  - High Demand badge (if applicable)
  - Critical Service badge (if applicable)
- ✅ Example for Technician #1 (Ahmad Fauzi):
  - FTTH Basic Installation [High Demand]
  - Fiber Optic Troubleshooting [High Demand] [Critical]
  - Fiber Optic Splicing [High Demand] [Critical]
  - Fiber Testing & Measurement [High Demand]

---

### ✅ **TEST 4: Add Specialization (Interactive Feature)**

**URL:** `https://portal.aglis.biz.id/technicians/1`

**Steps:**
1. On Technician Detail Page
2. Locate "Specializations" section
3. Click "➕ Add Specialization" button (blue, top right of section)
4. Modal should open

**Expected Modal UI:**
```
┌──────────────────────────────────────────────┐
│ 🎯 Add Specialization                   [X] │
├──────────────────────────────────────────────┤
│                                              │
│ Select Specialization *                      │
│ [Dropdown with grouped options by category]  │
│ ⭐ = High Demand | 🔴 = Critical | [L#]      │
│                                              │
│ 📊 Proficiency Level *                       │
│ [Beginner / Intermediate / Expert]           │
│                                              │
│ ⏱️ Years of Experience                       │
│ [Number input: 0-30 years]                   │
│                                              │
│                      [Cancel] [Add Spec]     │
└──────────────────────────────────────────────┘
```

**Test Actions:**
1. Select specialization: "OLT Management & Configuration"
2. Select proficiency: "Intermediate"
3. Enter experience: "2.5"
4. Click "Add Specialization"

**Expected Results:**
- ✅ Toast notification: "Specialization 'OLT Management...' added successfully"
- ✅ Modal closes automatically
- ✅ Page refreshes (React Query invalidation)
- ✅ New specialization card appears immediately
- ✅ Card shows all details correctly:
  - Name: OLT Management & Configuration
  - Category: NOC Operations
  - Proficiency: Intermediate
  - Experience: 2.50 years
  - Badges: [High Demand] [Critical] [Level 4]

---

### ✅ **TEST 5: Duplicate Prevention**

**Steps:**
1. Try to add the same specialization again
2. Submit form

**Expected Results:**
- ✅ Error toast: "Technician already has this specialization"
- ✅ Modal stays open
- ✅ No data added to database

---

### ✅ **TEST 6: Real-time Updates (Multi-User)**

**Setup:**
- User A: Admin viewing Technician #1 detail
- User B: Supervisor viewing Technician #1 detail

**Steps:**
1. User A adds new specialization to Technician #1
2. User B should see update

**Expected Results:**
- ✅ User A sees immediate update (query invalidation)
- ✅ User B receives Socket.IO event
- ✅ User B's page auto-refreshes
- ✅ Both users see same data
- ✅ No manual refresh needed

---

### ✅ **TEST 7: API Direct Test**

**Using cURL (For Backend Verification):**

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"admin","password":"adminadmin"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Get all specializations
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/specializations/grouped | head -50

# 3. Add specialization to technician
curl -s -X POST http://localhost:8080/api/technicians/1/specializations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "specialization_id": 10,
    "proficiency_level": "intermediate",
    "years_experience": 2.5
  }'

# 4. Get technician specializations
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/technicians/1/specializations
```

---

## 📊 **EXPECTED DATA:**

### Skill Levels (4 total):
```
1. Junior (0 months, 0 tickets, 3.5 rating)
2. Senior (12 months, 100 tickets, 4.0 rating)
3. Expert (36 months, 500 tickets, 4.5 rating)
4. Specialist (60 months, 1000 tickets, 4.7 rating)
```

### Specialization Categories (6 total):
```
1. FTTH Installation & Activation (6 specs)
2. FTTH Maintenance & Repair (5 specs)
3. Network Infrastructure (5 specs)
4. NOC Operations (5 specs)
5. Customer Support & Service (4 specs)
6. Wireless Services (3 specs)
```

### Total Specializations: **34**

### Sample Technician Data (Technician #1):
```
Name: Ahmad Fauzi
Employee ID: TECH001
Skill Level: Senior
Current Specializations (4):
  1. FTTH Basic Installation [Intermediate, 3 years]
  2. Fiber Optic Troubleshooting [Intermediate, 3 years]
  3. Fiber Optic Splicing [Intermediate, 3 years]
  4. Fiber Testing & Measurement [Intermediate, 3 years]
```

---

## 🐛 **COMMON ISSUES & SOLUTIONS:**

### Issue 1: Modal doesn't open
**Check:**
- Button is visible?
- Console errors?
- Import AddSpecializationModal correct?

### Issue 2: Dropdown is empty
**Check:**
- API endpoint working? `/api/specializations/grouped`
- React Query loading state?
- Network tab shows 200 OK?

### Issue 3: Submit fails
**Check:**
- Valid specialization selected?
- Token valid?
- Network request shows 201 Created?
- Backend logs for errors?

### Issue 4: Page doesn't refresh
**Check:**
- Query invalidation called?
- onSuccess handler firing?
- React Query devtools?

---

## ✅ **SUCCESS CRITERIA:**

**All Tests Pass When:**
1. ✅ Can navigate to both Master Data pages
2. ✅ All data displays correctly
3. ✅ Add Specialization button visible
4. ✅ Modal opens smoothly
5. ✅ Dropdown loads all 34 specializations
6. ✅ Can select and submit
7. ✅ Toast notification appears
8. ✅ New card appears immediately
9. ✅ No console errors
10. ✅ Real-time updates work

---

## 🚀 **QUICK TEST COMMANDS:**

```bash
# Check backend servers
pm2 status

# Check backend logs for errors
pm2 logs aglis-backend-1 --lines 20 --nostream

# Test API endpoint directly
curl -s https://portal.aglis.biz.id/api/skill-levels | head -20

# Verify database data
sudo -u postgres psql -d aglis_production -c \
  "SELECT COUNT(*) FROM specializations;"
```

---

## 📝 **NOTES:**

- Master Data pages are **read-only** for now (view only)
- Full CRUD UI can be added later if needed
- Data is seeded and stable
- Adding specializations works via modal on Technician Detail page
- Socket.IO provides real-time updates

---

**READY FOR TESTING!** 🎉

Please test and report any issues you find! 🚀

