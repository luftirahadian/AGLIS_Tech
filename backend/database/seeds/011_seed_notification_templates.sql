-- Seed WhatsApp Message Templates
-- Sync dari whatsappTemplates.js ke database

-- Clear existing if needed (optional)
-- TRUNCATE whatsapp_message_templates RESTART IDENTITY CASCADE;

-- Phase 1 Templates
INSERT INTO whatsapp_message_templates (code, name, description, category, template, variables, example_message, is_active) VALUES
('TICKET_ASSIGNMENT', 'Ticket Assignment - Teknisi', 'Notifikasi assignment tiket ke teknisi', 'ticket',
'📩 *TIKET BARU ASSIGNED*

Ticket: #{{ticketNumber}}
Customer: {{customerName}}
Location: {{location}}
Priority: {{priorityEmoji}} {{priority}}

Issue: {{issue}}
SLA: {{sla}} jam
Deadline: {{deadline}}

📍 View Detail: {{ticketUrl}}

_Mohon segera ditangani. Terima kasih!_',
'{"ticketNumber": "TKT20251015001", "customerName": "PT Telkom", "location": "Karawang", "priority": "URGENT", "priorityEmoji": "🔴", "issue": "Internet down", "sla": "4", "deadline": "15 Oct 14:00", "ticketUrl": "portal.aglis.biz.id/tickets/123"}',
'📩 *TIKET BARU ASSIGNED*

Ticket: #TKT20251015001
Customer: PT Telkom Indonesia
Priority: 🔴 URGENT

Issue: Internet down
SLA: 4 jam
Deadline: 15 Oct 2025, 14:00',
true),

('TICKET_STATUS_UPDATE', 'Ticket Status Update - Customer', 'Update status tiket ke customer', 'ticket',
'{{statusEmoji}} *UPDATE TIKET ANDA*

Ticket: #{{ticketNumber}}
Status: {{oldStatus}} → {{newStatus}}

{{#if technicianName}}Teknisi: {{technicianName}}{{/if}}
{{#if completedAt}}Selesai: {{completedAt}}{{/if}}
{{#if duration}}Durasi: {{duration}}{{/if}}

{{statusMessage}}',
'{"ticketNumber": "TKT001", "oldStatus": "open", "newStatus": "completed", "technicianName": "Ahmad Fajar", "completedAt": "15 Oct 13:45", "duration": "2 jam 15 menit", "statusEmoji": "✅", "statusMessage": "Terima kasih!"}',
'✅ *UPDATE TIKET ANDA*

Ticket: #TKT001
Status: in_progress → completed

Teknisi: Ahmad Fajar
Selesai: 15 Oct 13:45',
true),

('SLA_WARNING', 'SLA Warning - Supervisor', 'Peringatan SLA mendekati deadline', 'ticket',
'⚠️ *SLA WARNING*

Ticket: #{{ticketNumber}}
Customer: {{customerName}}
Teknisi: {{technicianName}}

SLA Target: {{slaTarget}} jam
Remaining: {{remaining}} ⏰
Progress: {{progress}}%

🚨 Ticket mendekati deadline!

📍 View: {{ticketUrl}}

_Butuh escalation?_',
'{"ticketNumber": "TKT001", "customerName": "PT Telkom", "technicianName": "Ahmad Fajar", "slaTarget": "4", "remaining": "45 menit", "progress": "75", "ticketUrl": "portal.aglis.biz.id/tickets/123"}',
'⚠️ *SLA WARNING*

Ticket: #TKT001
Remaining: 45 menit
Progress: 75%',
true),

('PAYMENT_REMINDER', 'Payment Reminder - Customer', 'Reminder tagihan mendekati due date', 'payment',
'{{urgencyEmoji}} *{{urgencyText}}REMINDER TAGIHAN*

Dear {{customerName}},

Invoice: #{{invoiceNumber}}
Tagihan Bulan: {{month}}
Paket: {{packageName}}
Amount: Rp {{amount}}

Due Date: {{dueDate}} ({{daysRemaining}} hari lagi)

💰 *Cara Bayar:*
{{#each paymentMethods}}• {{this}}
{{/each}}

📱 Portal: {{portalUrl}}

{{warningMessage}}',
'{"customerName": "Bapak Rizki", "invoiceNumber": "INV-001", "month": "Oktober 2025", "packageName": "100 Mbps", "amount": "350,000", "dueDate": "25 Okt 2025", "daysRemaining": "3", "urgencyEmoji": "💳", "urgencyText": "", "warningMessage": "Terima kasih!", "portalUrl": "portal.aglis.biz.id"}',
'💳 *REMINDER TAGIHAN*

Amount: Rp 350,000
Due: 25 Okt (3 hari lagi)',
true);

-- Phase 2 Templates
INSERT INTO whatsapp_message_templates (code, name, description, category, template, variables, is_active) VALUES
('INSTALLATION_SCHEDULE', 'Installation Schedule - Customer', 'Jadwal instalasi ke customer', 'customer',
'🎉 *JADWAL INSTALASI ANDA*

Dear {{customerName}},

Package: {{packageName}}
Address: {{address}}

📅 Tanggal: {{date}}
⏰ Waktu: {{time}}
👷 Teknisi: {{technicianName}}
📞 Phone: {{technicianPhone}}

📝 *Persiapan:*
{{#each preparations}}• {{this}}
{{/each}}

_Mohon pastikan ada yang menerima teknisi._',
'{"customerName": "Bapak Rizki", "packageName": "100 Mbps", "address": "Jl. Sudirman", "date": "20 Okt 2025", "time": "10:00-12:00", "technicianName": "Ahmad", "technicianPhone": "0821-xxx"}',
true),

('MAINTENANCE_NOTIFICATION', 'Maintenance Notification - Customer', 'Pemberitahuan maintenance ke customer', 'customer',
'🔧 *PEMBERITAHUAN MAINTENANCE*

Dear Customer,

Kami akan melakukan {{type}}:

📅 Tanggal: {{startDate}}
⏰ Waktu: {{startTime}} ({{duration}})
🌍 Area: {{area}}

{{#if impact}}⚠️ Impact: {{impact}}{{/if}}

Tujuan: {{reason}}

Mohon maaf atas ketidaknyamanan 🙏',
'{"type": "Network Upgrade", "startDate": "20 Okt", "startTime": "01:00", "duration": "4 jam", "area": "Karawang", "impact": "Internet terputus", "reason": "Upgrade capacity"}',
true),

('REGISTRATION_CONFIRMATION', 'Registration Confirmation - Customer', 'Konfirmasi pendaftaran customer baru', 'customer',
'🎉 *REGISTRASI BERHASIL!*

Dear {{customerName}},

Registration: #{{registrationNumber}}
Package: {{packageName}}
Price: Rp {{price}}/bulan

Status: ✅ Diterima & Diproses

*Next Steps:*
✅ 1. Verifikasi data (Done)
⏳ 2. Survey lokasi (Pending)
⏳ 3. Instalasi
⏳ 4. Aktivasi

📱 Track: {{trackingUrl}}

Tim kami akan menghubungi dalam 1x24 jam',
'{"customerName": "Bapak Rizki", "registrationNumber": "REG001", "packageName": "100 Mbps", "price": "350,000", "trackingUrl": "portal.aglis.biz.id/track/REG001"}',
true),

('DAILY_SUMMARY', 'Daily Summary - Manager', 'Laporan harian ke manager/supervisor', 'team',
'📊 *DAILY REPORT - {{date}}*

*Tickets:*
• Total: {{totalTickets}} tickets
• Completed: {{completed}} ✅
• In Progress: {{inProgress}} 🔄
• Pending: {{pending}} ⏳

*Technicians:*
• Active: {{activeTechnicians}}/{{totalTechnicians}}
• Avg Completion: {{avgCompletion}} tickets/tech
• SLA Achievement: {{slaAchievement}}%

{{#if overdueTickets}}*Issues:*
🔴 {{overdueTickets}} tickets overdue{{/if}}

📈 Dashboard: {{dashboardUrl}}',
'{"date": "15 Okt 2025", "totalTickets": "25", "completed": "18", "inProgress": "5", "pending": "2", "activeTechnicians": "8", "totalTechnicians": "10", "avgCompletion": "2.3", "slaAchievement": "92", "overdueTickets": "2", "dashboardUrl": "portal.aglis.biz.id"}',
true),

('EMERGENCY_ALERT', 'Emergency Alert - All Team', 'Alert emergency ke semua team', 'team',
'🚨 *EMERGENCY ALERT*

Type: {{type}}
Area: {{area}}
Impact: {{customersAffected}} customers affected

Status: {{status}}
ETA: {{eta}}

*Actions:*
{{#each actions}}• {{this}}
{{/each}}

_Updates: Every 30 minutes_

⚠️ All hands on deck!',
'{"type": "Network Outage", "area": "Karawang", "customersAffected": "150", "status": "INVESTIGATING", "eta": "2 hours", "actions": ["NOC: Investigating", "CS: Notify customers"]}',
true);

-- Phase 3 Templates
INSERT INTO whatsapp_message_templates (code, name, description, category, template, variables, is_active) VALUES
('WELCOME_MESSAGE', 'Welcome Message - New Customer', 'Pesan selamat datang customer baru', 'customer',
'🎉 *SELAMAT DATANG DI AGLIS NET!*

Dear {{customerName}},

Selamat! Instalasi selesai dan internet Anda sudah AKTIF! 🚀

👤 Customer ID: {{customerId}}
📦 Package: {{packageName}} ({{speedMbps}} Mbps)
💰 Tagihan: Rp {{price}}/bulan
📅 Tanggal Tagihan: Setiap tanggal {{billingDate}}

🌐 *WiFi Info:*
📶 SSID: {{wifiName}}
🔒 Password: {{wifiPassword}}

📞 Support: {{supportPhone}}
📱 Portal: portal.aglis.biz.id

Nikmati internet cepat & stabil! 🌟',
'{"customerName": "Bapak Rizki", "customerId": "AGLS001", "packageName": "100 Mbps", "speedMbps": "100", "price": "350,000", "billingDate": "1", "wifiName": "AGLIS-NET-001", "wifiPassword": "pass123", "supportPhone": "0821-xxx"}',
true),

('UPGRADE_OFFER', 'Package Upgrade Offer - Marketing', 'Penawaran upgrade paket', 'marketing',
'🎁 *SPECIAL UPGRADE OFFER!*

Hi {{customerName}}! 👋

*Paket Saat Ini:*
📦 {{currentPackage}} - {{currentSpeed}} Mbps
💰 Rp {{currentPrice}}/bulan

*🔥 UPGRADE KE:*
📦 {{upgradePackage}} - {{upgradeSpeed}} Mbps
💰 Rp {{upgradePrice}}/bulan
🎉 DISKON: {{discount}}%!

*Hanya tambah:* Rp {{priceDiff}}/bulan!

Benefits:
{{#each benefits}}✅ {{this}}
{{/each}}

⏰ Valid: {{validUntil}}

Reply "YES" atau hub CS!',
'{"customerName": "Bapak Rizki", "currentPackage": "50 Mbps", "currentSpeed": "50", "currentPrice": "250,000", "upgradePackage": "100 Mbps", "upgradeSpeed": "100", "upgradePrice": "350,000", "discount": "20", "priceDiff": "100,000", "benefits": ["2x faster", "HD streaming"], "validUntil": "31 Okt"}',
true),

('SATISFACTION_SURVEY', 'Satisfaction Survey - Customer', 'Survey kepuasan customer', 'customer',
'⭐ *RATE OUR SERVICE*

Hi {{customerName}}!

Teknisi {{technicianName}} sudah complete:
🎫 Ticket: #{{ticketNumber}}
📋 Service: {{serviceType}}
✅ Done: {{completedDate}}

*Bagaimana pengalaman Anda?*

⭐⭐⭐⭐⭐ - Excellent
⭐⭐⭐⭐ - Good
⭐⭐⭐ - Average

📝 Reply 1-5 atau klik:
{{surveyUrl}}

Feedback Anda sangat berharga! 🙏',
'{"customerName": "Bapak Rizki", "technicianName": "Ahmad", "ticketNumber": "TKT001", "serviceType": "FTTH Repair", "completedDate": "15 Okt", "surveyUrl": "portal.aglis.biz.id/survey/123"}',
true),

('TECHNICIAN_PERFORMANCE', 'Performance Report - Technician', 'Laporan performa teknisi', 'team',
'🏆 *YOUR PERFORMANCE REPORT*

Hey {{technicianName}}! 👋

*{{period}} Summary:*

📊 *Statistics:*
• Completed: {{ticketsCompleted}} ✅
• Avg Rating: {{averageRating}}/5.0 ⭐
• SLA: {{slaAchievement}}%
• Rank: #{{rank}} of {{totalTechnicians}}

{{#if topPerformerBonus}}🎁 Bonus: Rp {{topPerformerBonus}} (Top Performer!){{/if}}

Continue the great work! 💪',
'{"technicianName": "Ahmad Fajar", "period": "This Week", "ticketsCompleted": "15", "averageRating": "4.8", "slaAchievement": "100", "rank": "2", "totalTechnicians": "10", "topPerformerBonus": "500,000"}',
true),

('PROMOTION_CAMPAIGN', 'Promotion Campaign - Marketing', 'Kampanye promosi ke customer', 'marketing',
'🎉 *{{campaignTitle}}*

Hi {{customerName}}! 👋

{{offer}}

{{#if discount}}🔥 DISKON {{discount}}%!{{/if}}

⏰ Berlaku sampai: {{validUntil}}

{{#if terms}}*Syarat:*
{{#each terms}}• {{this}}
{{/each}}{{/if}}

*{{ctaText}}*
👉 {{ctaLink}}

_Limited time offer!_ ⚡',
'{"customerName": "Bapak Rizki", "campaignTitle": "RAMADAN PROMO 2025", "offer": "Upgrade gratis ke 100 Mbps!", "discount": "50", "validUntil": "31 Mar 2025", "terms": ["Min 6 bulan"], "ctaText": "Ambil Sekarang", "ctaLink": "portal.aglis.biz.id/promo"}',
true);

-- Update sequence
SELECT setval('whatsapp_message_templates_id_seq', (SELECT MAX(id) FROM whatsapp_message_templates));

-- Display count
SELECT 
  category,
  COUNT(*) as template_count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM whatsapp_message_templates
GROUP BY category
ORDER BY category;

SELECT 'WhatsApp Templates Seeded: ' || COUNT(*) || ' templates' as status
FROM whatsapp_message_templates;

