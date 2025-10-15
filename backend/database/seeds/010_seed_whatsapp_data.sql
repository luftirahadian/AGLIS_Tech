-- Seed: Initial WhatsApp Groups and Templates
-- Created: 2025-10-15
-- Purpose: Populate initial WhatsApp groups and message templates

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Seed WhatsApp Groups (7 groups)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO whatsapp_groups (name, description, category, work_zone, notification_types, priority_filter, is_active, created_by) VALUES
-- Technician Groups (per work zone)
('Teknisi Karawang', 'WhatsApp group untuk teknisi area Karawang', 'technicians', 'karawang', 
 '["ticket_assigned", "new_ticket", "sla_warning", "urgent_alert"]', 'normal', true, 1),

('Teknisi Bekasi', 'WhatsApp group untuk teknisi area Bekasi', 'technicians', 'bekasi', 
 '["ticket_assigned", "new_ticket", "sla_warning", "urgent_alert"]', 'normal', true, 1),

('Teknisi Cikampek', 'WhatsApp group untuk teknisi area Cikampek', 'technicians', 'cikampek', 
 '["ticket_assigned", "new_ticket", "sla_warning", "urgent_alert"]', 'normal', true, 1),

-- Management Groups
('Supervisor Team', 'WhatsApp group untuk para supervisor', 'supervisors', NULL, 
 '["sla_warning", "escalation", "daily_summary", "urgent_alert"]', 'high', true, 1),

('NOC Team', 'WhatsApp group untuk Network Operations Center', 'noc', NULL, 
 '["system_alert", "outage", "critical_incident", "performance_alert"]', 'high', true, 1),

('Management', 'WhatsApp group untuk manajemen', 'managers', NULL, 
 '["weekly_report", "kpi_alert", "critical_incident", "escalation"]', 'high', true, 1),

('Customer Service Team', 'WhatsApp group untuk customer service', 'customer_service', NULL, 
 '["new_registration", "customer_complaint", "payment_alert"]', 'normal', true, 1)

ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. Seed WhatsApp Message Templates
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO whatsapp_message_templates (code, name, description, category, template, variables, example_message, created_by) VALUES

-- Ticket Templates
('TICKET_ASSIGNED', 
 'Ticket Assignment Notification', 
 'Notifikasi ketika ticket di-assign ke teknisi',
 'ticket',
 E'🎫 *TICKET BARU ASSIGNED*\n\nTicket: {{ticket_id}}\nCustomer: {{customer_name}}\nLokasi: {{work_zone}}\nIssue: {{issue_type}}\nPriority: {{priority}}\n\n📍 {{address}}\n📞 {{customer_phone}}\n\n🔗 Detail: {{ticket_url}}',
 '["ticket_id", "customer_name", "work_zone", "issue_type", "priority", "address", "customer_phone", "ticket_url"]',
 E'🎫 *TICKET BARU ASSIGNED*\n\nTicket: TKT001\nCustomer: PT. ABC Indonesia\nLokasi: Karawang\nIssue: Installation FTTH\nPriority: High\n\n📍 Jl. Raya Karawang No. 123\n📞 08123456789\n\n🔗 Detail: https://portal.aglis.biz.id/tickets/TKT001',
 1),

('TICKET_STATUS_CHANGED',
 'Ticket Status Update',
 'Notifikasi ketika status ticket berubah',
 'ticket',
 E'🔄 *TICKET STATUS UPDATE*\n\nTicket: {{ticket_id}}\nStatus: {{old_status}} → {{new_status}}\nTechnician: {{technician_name}}\n\n{{additional_notes}}',
 '["ticket_id", "old_status", "new_status", "technician_name", "additional_notes"]',
 E'🔄 *TICKET STATUS UPDATE*\n\nTicket: TKT001\nStatus: Assigned → In Progress\nTechnician: Ahmad Fauzi\n\nPekerjaan dimulai, estimasi selesai 2 jam',
 1),

('SLA_WARNING',
 'SLA Deadline Warning',
 'Peringatan mendekati SLA deadline',
 'ticket',
 E'⚠️ *SLA WARNING*\n\nTicket: {{ticket_id}}\nCustomer: {{customer_name}}\nStatus: {{status}}\nDeadline: {{sla_deadline}}\nRemaining: {{remaining_time}}\n\n⚡ *ACTION REQUIRED!*',
 '["ticket_id", "customer_name", "status", "sla_deadline", "remaining_time"]',
 E'⚠️ *SLA WARNING*\n\nTicket: TKT001\nCustomer: PT. ABC Indonesia\nStatus: Assigned\nDeadline: 15 Okt 16:00\nRemaining: 2 jam\n\n⚡ *ACTION REQUIRED!*',
 1),

('NEW_TICKET_AVAILABLE',
 'New Open Ticket for Assignment',
 'Notifikasi ticket baru yang belum di-assign',
 'ticket',
 E'🆕 *TICKET BARU TERSEDIA*\n\nTicket: {{ticket_id}}\nCustomer: {{customer_name}}\nLokasi: {{work_zone}}\nIssue: {{issue_type}}\nPriority: {{priority}}\n\n📍 {{address}}\n\n💡 Siapa yang available untuk handle?',
 '["ticket_id", "customer_name", "work_zone", "issue_type", "priority", "address"]',
 E'🆕 *TICKET BARU TERSEDIA*\n\nTicket: TKT002\nCustomer: CV. XYZ\nLokasi: Karawang\nIssue: Repair - No Signal\nPriority: High\n\n📍 Jl. Industri Raya No. 45\n\n💡 Siapa yang available untuk handle?',
 1),

-- Customer Templates
('REGISTRATION_APPROVED',
 'Customer Registration Approved',
 'Notifikasi persetujuan registrasi customer',
 'customer',
 E'✅ *REGISTRASI DISETUJUI*\n\nSelamat! Registrasi Anda telah disetujui.\n\nCustomer ID: {{customer_id}}\nNama: {{customer_name}}\nPaket: {{package_name}}\nKecepatan: {{speed}}\nBiaya: {{monthly_fee}}/bulan\n\nTim kami akan segera menghubungi Anda untuk jadwal instalasi.\n\nTerima kasih! 🙏',
 '["customer_id", "customer_name", "package_name", "speed", "monthly_fee"]',
 E'✅ *REGISTRASI DISETUJUI*\n\nSelamat! Registrasi Anda telah disetujui.\n\nCustomer ID: CUST001\nNama: Ahmad Yani\nPaket: Premium FTTH\nKecepatan: 50 Mbps\nBiaya: Rp 350.000/bulan\n\nTim kami akan segera menghubungi Anda untuk jadwal instalasi.\n\nTerima kasih! 🙏',
 1),

('PAYMENT_RECEIVED',
 'Payment Confirmation',
 'Konfirmasi pembayaran diterima',
 'customer',
 E'💰 *PEMBAYARAN DITERIMA*\n\nTerima kasih atas pembayaran Anda!\n\nInvoice: {{invoice_number}}\nJumlah: {{amount}}\nMetode: {{payment_method}}\nTanggal: {{payment_date}}\n\nLayanan Anda aktif hingga {{next_due_date}}\n\nAGLIS Net - Connecting You Better 🌐',
 '["invoice_number", "amount", "payment_method", "payment_date", "next_due_date"]',
 E'💰 *PEMBAYARAN DITERIMA*\n\nTerima kasih atas pembayaran Anda!\n\nInvoice: INV-2025-001\nJumlah: Rp 350.000\nMetode: Transfer BCA\nTanggal: 15 Okt 2025\n\nLayanan Anda aktif hingga 15 Nov 2025\n\nAGLIS Net - Connecting You Better 🌐',
 1),

-- System Templates
('DAILY_SUMMARY',
 'Daily Operations Summary',
 'Summary harian untuk management',
 'report',
 E'📊 *DAILY REPORT*\n{{date}}\n\n*Tickets*\nTotal: {{total_tickets}}\n✅ Completed: {{completed}}\n🔄 In Progress: {{in_progress}}\n📋 Assigned: {{assigned}}\n🆕 Open: {{open}}\n\n*Performance*\nSLA Compliance: {{sla_compliance}}%\nAvg Resolution: {{avg_resolution}}h\nCustomer Rating: {{avg_rating}}/5\n\n*Technicians*\nActive: {{active_techs}}\nBusy: {{busy_techs}}\nAvailable: {{available_techs}}',
 '["date", "total_tickets", "completed", "in_progress", "assigned", "open", "sla_compliance", "avg_resolution", "avg_rating", "active_techs", "busy_techs", "available_techs"]',
 E'📊 *DAILY REPORT*\n15 Oktober 2025\n\n*Tickets*\nTotal: 25\n✅ Completed: 18\n🔄 In Progress: 4\n📋 Assigned: 2\n🆕 Open: 1\n\n*Performance*\nSLA Compliance: 95%\nAvg Resolution: 3.2h\nCustomer Rating: 4.7/5\n\n*Technicians*\nActive: 13\nBusy: 4\nAvailable: 9',
 1),

('SYSTEM_ALERT',
 'System Alert Notification',
 'Peringatan system issue',
 'system',
 E'🚨 *SYSTEM ALERT*\n\nType: {{alert_type}}\nSeverity: {{severity}}\n\n{{message}}\n\n*Time:* {{timestamp}}\n*Affected:* {{affected_services}}\n\n⚡ *IMMEDIATE ATTENTION REQUIRED*',
 '["alert_type", "severity", "message", "timestamp", "affected_services"]',
 E'🚨 *SYSTEM ALERT*\n\nType: Network Outage\nSeverity: CRITICAL\n\nOLT-KRW-01 tidak merespon. 150 customers affected.\n\n*Time:* 15 Okt 14:30\n*Affected:* Karawang Area\n\n⚡ *IMMEDIATE ATTENTION REQUIRED*',
 1)

ON CONFLICT (code) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. Seed Default Notification Routing Rules
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO notification_routing_rules (notification_type, name, description, send_to_individual, send_to_groups, target_groups, conditions, message_template, priority, created_by) VALUES

-- Ticket Assignment
('ticket_assigned', 
 'Ticket Assignment - Personal',
 'Send personal WhatsApp to assigned technician',
 true, false, NULL,
 '{"priority": ["normal", "high", "urgent"]}',
 'TICKET_ASSIGNED',
 100, 1),

('ticket_assigned',
 'Ticket Assignment - Group Notification',
 'Notify work zone technician group',
 false, true, ARRAY[1, 2, 3], -- Technician groups
 '{"priority": ["high", "urgent"]}',
 'NEW_TICKET_AVAILABLE',
 50, 1),

-- SLA Warning
('sla_warning',
 'SLA Warning - Technician & Supervisor',
 'Alert technician and supervisor group when approaching SLA',
 true, true, ARRAY[4], -- Supervisor group
 '{"remaining_hours": "<= 2"}',
 'SLA_WARNING',
 200, 1),

-- New Open Ticket
('new_ticket',
 'New Ticket - Technician Group',
 'Broadcast new open ticket to technician group by work zone',
 false, true, ARRAY[1, 2, 3],
 '{"status": "open"}',
 'NEW_TICKET_AVAILABLE',
 80, 1),

-- Daily Summary
('daily_summary',
 'Daily Summary - Management',
 'Send daily operations summary to management group',
 false, true, ARRAY[6], -- Management group
 '{}',
 'DAILY_SUMMARY',
 10, 1),

-- System Alert
('system_alert',
 'System Alert - NOC Team',
 'Critical system alerts to NOC team',
 false, true, ARRAY[5], -- NOC group
 '{"severity": ["high", "critical"]}',
 'SYSTEM_ALERT',
 300, 1),

-- Customer Registration
('registration_approved',
 'Registration Approved - Customer',
 'Send approval notification to customer',
 true, false, NULL,
 '{}',
 'REGISTRATION_APPROVED',
 100, 1),

-- Payment Confirmation
('payment_received',
 'Payment Confirmation - Customer',
 'Send payment receipt to customer',
 true, false, NULL,
 '{}',
 'PAYMENT_RECEIVED',
 100, 1)

ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. Update existing notification_settings to enable WhatsApp
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable WhatsApp notifications for all users by default
UPDATE notification_settings 
SET whatsapp_notifications = TRUE 
WHERE whatsapp_notifications IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Seed completed successfully
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  (SELECT COUNT(*) FROM whatsapp_groups WHERE is_active = true) as groups_created,
  (SELECT COUNT(*) FROM whatsapp_message_templates WHERE is_active = true) as templates_created,
  (SELECT COUNT(*) FROM notification_routing_rules WHERE is_active = true) as rules_created;

