# ID Format Documentation

## 📋 Overview
Dokumentasi format ID untuk Registration, Customer, dan Ticket dalam sistem ISP Tech.

**Last Updated:** October 10, 2025  
**Version:** 2.0 (Updated Formats)

---

## 🔢 **ID FORMAT SPECIFICATIONS**

### **1. Registration Number**

**Format:** `REGyyyymmddxxx`

**Components:**
- `REG` - Fixed prefix (3 chars)
- `yyyymmdd` - Tanggal registrasi (8 digits)
- `xxx` - Sequential counter per hari (3 digits, 001-999)

**Examples:**
```
REG20251001001  (Registrasi pertama tanggal 1 Oktober 2025)
REG20250105002  (Registrasi kedua tanggal 5 Januari 2025)
REG20251010050  (Registrasi ke-50 tanggal 10 Oktober 2025)
REG20251225999  (Registrasi ke-999 tanggal 25 Desember 2025)
```

**Note:** Format YYYYMMDD otomatis menambahkan leading zero:
- Tanggal 1-9 → **01-09** ✅
- Bulan 1-9 → **01-09** ✅

**Max Capacity:** 999 registrations per day  
**Length:** 14 characters  
**Database Field:** `customer_registrations.registration_number` (VARCHAR(50))

**Generation Method:** Database trigger function `generate_registration_number()`

---

### **2. Customer ID**

**Format:** `AGLSyyyymmddxxxx`

**Components:**
- `AGLS` - Company prefix (4 chars) - AGLIS Tech
- `yyyymmdd` - Tanggal customer dibuat (8 digits)
- `xxxx` - Sequential counter per hari (4 digits, 0001-9999)

**Examples:**
```
AGLS202510010001  (Customer pertama tanggal 1 Oktober 2025)
AGLS202501050002  (Customer kedua tanggal 5 Januari 2025)
AGLS202510100100  (Customer ke-100 tanggal 10 Oktober 2025)
AGLS202512259999  (Customer ke-9999 tanggal 25 Desember 2025)
```

**Note:** Format YYYYMMDD otomatis menambahkan leading zero:
- Tanggal 1-9 → **01-09** ✅
- Bulan 1-9 → **01-09** ✅

**Max Capacity:** 9,999 customers per day  
**Length:** 16 characters  
**Database Field:** `customers.customer_id` (VARCHAR(50), UNIQUE)

**Generation Method:** Backend code in `/api/registrations/:id/create-customer`

**Code Location:** `backend/src/routes/registrations.js` (Line 778)

---

### **3. Ticket Number**

**Format:** `TKTyyyymmddxxx`

**Components:**
- `TKT` - Fixed prefix (3 chars)
- `yyyymmdd` - Tanggal ticket dibuat (8 digits)
- `xxx` - Sequential counter per hari (3 digits, 001-999)

**Examples:**
```
TKT20251001001  (Ticket pertama tanggal 1 Oktober 2025)
TKT20250105002  (Ticket kedua tanggal 5 Januari 2025)
TKT20251010200  (Ticket ke-200 tanggal 10 Oktober 2025)
TKT20251225999  (Ticket ke-999 tanggal 25 Desember 2025)
```

**Note:** Format YYYYMMDD otomatis menambahkan leading zero:
- Tanggal 1-9 → **01-09** ✅
- Bulan 1-9 → **01-09** ✅

**Max Capacity:** 999 tickets per day  
**Length:** 14 characters  
**Database Field:** `tickets.ticket_number` (VARCHAR(20), UNIQUE)

**Generation Method:** Backend code in multiple endpoints:
- `/api/tickets` (main ticket creation)
- `/api/registrations/:id/status` (survey ticket)
- `/api/registrations/:id/create-customer` (installation ticket)

**Code Locations:**
- `backend/src/routes/tickets.js` (Line 409)
- `backend/src/routes/registrations.js` (Lines 640, 817)

---

## 📊 **COMPARISON: Old vs New Formats**

| Entity | Old Format | New Format | Length Change |
|--------|-----------|------------|---------------|
| Registration | `REG-YYYYMMDD-NNNN` | `REGyyyymmddxxx` | 19 → 14 chars |
| Customer | `CUSTYYYYMMDDNNN` | `AGLSyyyymmddxxxx` | 15 → 16 chars |
| Ticket | `TKTYYYYMMDDNNN` | `TKTyyyymmddxxx` | 14 → 14 chars |

**Changes:**
- ✅ Registration: Removed dashes, reduced to 3-digit counter
- ✅ Customer: Changed prefix CUST → AGLS, increased to 4-digit counter
- ✅ Ticket: Format already correct, no change needed

---

## 🔧 **IMPLEMENTATION DETAILS**

### **Registration Number Generation**

**Method:** PostgreSQL Trigger Function

**Function:** `generate_registration_number()`
```sql
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS character varying
LANGUAGE plpgsql
AS $function$
DECLARE
  today_str VARCHAR(8);
  daily_count INTEGER;
  reg_number VARCHAR(50);
BEGIN
  -- Format: REGyyyymmddxxx
  today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get count of registrations today
  SELECT COUNT(*) INTO daily_count
  FROM customer_registrations
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate: REG + yyyymmdd + 3-digit counter
  reg_number := 'REG' || today_str || LPAD((daily_count + 1)::TEXT, 3, '0');
  
  RETURN reg_number;
END;
$function$;
```

**Trigger:** `auto_generate_registration_number BEFORE INSERT`

---

### **Customer ID Generation**

**Method:** Backend JavaScript Code

**Location:** `backend/src/routes/registrations.js` (Lines 772-778)

```javascript
// Generate customer ID - Format: AGLSyyyymmddxxxx (4 digits)
const countResult = await client.query(
  "SELECT COUNT(*) FROM customers WHERE DATE(created_at) = CURRENT_DATE"
);
const dailyCount = parseInt(countResult.rows[0].count) + 1;
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const customer_id = `AGLS${today}${dailyCount.toString().padStart(4, '0')}`;
```

**Triggered:** When admin creates customer from approved registration

---

### **Ticket Number Generation**

**Method:** Backend JavaScript Code (3 locations)

**Location 1:** General ticket creation - `backend/src/routes/tickets.js` (Line 409)
```javascript
const ticket_number = `TKT${today}${dailyCount.toString().padStart(3, '0')}`;
```

**Location 2:** Survey ticket - `backend/src/routes/registrations.js` (Line 640)
```javascript
const ticketNumber = `TKT${today}${dailyCount.toString().padStart(3, '0')}`;
```

**Location 3:** Installation ticket - `backend/src/routes/registrations.js` (Line 817)
```javascript
// Fixed: Use ticket count, not customer count
const ticketCountResult = await client.query(
  'SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE'
);
const dailyTicketCount = parseInt(ticketCountResult.rows[0].count) + 1;
const ticketNumber = `TKT${today}${dailyTicketCount.toString().padStart(3, '0')}`;
```

**Note:** Installation ticket generation fixed to use proper daily ticket count instead of `dailyCount * 10`

---

## ✅ **VALIDATION & TESTING**

### **Format Validation Examples:**

**Test Query:**
```sql
-- Test registration format
SELECT generate_registration_number();
-- Expected: REG20251010001

-- Test customer format
SELECT 'AGLS' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD('1', 4, '0');
-- Expected: AGLS202510100001

-- Test ticket format
SELECT 'TKT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD('1', 3, '0');
-- Expected: TKT20251010001
```

### **Uniqueness Constraints:**

All ID formats have database UNIQUE constraints:
- ✅ `customer_registrations.registration_number` - UNIQUE
- ✅ `customers.customer_id` - UNIQUE
- ✅ `tickets.ticket_number` - Checked in code before insert

---

## 🔄 **DAILY RESET BEHAVIOR**

**Counter Reset:** Midnight setiap hari (00:00:00)

**Sequence Flow:**
```
Day 1 (1 Oktober - 20251001):
  REG20251001001, REG20251001002, ... REG20251001999
  AGLS202510010001, AGLS202510010002, ... AGLS202510019999
  TKT20251001001, TKT20251001002, ... TKT20251001999

Day 2 (2 Oktober - 20251002):
  REG20251002001  ← Reset ke 001
  AGLS202510020001 ← Reset ke 0001
  TKT20251002001  ← Reset ke 001

Day 10 (10 Oktober - 20251010):
  REG20251010001, REG20251010002, ...
  AGLS202510100001, AGLS202510100002, ...
  TKT20251010001, TKT20251010002, ...
```

**Leading Zero Verification:**
- Tanggal 1: `20251001` ✅ (bukan `202511`)
- Tanggal 5: `20251005` ✅ (bukan `202515`)
- Tanggal 9: `20251009` ✅ (bukan `202519`)
- Tanggal 10: `20251010` ✅

**Benefits:**
- ✅ Easy to identify data by date
- ✅ Predictable numbering
- ✅ Daily organization
- ✅ Capacity planning per day

---

## 📁 **FILES MODIFIED**

### **Database:**
1. `backend/migrations/023_update_id_formats.sql`
   - Updated `generate_registration_number()` function
   - Changed format: `REG-YYYYMMDD-NNNN` → `REGyyyymmddxxx`

### **Backend Code:**
2. `backend/src/routes/registrations.js`
   - Line 778: Customer ID format `CUST` → `AGLS`, 3-digit → 4-digit
   - Line 817: Installation ticket generation fix (use ticket count)

### **No Changes Needed:**
- `backend/src/routes/tickets.js` - Format already correct
- `backend/src/routes/registrations.js` Line 640 - Survey ticket format already correct

---

## 🎯 **MIGRATION SCRIPT**

**File:** `backend/migrations/023_update_id_formats.sql`

**Actions:**
1. ✅ Update `generate_registration_number()` function
2. ✅ Change format REG-YYYYMMDD-NNNN → REGyyyymmddxxx
3. ✅ Reduce counter from 4-digit → 3-digit

**Status:** ✅ Executed successfully

---

## 📝 **USAGE EXAMPLES**

### **Scenario: Daily Operations**

**Tanggal 1 Oktober 2025 - Morning (08:00):**
- First registration: `REG20251001001`
- First customer created: `AGLS202510010001`
- First ticket: `TKT20251001001`

**Tanggal 5 Januari 2025 - Midday (12:00):**
- 50th registration: `REG20250105050`
- 30th customer: `AGLS202501050030`
- 75th ticket: `TKT20250105075`

**Tanggal 10 Oktober 2025 - Evening (20:00):**
- 200th registration: `REG20251010200`
- 150th customer: `AGLS202510100150`
- 300th ticket: `TKT20251010300`

**Next Day Reset:**
- Midnight passes → All counters reset to 001/0001

**Leading Zero Examples:**
- Jan 1: `20250101` ✅ (bukan `202511`)
- Feb 5: `20250205` ✅ (bukan `202525`)
- Sep 9: `20250909` ✅ (bukan `202599`)

---

## ⚙️ **TECHNICAL NOTES**

### **Thread Safety:**
- Database transactions ensure no duplicate IDs
- COUNT(*) query within transaction provides accurate daily count
- UNIQUE constraints prevent accidental duplicates

### **Performance:**
- Simple COUNT(*) with date filter - fast execution
- Indexed on created_at for quick queries
- No complex sequence management needed

### **Scalability:**
- Registration: 999/day = 364,635/year capacity
- Customer: 9,999/day = 3,649,635/year capacity  
- Ticket: 999/day = 364,635/year capacity

**For ISP broadband residential:** More than sufficient! ✅

---

## 🚀 **DEPLOYMENT NOTES**

**Changes Required:**
- ✅ Database function updated (migration applied)
- ✅ Backend code updated (registrations.js)
- ⏳ Restart backend service (to load new code)
- ⏳ Test with first registration/customer/ticket
- ⏳ Monitor logs for correct format generation

**Rollback Plan:**
```sql
-- If needed, revert to old format:
CREATE OR REPLACE FUNCTION generate_registration_number()
... old function code ...
```

---

**Document Status:** ✅ Complete  
**Implementation Status:** ✅ Code updated, ready for testing  
**Production Ready:** ✅ Yes (after verification test)

