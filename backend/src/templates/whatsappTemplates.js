/**
 * WhatsApp Notification Templates
 * Phase 1: High Priority Notifications
 * 
 * Templates for:
 * 1. Ticket Assignment (to Technician)
 * 2. Ticket Status Update (to Customer)
 * 3. SLA Warning (to Supervisor)
 * 4. Payment Reminder (to Customer)
 */

const whatsappTemplates = {
  /**
   * 1. TICKET ASSIGNMENT - To Technician
   */
  ticketAssignment: (data) => {
    const { ticketId, ticketNumber, customerName, location, priority, issue, sla, deadline, ticketUrl } = data;
    
    const priorityEmoji = {
      'urgent': '🔴',
      'high': '🟠',
      'normal': '🟡',
      'low': '🟢'
    };

    return `📩 *TIKET BARU ASSIGNED*

Ticket: #${ticketNumber}
Customer: ${customerName}
Location: ${location}
Priority: ${priorityEmoji[priority] || '🟡'} ${priority.toUpperCase()}

Issue: ${issue}
SLA: ${sla} jam
Deadline: ${deadline}

📍 View Detail: ${ticketUrl}

_Mohon segera ditangani. Terima kasih!_`;
  },

  /**
   * 2. TICKET STATUS UPDATE - To Customer
   */
  ticketStatusUpdate: (data) => {
    const { 
      ticketNumber, 
      oldStatus, 
      newStatus, 
      technicianName, 
      completedAt, 
      duration,
      issue,
      solution,
      ratingUrl 
    } = data;

    const statusEmoji = {
      'open': '🆕',
      'assigned': '👤',
      'in_progress': '🔄',
      'on_hold': '⏸️',
      'completed': '✅',
      'cancelled': '❌'
    };

    let message = `${statusEmoji[newStatus]} *UPDATE TIKET ANDA*\n\n`;
    message += `Ticket: #${ticketNumber}\n`;
    message += `Status: ${oldStatus} → ${newStatus}\n\n`;

    if (newStatus === 'assigned') {
      message += `Teknisi: ${technicianName}\n`;
      message += `\n_Teknisi kami sedang menuju lokasi Anda._`;
    } else if (newStatus === 'in_progress') {
      message += `Teknisi: ${technicianName}\n`;
      message += `\n_Teknisi kami sedang menangani masalah Anda._`;
    } else if (newStatus === 'completed') {
      message += `Teknisi: ${technicianName}\n`;
      message += `Selesai: ${completedAt}\n`;
      message += `Durasi: ${duration}\n\n`;
      message += `Masalah: ${issue}\n`;
      if (solution) {
        message += `Solusi: ${solution}\n`;
      }
      message += `\n⭐ Rate our service: ${ratingUrl}\n`;
      message += `\n_Terima kasih atas kepercayaan Anda!_`;
    }

    return message;
  },

  /**
   * 3. SLA WARNING - To Supervisor
   */
  slaWarning: (data) => {
    const { 
      ticketNumber, 
      customerName, 
      technicianName,
      slaTarget,
      remaining,
      progress,
      ticketUrl 
    } = data;

    return `⚠️ *SLA WARNING*

Ticket: #${ticketNumber}
Customer: ${customerName}
Teknisi: ${technicianName}

SLA Target: ${slaTarget} jam
Remaining: ${remaining} ⏰
Progress: ${progress}%

🚨 Ticket mendekati deadline!

📍 View: ${ticketUrl}

_Butuh escalation?_`;
  },

  /**
   * 4. PAYMENT REMINDER - To Customer
   */
  paymentReminder: (data) => {
    const {
      customerName,
      invoiceNumber,
      month,
      packageName,
      amount,
      dueDate,
      daysRemaining,
      paymentMethods,
      portalUrl
    } = data;

    let urgencyEmoji = '💳';
    let urgencyText = '';
    
    if (daysRemaining <= 1) {
      urgencyEmoji = '🚨';
      urgencyText = '*URGENT - ';
    } else if (daysRemaining <= 3) {
      urgencyEmoji = '⚠️';
      urgencyText = '';
    }

    return `${urgencyEmoji} *${urgencyText}REMINDER TAGIHAN*

Dear ${customerName},

Invoice: #${invoiceNumber}
Tagihan Bulan: ${month}
Paket: ${packageName}
Amount: Rp ${amount.toLocaleString('id-ID')}

Due Date: ${dueDate} (${daysRemaining} hari lagi)

💰 *Cara Bayar:*
${paymentMethods.map(pm => `• ${pm}`).join('\n')}

📱 Portal: ${portalUrl}

${daysRemaining <= 1 ? '⚠️ _Segera bayar untuk menghindari suspension!_' : '_Terima kasih atas pembayaran tepat waktu!_'}`;
  },

  /**
   * 5. PAYMENT CONFIRMATION - To Customer
   */
  paymentConfirmation: (data) => {
    const {
      customerName,
      invoiceNumber,
      amount,
      paidAt,
      paymentMethod,
      nextBilling
    } = data;

    return `✅ *PEMBAYARAN DITERIMA*

Dear ${customerName},

Invoice: #${invoiceNumber}
Amount: Rp ${amount.toLocaleString('id-ID')}
Date: ${paidAt}

Payment Method: ${paymentMethod}
Status: VERIFIED ✅

Terima kasih atas pembayaran tepat waktu! 🙏

Next billing: ${nextBilling}

_Anda adalah pelanggan terbaik kami!_`;
  },

  /**
   * 6. TICKET CREATED - To Customer
   */
  ticketCreated: (data) => {
    const {
      customerName,
      ticketNumber,
      issue,
      priority,
      sla,
      trackingUrl
    } = data;

    const priorityEmoji = {
      'urgent': '🔴',
      'high': '🟠',
      'normal': '🟡',
      'low': '🟢'
    };

    return `🎫 *TIKET ANDA TELAH DIBUAT*

Dear ${customerName},

Ticket: #${ticketNumber}
Issue: ${issue}
Priority: ${priorityEmoji[priority]} ${priority.toUpperCase()}

SLA Response: ${sla} jam
Status: Open

Tim kami akan segera menugaskan teknisi terbaik untuk menangani masalah Anda.

📱 Track: ${trackingUrl}

_Terima kasih atas kepercayaan Anda!_`;
  },

  /**
   * 7. INSTALLATION SCHEDULE - To Customer
   */
  installationSchedule: (data) => {
    const {
      customerName,
      packageName,
      address,
      date,
      time,
      technicianName,
      technicianPhone,
      preparations
    } = data;

    return `🎉 *JADWAL INSTALASI ANDA*

Dear ${customerName},

Package: ${packageName}
Address: ${address}

📅 Tanggal: ${date}
⏰ Waktu: ${time}
👷 Teknisi: ${technicianName}
📞 Phone: ${technicianPhone}

📝 *Persiapan:*
${preparations.map(p => `• ${p}`).join('\n')}

_Mohon pastikan ada yang menerima teknisi._

📞 Reschedule? Hubungi CS kami.`;
  },

  /**
   * 8. DAILY SUMMARY - To Manager/Supervisor
   */
  dailySummary: (data) => {
    const {
      date,
      totalTickets,
      completed,
      inProgress,
      pending,
      activeTechnicians,
      totalTechnicians,
      avgCompletion,
      slaAchievement,
      overdueTickets,
      nearSlaTickets,
      dashboardUrl
    } = data;

    return `📊 *DAILY REPORT - ${date}*

*Tickets:*
• Total: ${totalTickets} tickets
• Completed: ${completed} ✅
• In Progress: ${inProgress} 🔄
• Pending: ${pending} ⏳

*Technicians:*
• Active: ${activeTechnicians}/${totalTechnicians}
• Avg Completion: ${avgCompletion} tickets/tech
• SLA Achievement: ${slaAchievement}%

${overdueTickets > 0 ? `*Issues:*\n🔴 ${overdueTickets} tickets overdue\n` : ''}${nearSlaTickets > 0 ? `🟡 ${nearSlaTickets} tickets near SLA\n` : ''}
📈 Dashboard: ${dashboardUrl}

_Good work team!_`;
  },

  /**
   * 9. EMERGENCY ALERT - To All Team
   */
  emergencyAlert: (data) => {
    const {
      type,
      area,
      customersAffected,
      status,
      eta,
      actions
    } = data;

    return `🚨 *EMERGENCY ALERT*

Type: ${type}
Area: ${area}
Impact: ${customersAffected} customers affected

Status: ${status}
ETA: ${eta}

*Actions:*
${actions.map(a => `• ${a}`).join('\n')}

_Updates: Every 30 minutes_

⚠️ All hands on deck!`;
  }
};

module.exports = whatsappTemplates;

