# 🔧 Multi-Technician Assignment - Design Document

**Feature:** Assign multiple technicians to one ticket  
**Use Case:** Pekerjaan yang membutuhkan lebih dari 1 teknisi  
**Date:** October 16, 2025  

---

## 📋 **CURRENT STATE:**

**Database:**
```sql
tickets table:
- assigned_technician_id INTEGER (singular)
- Foreign key to technicians(id)
```

**Limitation:**
- ❌ Hanya bisa assign 1 teknisi per ticket
- ❌ Tidak bisa assign tim untuk pekerjaan besar

---

## 🎯 **PROPOSED SOLUTION:**

### **Option 1: Many-to-Many Table (RECOMMENDED)**

**Advantages:**
- ✅ Unlimited technicians per ticket
- ✅ Track individual technician contribution
- ✅ Maintain existing data
- ✅ Backward compatible
- ✅ Can track lead technician
- ✅ Flexible for future features

**Implementation:**
```sql
CREATE TABLE ticket_technicians (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'lead', 'member', 'support'
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(ticket_id, technician_id)
);

CREATE INDEX idx_ticket_technicians_ticket ON ticket_technicians(ticket_id);
CREATE INDEX idx_ticket_technicians_tech ON ticket_technicians(technician_id);
```

**Keep existing column for backward compatibility:**
```sql
-- assigned_technician_id will be the LEAD technician
-- ticket_technicians table contains ALL technicians (including lead)
```

---

### **Option 2: JSONB Array (Alternative)**

**Advantages:**
- ✅ Simple structure
- ✅ No additional table

**Disadvantages:**
- ❌ Harder to query/join
- ❌ No referential integrity
- ❌ Limited flexibility

**Implementation:**
```sql
ALTER TABLE tickets 
ADD COLUMN assigned_technicians JSONB DEFAULT '[]'::jsonb;

-- Example data:
[
  {
    "technician_id": 1,
    "technician_name": "John Doe",
    "role": "lead",
    "assigned_at": "2025-10-16T10:00:00Z"
  },
  {
    "technician_id": 2,
    "technician_name": "Jane Smith",
    "role": "member",
    "assigned_at": "2025-10-16T10:00:00Z"
  }
]
```

---

## 🎯 **RECOMMENDED: OPTION 1 (Many-to-Many)**

### **Database Schema:**

```sql
-- New table
CREATE TABLE ticket_technicians (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'lead', 'member', 'support'
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    notes TEXT, -- Optional notes about this technician's role
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_ticket_technician UNIQUE(ticket_id, technician_id)
);

CREATE INDEX idx_ticket_technicians_ticket ON ticket_technicians(ticket_id);
CREATE INDEX idx_ticket_technicians_tech ON ticket_technicians(technician_id);
CREATE INDEX idx_ticket_technicians_active ON ticket_technicians(is_active) WHERE is_active = TRUE;

-- Keep assigned_technician_id for backward compatibility
-- This will store the LEAD technician
```

---

## 🔄 **DATA MIGRATION:**

**Migrate existing assignments:**
```sql
-- Insert existing single assignments into ticket_technicians
INSERT INTO ticket_technicians (ticket_id, technician_id, role, assigned_at, is_active)
SELECT 
    id as ticket_id,
    assigned_technician_id as technician_id,
    'lead' as role,
    created_at as assigned_at,
    TRUE as is_active
FROM tickets
WHERE assigned_technician_id IS NOT NULL;
```

---

## 🎨 **UI/UX DESIGN:**

### **Ticket Assignment UI:**

**Before (Single Select):**
```
Assign Technician: [Dropdown - Select one]
```

**After (Multi-Select):**
```
Assign Technicians:

[x] John Doe (Lead) ⭐
[ ] Jane Smith
[ ] Bob Wilson
[x] Alice Brown (Support)

Total: 3 technicians selected
```

**Features:**
- ✅ Multi-select checkboxes
- ✅ Designate lead technician (radio or star icon)
- ✅ Show technician specialization
- ✅ Filter by skill/availability
- ✅ Show current workload
- ✅ Add/remove dynamically

---

## 📱 **WHATSAPP NOTIFICATIONS:**

### **Current (Single):**
```
🎫 *TICKET ASSIGNED*

Hi {technician_name},
Ticket baru telah di-assign kepada Anda!
```

### **New (Multiple):**

**For Lead Technician:**
```
🎫 *TICKET ASSIGNED - LEAD TECHNICIAN*

Hi {lead_name},
Anda ditunjuk sebagai LEAD TECHNICIAN!

Ticket: #{ticket_number}
Tim: {team_count} teknisi
Members: {tech1}, {tech2}

View: {url}
```

**For Team Members:**
```
🎫 *TICKET ASSIGNED - TEAM MEMBER*

Hi {member_name},
Anda ditambahkan ke tim ticket!

Ticket: #{ticket_number}
Lead: {lead_name}
Role: Team Member

View: {url}
```

---

## 🔌 **BACKEND API CHANGES:**

### **New Endpoints:**

```javascript
// Assign multiple technicians
PUT /api/tickets/:id/assign-team
Body: {
  technicians: [
    { technician_id: 1, role: 'lead' },
    { technician_id: 2, role: 'member' },
    { technician_id: 3, role: 'support' }
  ]
}

// Add technician to existing ticket
POST /api/tickets/:id/add-technician
Body: {
  technician_id: 4,
  role: 'member'
}

// Remove technician from ticket
DELETE /api/tickets/:id/remove-technician/:technicianId

// Update technician role
PATCH /api/tickets/:id/update-technician/:technicianId
Body: { role: 'lead' }
```

### **Modified Endpoints:**

```javascript
// GET /api/tickets/:id - Include all technicians
Response: {
  ...ticket,
  assigned_technician_id: 1, // Lead (backward compatible)
  technicians: [
    {
      id: 1,
      technician_id: 1,
      full_name: "John Doe",
      role: "lead",
      phone: "08123456789",
      assigned_at: "2025-10-16T10:00:00Z"
    },
    {
      id: 2,
      technician_id: 2,
      full_name: "Jane Smith",
      role: "member",
      phone: "08198765432",
      assigned_at: "2025-10-16T10:05:00Z"
    }
  ]
}
```

---

## 🎨 **FRONTEND COMPONENTS:**

### **1. Multi-Technician Selector Component:**

```jsx
<MultiTechnicianSelector
  selectedTechnicians={selectedTechs}
  onChange={setSelectedTechs}
  leadTechnicianId={leadId}
  onLeadChange={setLeadId}
  availableTechnicians={technicians}
/>
```

**Features:**
- Checkbox list of available technicians
- Mark one as lead (radio or star)
- Show specialization badges
- Show current workload indicator
- Search/filter technicians

### **2. Technician Team Display:**

```jsx
<TechnicianTeam
  technicians={ticket.technicians}
  leadId={ticket.assigned_technician_id}
/>
```

**Shows:**
- Lead technician (with ⭐ icon)
- Team members (with role badges)
- Contact buttons for each
- Remove technician option (if permitted)

---

## 📊 **USE CASES:**

### **Use Case 1: Instalasi Besar (2+ teknisi)**
```
Ticket: Instalasi Fiber 50 unit apartment
Lead: Senior Technician (koordinator)
Team: 2-3 Junior Technicians (pelaksana)

Benefits:
- Koordinasi lebih baik
- Tracking per teknisi
- WhatsApp notification ke semua
```

### **Use Case 2: Emergency Repair (tim siaga)**
```
Ticket: Jaringan down area Karawang
Lead: Supervisor
Team: 2 Field Technicians

Benefits:
- Respons cepat
- Pembagian area kerja
- Update real-time dari semua teknisi
```

### **Use Case 3: Training (senior + junior)**
```
Ticket: Instalasi dengan training
Lead: Senior Technician
Support: Junior Technician (training)

Benefits:
- Knowledge transfer
- Supervision
- Skill development tracking
```

---

## 🔄 **BACKWARD COMPATIBILITY:**

**Existing Features Still Work:**
```
✅ Single technician assignment (as before)
✅ assigned_technician_id = lead technician
✅ Existing queries still work
✅ Reports tidak perlu diubah (initially)
✅ WhatsApp notifications tetap terkirim
```

**Gradual Migration:**
```
1. Deploy multi-tech feature
2. Keep using single assignment for simple jobs
3. Use multi-tech for complex jobs
4. Gradually train team
5. Full adoption over time
```

---

## 📈 **IMPACT ANALYSIS:**

### **Database:**
- ✅ New table: ticket_technicians
- ✅ Keep existing: assigned_technician_id
- ✅ Migration: Insert existing assignments
- ✅ Indexes: For performance

### **Backend:**
- ✅ New routes: Team assignment
- ✅ Modified routes: Include technicians array
- ✅ WhatsApp: Send to all team members
- ✅ Backward compatible

### **Frontend:**
- ✅ New component: MultiTechnicianSelector
- ✅ Modified: Ticket detail shows team
- ✅ Modified: Assignment modal supports multi-select
- ✅ New: Team member management UI

---

## ⏱️ **IMPLEMENTATION TIMELINE:**

**Day 1: Database & Backend (4-6 hours)**
- Create ticket_technicians table
- Migrate existing data
- Update API endpoints
- Add team assignment logic

**Day 2: Frontend UI (4-6 hours)**
- Multi-select technician component
- Team display component
- Update ticket detail page
- Update assignment modal

**Day 3: Testing & Polish (2-4 hours)**
- Test single assignment (backward compat)
- Test multi assignment
- WhatsApp notifications
- UI/UX polish

**Total:** 2-3 days for complete implementation

---

## 💰 **BUSINESS VALUE:**

**Benefits:**
```
✅ Handle complex jobs efficiently
✅ Better resource allocation
✅ Team coordination improved
✅ Training opportunities
✅ Emergency response faster
✅ Customer satisfaction higher
```

**Cost:**
```
Development: 2-3 days
Maintenance: Minimal
Training: 1-2 hours for team
ROI: Immediate (better job handling)
```

---

## 🎯 **RECOMMENDATION:**

**I recommend implementing Option 1 (Many-to-Many table) because:**

1. ✅ **Flexible:** Support any number of technicians
2. ✅ **Scalable:** Easy to add features later (work hours, performance tracking)
3. ✅ **Clean:** Proper relational design
4. ✅ **Compatible:** Existing code still works
5. ✅ **Trackable:** Can see history of who worked on what

**Sample Scenarios Where This Helps:**
- Instalasi gedung/apartment (butuh 2-3 teknisi)
- Major outage repair (butuh tim)
- Training on-the-job (senior + junior)
- Complex troubleshooting (spesialis + generalist)
- Emergency response (multiple areas)

---

## 🚀 **READY TO IMPLEMENT?**

**If you approve, I will:**
1. Create ticket_technicians table
2. Migrate existing assignments
3. Update backend API (team assignment)
4. Update frontend UI (multi-select)
5. Update WhatsApp notifications (team notifications)
6. Test with real scenarios

**Estimated:** 2-3 days for full implementation  
**Impact:** Medium (database + backend + frontend)  
**Risk:** Low (backward compatible)  

---

**What do you think? Shall I proceed with implementation? 🚀**

