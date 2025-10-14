# 🧪 MANUAL TEST WORKFLOW GUIDE
## Full End-to-End Test: Registration → Customer → Ticket → Completion

**Date**: October 14, 2025  
**Status**: ✅ CAPTCHA DISABLED for easier testing  
**Portal**: https://portal.aglis.biz.id

---

## 📋 **PRE-TEST CHECKLIST**

- ✅ Backend running (PM2 all instances online)
- ✅ Frontend built and deployed
- ✅ Database operational
- ✅ CAPTCHA disabled (`RECAPTCHA_ENABLED=false`)
- ✅ Browser logged in as admin

---

## 🎯 **TEST WORKFLOW STEPS**

### **PHASE 1: PUBLIC REGISTRATION** 📝

#### **Step 1: Create New Registration**
1. Open new incognito/private window
2. Navigate to: `https://portal.aglis.biz.id/register`
3. Fill registration form:
   ```
   Full Name: Test User Workflow Oct14
   Email: test.workflow.oct14@email.com
   Phone: 0812${random 8 digits}
   ID Card: 3216${random 12 digits}
   
   Address: Jl. Test Workflow No. 123
   RT: 001
   RW: 005
   Kelurahan: Karawang Baru
   Kecamatan: Karawang Timur
   City: Karawang
   Postal Code: 41314
   
   Service Type: Broadband
   Package: Bronze 30 Mbps (atau yang tersedia)
   Installation Date: ${7 days from now}
   ```

4. **Submit** form
5. ✅ **VERIFY**: 
   - Success toast appears
   - Registration number displayed (format: `REGyyyymmddxxx`)
   - No errors in console

**Expected Result**: 
- Registration created with status `pending_verification`
- Registration number: `REG20251014xxx`

---

### **PHASE 2: ADMIN VERIFICATION & APPROVAL** ✅

#### **Step 2: Go to Registrations List**
1. Switch back to admin window
2. Navigate to: **Registrations** menu
3. Find your new registration (should be at top)
4. Click **View Details** or click row

#### **Step 3: Quick Verify**
1. In registration detail page
2. Look for **Quick Actions** section
3. Click **⚡ Quick Verify** button
4. Add notes: "Test verification for workflow"
5. Click **Verify**

**Expected Result**:
- Status changes to `verified`
- Green success toast
- Real-time UI update

#### **Step 4: Quick Approve (Fast Track)**
1. Still in registration detail page
2. Click **✅ Quick Approve** button
3. Check **"Skip Survey (Fast Track)"**
4. Add notes: "Fast track approval for testing"
5. Click **Approve**

**Expected Result**:
- Status changes to `approved`
- Green success toast
- "Create Customer" button appears

---

### **PHASE 3: CUSTOMER & TICKET CREATION** 👥

#### **Step 5: Create Customer from Registration**
1. In registration detail page
2. Scroll down to find **"Create Customer & Installation Ticket"** section
3. Fill customer creation form:
   ```
   Username: test_workflow_oct14
   Password: password123
   ODP: ODP-KRW-01 (or any available)
   Installation Notes: Test installation for workflow verification
   ```
4. Click **Create Customer & Ticket**

**Expected Result**:
- Customer created successfully
- Installation ticket created automatically
- Status changes to `customer_created`
- Redirected to customer detail page OR ticket detail page
- Success toast with customer ID and ticket number

#### **Step 6: Verify Customer Details**
1. Navigate to: **Customers** → Find your new customer
2. Click to view **Customer Detail**
3. ✅ **VERIFY**:
   - Customer info correct
   - Package information displayed
   - Account status: `active`
   - Equipment tab exists (empty initially)
   - Payments tab exists
   - Service History tab exists

---

### **PHASE 4: ADD EQUIPMENT** 📱

#### **Step 7: Add Equipment to Customer**
1. In Customer Detail page
2. Click **Equipment** tab
3. Click **Add Equipment** button
4. **Equipment Modal** should open

5. Fill equipment form:
   ```
   Category: Devices (select this first)
   
   Equipment Selection: 
   - Option A: Select from dropdown "ONT Huawei HG8245H"
   - Option B: Manual entry
   
   Brand: Huawei (auto-filled if from dropdown)
   Model: HG8245H (auto-filled if from dropdown)
   Serial Number: SN20251014001
   MAC Address: 00:11:22:33:44:55
   Installation Date: Today's date
   Warranty Expiry: One year from today
   Status: Active
   Notes: Test equipment for workflow verification
   ```

6. Click **Add Equipment**

**Expected Result**:
- Success toast
- Equipment appears in list immediately (real-time)
- Equipment card shows all info
- Delete button appears on hover

---

### **PHASE 5: TICKET MANAGEMENT** 🎫

#### **Step 8: Find Installation Ticket**
1. Navigate to: **Tickets** menu
2. Find installation ticket (filter by customer name or ticket number)
3. Click to view **Ticket Detail**

#### **Step 9: Verify Ticket Information**
✅ **VERIFY**:
- Ticket number: `TKT20251014xxx`
- Type: `installation`
- Status: `open` or `assigned`
- Priority: `normal` or `high`
- Customer info displayed
- Package info displayed
- Service type and category shown

#### **Step 10: Assign to Technician**
1. In ticket detail page
2. Look for **Assign Technician** section or button
3. Select any available technician
4. Click **Assign**

**Expected Result**:
- Status changes to `assigned`
- Technician name displayed
- Success toast

#### **Step 11: Update Ticket to In Progress**
1. In ticket detail page
2. Look for **Status Update** section
3. Change status to: `in_progress`
4. Add notes: "Technician started working on installation"
5. Click **Update**

**Expected Result**:
- Status changes to `in_progress`
- Status badge updates
- Timeline/history updated
- Success toast

#### **Step 12: Complete Ticket**
1. Still in ticket detail page
2. Change status to: `completed`
3. Add resolution notes:
   ```
   Installation completed successfully.
   Equipment tested and working properly.
   Customer briefed on usage.
   Signal strength: -20dB (excellent)
   Speed test: 30 Mbps (as per package)
   ```
4. Click **Update** or **Complete**

**Expected Result**:
- Status changes to `completed`
- Completion timestamp recorded
- Resolution notes saved
- Status badge turns green
- Success toast
- Ticket closed

---

### **PHASE 6: FINAL VERIFICATION** ✅

#### **Step 13: Verify Customer Final Status**
1. Go back to **Customer Detail** page
2. ✅ **VERIFY**:
   - Account status: `active`
   - Equipment count: 1 item
   - Service History: 1 entry (installation)
   - Recent activity shows ticket completion

#### **Step 14: Verify Registration Final Status**
1. Go back to **Registration Detail** page
2. ✅ **VERIFY**:
   - Status: `customer_created`
   - Customer ID linked
   - Installation ticket ID linked
   - Full timeline visible

#### **Step 15: Check Analytics**
1. Navigate to **Dashboard** or **Analytics**
2. ✅ **VERIFY**:
   - New customer counted
   - Completed ticket counted
   - Statistics updated

---

## 🔍 **ADDITIONAL TESTS (OPTIONAL)**

### **Test 16: Add Payment**
1. Go to Customer Detail → **Payments** tab
2. Click **Add Payment**
3. Fill payment details
4. Submit
5. ✅ **VERIFY**: Payment recorded

### **Test 17: Add Service History**
1. Customer Detail → **Service History** tab
2. Add manual service entry
3. ✅ **VERIFY**: History saved

### **Test 18: Create Additional Ticket**
1. From Customer Detail
2. Click **Create Ticket** quick action
3. Select different service type (e.g., repair, maintenance)
4. Test ticket workflow again

### **Test 19: Test Equipment Delete**
1. Customer Detail → **Equipment** tab
2. Hover over equipment card
3. Click **Delete** button
4. Confirm deletion
5. ✅ **VERIFY**: 
   - Equipment status changed to `inactive`
   - Still visible in history
   - Real-time update

### **Test 20: Test Real-time Updates**
1. Open same customer in two different browser windows
2. Make changes in one window
3. ✅ **VERIFY**: Other window updates automatically (via Socket.IO)

---

## 🎯 **SUCCESS CRITERIA**

### **✅ Registration Module**
- [ ] Public registration form works
- [ ] Validation working
- [ ] Quick verify works
- [ ] Quick approve works
- [ ] Status updates correctly

### **✅ Customer Module**
- [ ] Customer creation works
- [ ] Customer detail loads
- [ ] All tabs accessible
- [ ] Add equipment works
- [ ] Equipment modal fully functional
- [ ] Delete equipment works

### **✅ Ticket Module**
- [ ] Ticket auto-created with customer
- [ ] Ticket assignment works
- [ ] Status updates work
- [ ] In progress update works
- [ ] Completion works
- [ ] Resolution notes saved

### **✅ Integration**
- [ ] Registration → Customer link works
- [ ] Customer → Ticket link works
- [ ] Real-time updates working
- [ ] Socket.IO events firing
- [ ] All relationships intact

### **✅ UI/UX**
- [ ] No console errors
- [ ] Toast notifications working
- [ ] Loading states showing
- [ ] Modals opening/closing properly
- [ ] Forms validating correctly
- [ ] Responsive design working

---

## 🐛 **COMMON ISSUES TO CHECK**

### **Issue 1: Console Errors**
- Open browser console (F12)
- Check for any red errors
- Note any API failures

### **Issue 2: Real-time Not Working**
- Check Socket.IO connection in Network tab
- Verify backend Socket.IO server running
- Check for `equipment-added`, `customer-updated` events

### **Issue 3: Modal Not Opening**
- Check for z-index issues
- Verify modal component imported
- Check for JavaScript errors

### **Issue 4: Form Not Submitting**
- Check validation errors (inline)
- Verify all required fields filled
- Check Network tab for API call

### **Issue 5: Data Not Saving**
- Check Network tab → Response
- Verify backend logs (PM2)
- Check database directly if needed

---

## 📊 **TEST REPORT TEMPLATE**

Copy this and fill after testing:

```
## Test Execution Report

**Date**: October 14, 2025
**Tester**: [Your Name]
**Environment**: Production (portal.aglis.biz.id)

### Phase 1: Registration
- Step 1-1: ✅ / ❌ - Notes: ___
- ...

### Phase 2: Verification & Approval
- Step 2-1: ✅ / ❌ - Notes: ___
- ...

### Phase 3: Customer & Ticket
- Step 3-1: ✅ / ❌ - Notes: ___
- ...

### Phase 4: Equipment
- Step 4-1: ✅ / ❌ - Notes: ___
- ...

### Phase 5: Ticket Management
- Step 5-1: ✅ / ❌ - Notes: ___
- ...

### Phase 6: Final Verification
- Step 6-1: ✅ / ❌ - Notes: ___
- ...

### Issues Found:
1. [Issue description]
2. [Issue description]

### Overall Status: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Recommendations:
- [Recommendation 1]
- [Recommendation 2]
```

---

## 🎉 **EXPECTED FINAL STATE**

After completing all tests, you should have:

1. ✅ **1 Registration** (status: `customer_created`)
2. ✅ **1 Customer** (status: `active`)
3. ✅ **1 Equipment** (ONT Huawei)
4. ✅ **1 Ticket** (status: `completed`)
5. ✅ **1 Service History** entry
6. ✅ All relationships linked properly
7. ✅ Real-time updates working
8. ✅ No console errors
9. ✅ All UI components functional
10. ✅ System ready for production

---

## 📝 **NOTES**

- CAPTCHA is disabled for testing (`RECAPTCHA_ENABLED=false`)
- To re-enable: Set `RECAPTCHA_ENABLED=true` in `config.env` and restart PM2
- Test data can be cleaned up later if needed
- Take screenshots of each successful step for documentation

---

**Good Luck with Testing!** 🚀

If you encounter any issues, check:
1. Backend logs: `pm2 logs`
2. Browser console (F12)
3. Network tab for API calls
4. Database for data consistency

