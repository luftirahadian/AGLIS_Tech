# 🎨 WHATSAPP TEMPLATE MANAGEMENT UI - USER GUIDE

**Location:** Master Data → WhatsApp Templates  
**URL:** `https://portal.aglis.biz.id/master-data/whatsapp-templates`  
**Access:** Admin & Supervisor only

---

## 📋 **OVERVIEW**

Halaman management untuk mengelola template pesan WhatsApp tanpa perlu coding. Semua template disimpan di database dan bisa diubah real-time.

---

## 🎯 **FITUR UTAMA**

### **1. View All Templates**
- ✅ Grid layout dengan cards
- ✅ Category badges (color-coded)
- ✅ Active/Inactive status
- ✅ Usage count
- ✅ Template preview (truncated)

### **2. Search & Filter**
- ✅ Search bar (name, code, description)
- ✅ Category filter buttons
- ✅ Real-time filtering

### **3. Create Template**
- ✅ Modal form
- ✅ All fields editable
- ✅ Variable syntax helper
- ✅ JSON editor untuk test data
- ✅ Active status toggle

### **4. Edit Template**
- ✅ Pre-filled form
- ✅ Update any field
- ✅ Code tidak bisa diubah (unique identifier)
- ✅ Instant save

### **5. Delete Template**
- ✅ Confirmation dialog
- ✅ Soft delete (bisa dibuat ulang dengan code berbeda)

### **6. Preview Template**
- ✅ WhatsApp phone mockup
- ✅ Rendered message preview
- ✅ Variables list
- ✅ Professional design

### **7. Test Send**
- ✅ Send test message ke phone number
- ✅ Use sample variables
- ✅ Increment usage count

---

## 📝 **CARA MENGGUNAKAN**

### **A. CREATE NEW TEMPLATE**

**Steps:**
```
1. Click "Tambah Template" button
2. Fill form:
   - Code: CUSTOM_NOTIFICATION (uppercase, no spaces)
   - Name: Custom Notification Message
   - Category: Select dari dropdown
   - Description: (optional) Deskripsi template
   - Template: Message dengan {{variables}}
   - Variables: JSON test data
   - Active: Check untuk enable

3. Click "Create Template"
4. ✅ Template saved & available untuk digunakan
```

**Example:**
```
Code: TICKET_FOLLOWUP
Name: Ticket Follow-up - Customer
Category: ticket
Description: Follow-up setelah 24 jam ticket dibuat

Template:
📞 *FOLLOW-UP TICKET*

Hi {{customerName}},

Ticket: #{{ticketNumber}}
Created: {{createdDate}}

Kami ingin memastikan masalah Anda sedang ditangani dengan baik.

Status saat ini: {{currentStatus}}
{{#if technicianName}}
Teknisi: {{technicianName}}
{{/if}}

Ada pertanyaan? Reply pesan ini atau hubungi CS kami.

Variables:
{
  "customerName": "Bapak Rizki",
  "ticketNumber": "TKT001",
  "createdDate": "14 Okt 2025",
  "currentStatus": "In Progress",
  "technicianName": "Ahmad Fajar"
}
```

---

### **B. EDIT EXISTING TEMPLATE**

**Steps:**
```
1. Find template in grid
2. Click "Edit" button (pencil icon)
3. Modal opens dengan data ter-fill
4. Modify fields as needed
5. Click "Update Template"
6. ✅ Changes saved immediately
```

**What Can Be Edited:**
- ✅ Name
- ✅ Category
- ✅ Description
- ✅ Template message
- ✅ Variables (test data)
- ✅ Active status

**What Cannot Be Edited:**
- ❌ Code (unique identifier, permanent)

---

### **C. PREVIEW TEMPLATE**

**Steps:**
```
1. Click "Preview" button (eye icon)
2. WhatsApp mockup muncul
3. See rendered message
4. Check variables list
5. Click "Close" to exit
```

**Preview Shows:**
- ✅ Template message (raw dengan {{variables}})
- ✅ WhatsApp-style bubble
- ✅ Timestamp
- ✅ Available variables dengan example values

---

### **D. DELETE TEMPLATE**

**Steps:**
```
1. Click "Delete" button (trash icon)
2. Confirm deletion
3. ✅ Template removed from database
```

**Note:** Hati-hati! Deletion permanent. Pastikan template tidak digunakan oleh sistem.

---

### **E. TEST SEND**

**Steps:**
```
1. Click template untuk detail
2. Click "Test Send" button
3. Enter phone number (format: 628xxx)
4. Message sent dengan sample variables
5. Check WhatsApp for delivery
6. Usage count increments
```

---

## 🔤 **VARIABLE SYNTAX**

### **Basic Variables:**
```
{{variableName}}
```

**Example:**
```
Template: Hi {{customerName}}, ticket #{{ticketNumber}} assigned
Variables: {"customerName": "Bapak Rizki", "ticketNumber": "TKT001"}
Result: Hi Bapak Rizki, ticket #TKT001 assigned
```

### **Common Variables:**

**Ticket Notifications:**
- `{{ticketNumber}}` - Nomor tiket
- `{{customerName}}` - Nama customer
- `{{technicianName}}` - Nama teknisi
- `{{priority}}` - Priority level
- `{{status}}` - Status tiket
- `{{issue}}` - Deskripsi masalah
- `{{sla}}` - SLA hours
- `{{deadline}}` - Deadline waktu

**Payment Notifications:**
- `{{invoiceNumber}}` - Nomor invoice
- `{{amount}}` - Jumlah tagihan
- `{{dueDate}}` - Tanggal jatuh tempo
- `{{daysRemaining}}` - Hari tersisa
- `{{packageName}}` - Nama paket

**Customer Notifications:**
- `{{customerName}}` - Nama customer
- `{{customerId}}` - ID customer
- `{{packageName}}` - Paket langganan
- `{{wifiSSID}}` - Nama WiFi
- `{{wifiPassword}}` - Password WiFi

---

## 📊 **CATEGORIES**

### **1. Ticket** (Blue)
Templates untuk ticket management:
- Ticket Assignment
- Status Updates
- SLA Warnings
- Follow-ups

### **2. Payment** (Green)
Templates untuk billing:
- Payment Reminders
- Payment Confirmations
- Overdue Notifications

### **3. Customer** (Purple)
Templates untuk customer service:
- Welcome Messages
- Installation Schedules
- Maintenance Notifications
- Registration Confirmations

### **4. Team** (Orange)
Templates untuk internal team:
- Daily Summaries
- Performance Reports
- Emergency Alerts

### **5. Marketing** (Pink)
Templates untuk marketing:
- Upgrade Offers
- Promotion Campaigns
- Seasonal Offers

---

## 🔒 **PERMISSIONS**

### **Who Can Access:**
- ✅ Admin (full access)
- ✅ Supervisor (create, edit, delete)
- ❌ Manager (read only via API)
- ❌ Others (no access)

### **Actions:**
- **View:** Admin, Supervisor
- **Create:** Admin, Supervisor
- **Edit:** Admin, Supervisor
- **Delete:** Admin only
- **Test:** All with access

---

## 💡 **BEST PRACTICES**

### **Template Code Naming:**
```
✅ Good:
- TICKET_ASSIGNMENT
- PAYMENT_REMINDER_3DAY
- WELCOME_NEW_CUSTOMER
- DAILY_SUMMARY_MANAGER

❌ Bad:
- ticket assignment (has spaces)
- payment-reminder (has dashes)
- welcome (not descriptive)
```

### **Message Template:**
```
✅ Good:
- Clear & concise
- Professional tone
- Use emojis sparingly
- Include CTA if needed
- Personalized with variables

❌ Bad:
- Too long (> 1000 chars)
- Too many emojis
- No personalization
- Unclear message
```

### **Variables:**
```
✅ Good:
- Descriptive names (customerName, not name)
- camelCase format
- Provide realistic test data
- Document all variables

❌ Bad:
- Single letters (n, p, d)
- Unclear (data1, data2)
- Empty test data
```

---

## 🧪 **TESTING**

### **Test New Template:**
```
1. Create template
2. Click "Preview" → Check rendering
3. Click "Test Send" → Enter your phone
4. Check WhatsApp → Verify message
5. Check database → Verify usage count incremented
```

### **Test Edit:**
```
1. Edit template message
2. Save
3. Preview again → Verify changes
4. Test send → Verify updated message delivered
```

---

## 📊 **TEMPLATE USAGE TRACKING**

**Database Tracks:**
- `usage_count` - Berapa kali template digunakan
- `last_used_at` - Kapan terakhir digunakan

**View Stats:**
```sql
SELECT 
  code,
  name,
  category,
  usage_count,
  last_used_at
FROM whatsapp_message_templates
ORDER BY usage_count DESC;
```

**Most Used Templates:**
- Identify popular notifications
- Optimize frequently used messages
- Remove unused templates

---

## 🎨 **UI SCREENSHOTS GUIDE**

### **Main Page:**
```
┌─────────────────────────────────────────────────┐
│ 📱 WhatsApp Message Templates                  │
│ Kelola template pesan WhatsApp                 │
│                         [+ Tambah Template]     │
├─────────────────────────────────────────────────┤
│ 🔍 Search...                                    │
│ [All] [Ticket] [Payment] [Customer] [Team] [...│
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ TICKET  │ │ PAYMENT │ │ CUSTOMER│           │
│ │ Ticket  │ │ Payment │ │ Welcome │           │
│ │ Assign  │ │ Reminder│ │ Message │           │
│ │ ──────  │ │ ──────  │ │ ──────  │           │
│ │Template │ │Template │ │Template │           │
│ │Preview  │ │Preview  │ │Preview  │           │
│ │[👁][✏][🗑]│ │[👁][✏][🗑]│ │[👁][✏][🗑]│           │
│ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────┘
```

---

## 🚀 **PRODUCTION USAGE**

**Daily Workflow:**
1. **Monitor usage** - Check which templates used most
2. **Update content** - Improve based on feedback
3. **A/B testing** - Create variations, compare
4. **Seasonal updates** - Update for holidays, promos
5. **Performance** - Track delivery success rate

**Monthly Review:**
1. Review all templates
2. Update outdated content
3. Remove unused templates
4. Create new as needed
5. Optimize based on metrics

---

## 🎊 **SUMMARY**

**Jawaban Pertanyaan Anda:**

> *"apakah template tersedia halaman nya? dimana saya bisa memainten template pesan itu?"*

**✅ JAWABAN:**

**Halaman:** `/master-data/whatsapp-templates`  
**Access:** Master Data → WhatsApp Templates (di sidebar)

**Anda bisa:**
- ✅ Lihat semua templates
- ✅ Create template baru
- ✅ Edit template existing
- ✅ Delete template
- ✅ Preview di WhatsApp mockup
- ✅ Test send ke phone
- ✅ Filter by category
- ✅ Search templates

**Tanpa coding!** Semua via UI! 🎨

---

**Buka browser dan navigate ke:**
`https://portal.aglis.biz.id/master-data/whatsapp-templates`

**Login sebagai admin, dan Anda bisa maintain semua template pesan WhatsApp! 📱✨**

