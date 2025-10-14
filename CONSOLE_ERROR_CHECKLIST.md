# 🐛 CONSOLE ERROR CHECKLIST & FIXES

**Last Updated**: October 14, 2025  
**Status**: Active Monitoring

---

## ✅ **FIXED ERRORS**

### **1. Ticket Status History Query Error** ✅ FIXED
**Error**:
```
Get ticket error: error: column h.assigned_technician_id does not exist
```

**Fixed In**: `ce89bcad` - Removed non-existent column from query  
**File**: `backend/src/routes/tickets.js`  
**Status**: ✅ **RESOLVED**

### **2. Quick Actions Not Working** ✅ FIXED
**Error**: Silent failure, no console error but buttons don't work

**Fixed In**: `d1d5dc54` - Fixed parameter signature  
**File**: `frontend/src/pages/registrations/RegistrationDetailPage.jsx`  
**Status**: ✅ **RESOLVED**

### **3. Duplicate Customer/Ticket ID** ✅ FIXED
**Error**:
```
duplicate key value violates unique constraint "customers_customer_id_key"
duplicate key value violates unique constraint "tickets_ticket_number_key"
```

**Fixed In**: `5c5f4c8f` - Changed to MAX() approach  
**File**: `backend/src/routes/registrations.js`  
**Status**: ✅ **RESOLVED**

---

## 🔍 **COMMON CONSOLE ERRORS TO CHECK**

### **Category: API Call Errors**

#### **1. Service Type/Category Errors**
**Location**: Network tab / Console
**Look For**:
```
❌ ServiceTypeService error
❌ ServiceCategoryService error
```

**Potential Causes**:
- Backend not running
- Authentication token expired
- API route not registered
- CORS issues

**How to Check**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter: XHR
4. Look for `/api/service-types` or `/api/service-categories`
5. Check response status code

**Status**: ⚠️ **NEEDS VERIFICATION**

#### **2. Equipment Master Data Errors**
**Location**: Console
**Look For**:
```
❌ EquipmentService error
Failed to fetch equipment list
```

**Potential Causes**:
- Table `equipment_master` missing data
- Permission issues
- API timeout

**How to Check**:
```bash
# Check if equipment master has data
PGPASSWORD='aglis_secure_password_2024' psql -h localhost -U aglis_user \
  -d aglis_production -c "SELECT COUNT(*) FROM equipment_master;"
```

**Expected**: Should return > 0 rows  
**Status**: ⚠️ **NEEDS VERIFICATION**

---

### **Category: React Query Errors**

#### **3. Query Key Mismatch**
**Location**: Console
**Look For**:
```
Warning: Failed to invalidate queries
React Query: Query key mismatch
```

**Potential Causes**:
- Query key changed but not updated in invalidation
- Typo in query key string

**How to Fix**:
```javascript
// Make sure query keys match
useQuery(['customer', id], ...)
queryClient.invalidateQueries(['customer', id]) // ✅ Same key

// Not this:
useQuery(['customer', id], ...)
queryClient.invalidateQueries('customer') // ❌ Different format
```

**Status**: ⚠️ **NEEDS VERIFICATION**

#### **4. Stale Query Data**
**Location**: Console (warnings)
**Look For**:
```
React Query: Query data is stale
```

**Solution**: Usually harmless, but can add `staleTime`:
```javascript
useQuery(['data'], fetchData, {
  staleTime: 5 * 60 * 1000 // 5 minutes
})
```

**Status**: ℹ️ **INFORMATIONAL**

---

### **Category: React Component Errors**

#### **5. Component Did Not Unmount Properly**
**Location**: Console
**Look For**:
```
Warning: Can't perform a React state update on an unmounted component
```

**Potential Causes**:
- Async operation completing after component unmounts
- Missing cleanup in useEffect

**How to Fix**:
```javascript
useEffect(() => {
  let isMounted = true
  
  fetchData().then(data => {
    if (isMounted) {
      setState(data)
    }
  })
  
  return () => {
    isMounted = false // Cleanup
  }
}, [])
```

**Status**: ⚠️ **NEEDS VERIFICATION**

#### **6. Missing Key Prop in Lists**
**Location**: Console (warnings)
**Look For**:
```
Warning: Each child in a list should have a unique "key" prop
```

**How to Fix**:
```javascript
// Bad
{items.map(item => <div>{item.name}</div>)}

// Good
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

**Status**: ⚠️ **NEEDS VERIFICATION**

---

### **Category: Socket.IO Errors**

#### **7. Socket Connection Failed**
**Location**: Console
**Look For**:
```
Socket.IO connection error
WebSocket connection failed
```

**Potential Causes**:
- Backend WebSocket not enabled
- Firewall blocking WebSocket
- CORS issues

**How to Check**:
1. Open Network tab
2. Look for WebSocket (WS) protocol
3. Check connection status

**Status**: ⚠️ **NEEDS VERIFICATION**

#### **8. Socket Event Not Registered**
**Location**: Console
**Look For**:
```
Received unhandled socket event: ...
```

**How to Fix**:
```javascript
// Make sure event listeners are registered
socketService.on('customer-updated', handleUpdate)

// And cleaned up
return () => {
  socketService.off('customer-updated', handleUpdate)
}
```

**Status**: ⚠️ **NEEDS VERIFICATION**

---

### **Category: Form Validation Errors**

#### **9. React Hook Form Errors**
**Location**: Console
**Look For**:
```
React Hook Form: ...
Validation errors not displaying
```

**Common Issues**:
- Missing `name` prop on input
- Not registering input with `{...register('fieldName')}`
- Form not wrapping with `<form onSubmit={handleSubmit(onSubmit)}>`

**Status**: ⚠️ **NEEDS VERIFICATION**

---

### **Category: Authentication Errors**

#### **10. Token Expired/Invalid**
**Location**: Console / Network
**Look For**:
```
401 Unauthorized
Token expired
Invalid credentials
```

**Expected Behavior**:
- Should redirect to login automatically
- Toast notification: "Session expired"

**How to Check**:
1. Check Network tab for 401 responses
2. Verify auth interceptor in `api.js`
3. Check token refresh logic

**Status**: ⚠️ **NEEDS VERIFICATION**

---

## 🎯 **HOW TO USE THIS CHECKLIST**

### **For Browser Testing**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console (Ctrl+L or Cmd+K)
4. Navigate through application
5. Note any RED errors
6. Compare with this checklist

### **For Reporting Issues**:
When reporting console errors, please include:
- **Error message** (exact text)
- **Stack trace** (if available)
- **Steps to reproduce**
- **Browser** (Chrome, Firefox, etc.)
- **Page/Component** where error occurs
- **Screenshot** (if visual issue)

### **Priority Levels**:
- 🔴 **CRITICAL**: App broken, fix immediately
- 🟡 **WARNING**: App works but may have issues
- 🟢 **INFO**: Informational, no action needed

---

## 📋 **TESTING CHECKLIST**

### **Pages to Test**:
- [ ] Dashboard
- [ ] Registrations List
- [ ] Registration Detail
- [ ] Customers List
- [ ] Customer Detail (all tabs)
- [ ] Tickets List
- [ ] Ticket Detail
- [ ] Master Data pages
- [ ] User Management
- [ ] Settings

### **Actions to Test**:
- [ ] Login/Logout
- [ ] Create Registration
- [ ] Verify Registration (Quick Verify)
- [ ] Approve Registration (Quick Approve)
- [ ] Create Customer
- [ ] Add Equipment
- [ ] Delete Equipment
- [ ] Add Payment
- [ ] Create Ticket
- [ ] Update Ticket Status
- [ ] Assign Technician

### **For Each Action Check**:
- [ ] No console errors (RED)
- [ ] Success toast appears
- [ ] Data updates in UI
- [ ] Real-time updates work (if applicable)
- [ ] Network requests succeed (200/201)

---

## 🔧 **QUICK FIXES**

### **If You See Many Errors**:
1. **Refresh browser** (F5)
2. **Clear cache** (Ctrl+Shift+Del)
3. **Hard refresh** (Ctrl+F5 or Cmd+Shift+R)
4. **Clear browser storage**:
   ```javascript
   // In console
   localStorage.clear()
   sessionStorage.clear()
   ```
5. **Check backend is running**:
   ```bash
   pm2 status
   ```

### **If Backend Errors**:
1. Check logs:
   ```bash
   pm2 logs --lines 50
   ```
2. Restart backend:
   ```bash
   pm2 restart all
   ```
3. Check database connection
4. Verify environment variables

---

## 📊 **ERROR STATISTICS**

**Tracked Errors**: 10 categories  
**Fixed Errors**: 3  
**Pending Verification**: 7  
**Last Check**: October 14, 2025

---

## 🎯 **NEXT STEPS**

1. **Manual browser testing** with DevTools open
2. **Document any new errors** found
3. **Prioritize** by impact (critical > warning > info)
4. **Fix** high-priority errors first
5. **Update** this checklist with findings

---

**Remember**: Not all console messages are errors! Some are:
- ℹ️ Informational logs (blue)
- ⚠️ Warnings (yellow) - may not need fixing
- ❌ Errors (red) - need investigation

**Only RED errors typically need immediate attention!**

