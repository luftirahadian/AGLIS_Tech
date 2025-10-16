const axios = require('axios');
const redisClient = require('../utils/redisClient');

/**
 * WhatsApp Service
 * Service untuk mengirim notifikasi WhatsApp ke customer
 * 
 * Supports multiple WhatsApp Gateway providers:
 * - Fonnte (fonnte.com)
 * - Wablas (wablas.com)
 * - Woowa (woowa.id)
 * - Custom API
 * 
 * Set WHATSAPP_PROVIDER in .env to choose provider
 * 
 * OTP Storage: Uses Redis for shared storage across PM2 cluster instances
 */

class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'fonnte'; // Default to Fonnte
    this.apiUrl = this.getApiUrl();
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';
    this.useRedis = process.env.USE_REDIS_FOR_OTP !== 'false'; // Default to true
    
    // Failover configuration
    this.enableFailover = process.env.WHATSAPP_ENABLE_FAILOVER === 'true';
    this.backupProvider = process.env.WHATSAPP_BACKUP_PROVIDER || 'wablas';
    this.backupApiToken = process.env.WHATSAPP_BACKUP_API_TOKEN;
    this.backupApiUrl = process.env.WHATSAPP_BACKUP_API_URL;
    
    // Initialize Redis connection for OTP storage
    if (this.useRedis) {
      redisClient.connect().catch(err => {
        console.error('❌ Redis connection failed for OTP, falling back to in-memory storage:', err.message);
        this.useRedis = false;
      });
    }
  }

  getApiUrl() {
    const providers = {
      fonnte: 'https://api.fonnte.com/send',
      wablas: process.env.WHATSAPP_API_URL || 'https://your-wablas-domain.com/api/send-message',
      woowa: 'https://api.woowa.id/v1/messages',
      custom: process.env.WHATSAPP_API_URL
    };
    return providers[this.provider] || providers.fonnte;
  }

  /**
   * Format phone number to WhatsApp format
   * Input: 081234567890, +62812345678, 62812345678
   * Output: 6281234567890
   * Also supports group chat IDs: 120363419722776103@g.us
   */
  formatPhoneNumber(phone) {
    // If it's a group chat ID (contains @g.us), return as-is
    if (phone.includes('@g.us')) {
      return phone;
    }
    
    // Remove all non-digit characters
    let formatted = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 62
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.substring(1);
    }
    
    // If doesn't start with 62, add 62
    if (!formatted.startsWith('62')) {
      formatted = '62' + formatted;
    }
    
    return formatted;
  }

  /**
   * Validate Indonesian WhatsApp number or group chat ID
   */
  isValidWhatsAppNumber(phone) {
    // Group chat ID format: digits@g.us
    if (phone.includes('@g.us')) {
      const groupPattern = /^\d+@g\.us$/;
      return groupPattern.test(phone);
    }
    
    const formatted = this.formatPhoneNumber(phone);
    // Indonesian number pattern: 62 + mobile (8XX) or fixed-line (2X, 3X, etc) + digits
    // Mobile: 628XX... (8-11 additional digits)
    // Fixed-line: 622X..., 623X..., etc. (area codes)
    const mobilePattern = /^628\d{8,11}$/;
    const fixedLinePattern = /^62[2-9]\d{8,11}$/;
    return mobilePattern.test(formatted) || fixedLinePattern.test(formatted);
  }

  /**
   * Send WhatsApp message using Fonnte
   */
  async sendViaFonnte(target, message, options = {}) {
    try {
      const data = {
        target: target,
        message: message,
        ...options
      };

      const response = await axios.post(this.apiUrl, data, {
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        provider: 'fonnte'
      };
    } catch (error) {
      console.error('Fonnte WhatsApp Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        provider: 'fonnte'
      };
    }
  }

  /**
   * Send WhatsApp message using Wablas
   */
  async sendViaWablas(target, message, options = {}) {
    try {
      const data = {
        phone: target,
        message: message,
        ...options
      };

      const response = await axios.post(this.apiUrl, data, {
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        provider: 'wablas'
      };
    } catch (error) {
      console.error('Wablas WhatsApp Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        provider: 'wablas'
      };
    }
  }

  /**
   * Send WhatsApp message using Woowa
   */
  async sendViaWoowa(target, message, options = {}) {
    try {
      const data = {
        phone_number: target,
        message: message,
        ...options
      };

      const response = await axios.post(this.apiUrl, data, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        provider: 'woowa'
      };
    } catch (error) {
      console.error('Woowa WhatsApp Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        provider: 'woowa'
      };
    }
  }

  /**
   * Main method to send WhatsApp message with automatic failover
   */
  async sendMessage(phone, message, options = {}) {
    if (!this.enabled) {
      console.log('WhatsApp service is disabled. Message:', message);
      return {
        success: true,
        message: 'WhatsApp service disabled - message logged only',
        disabled: true
      };
    }

    if (!this.apiToken) {
      console.error('WhatsApp API token not configured');
      return {
        success: false,
        error: 'WhatsApp service not configured'
      };
    }

    // Validate and format phone number
    if (!this.isValidWhatsAppNumber(phone)) {
      return {
        success: false,
        error: 'Invalid WhatsApp number format'
      };
    }

    const target = this.formatPhoneNumber(phone);

    // Try primary provider first
    try {
      let result;
      
      switch (this.provider) {
        case 'fonnte':
          result = await this.sendViaFonnte(target, message, options);
          break;
        case 'wablas':
          result = await this.sendViaWablas(target, message, options);
          break;
        case 'woowa':
          result = await this.sendViaWoowa(target, message, options);
          break;
        default:
          result = await this.sendViaFonnte(target, message, options);
      }

      // If primary succeeds, return result
      if (result.success) {
        console.log(`✅ WhatsApp sent to ${target} via ${this.provider} (primary)`);
        return result;
      }

      // If primary failed and failover is enabled, try backup provider
      if (!result.success && this.enableFailover && this.backupApiToken) {
        console.warn(`⚠️ Primary provider ${this.provider} failed, attempting failover to ${this.backupProvider}...`);
        const failoverResult = await this.sendViaBackupProvider(target, message, options);
        
        if (failoverResult.success) {
          console.log(`✅ WhatsApp sent to ${target} via ${this.backupProvider} (failover)`);
          return {
            ...failoverResult,
            failover: true,
            primaryError: result.error
          };
        } else {
          console.error(`❌ Both providers failed. Primary: ${result.error}, Backup: ${failoverResult.error}`);
          return {
            success: false,
            error: `Both providers failed. Primary (${this.provider}): ${result.error}, Backup (${this.backupProvider}): ${failoverResult.error}`,
            primaryError: result.error,
            backupError: failoverResult.error
          };
        }
      }

      // No failover configured or backup not available
      console.error(`❌ WhatsApp failed to ${target} via ${this.provider}`);
      return result;
      
    } catch (error) {
      console.error('WhatsApp Service Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message via backup provider (failover)
   */
  async sendViaBackupProvider(target, message, options = {}) {
    try {
      const data = {
        phone: target,
        message: message,
        ...options
      };

      let response;
      
      switch (this.backupProvider) {
        case 'wablas':
          response = await axios.post(this.backupApiUrl, data, {
            headers: {
              'Authorization': this.backupApiToken,
              'Content-Type': 'application/json'
            }
          });
          break;
        case 'fonnte':
          response = await axios.post('https://api.fonnte.com/send', {
            target: target,
            message: message,
            ...options
          }, {
            headers: {
              'Authorization': this.backupApiToken,
              'Content-Type': 'application/json'
            }
          });
          break;
        case 'woowa':
          response = await axios.post('https://api.woowa.id/v1/messages', {
            phone_number: target,
            message: message,
            ...options
          }, {
            headers: {
              'Authorization': `Bearer ${this.backupApiToken}`,
              'Content-Type': 'application/json'
            }
          });
          break;
        default:
          throw new Error(`Unknown backup provider: ${this.backupProvider}`);
      }

      return {
        success: true,
        data: response.data,
        provider: this.backupProvider
      };
    } catch (error) {
      console.error(`Backup provider ${this.backupProvider} error:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        provider: this.backupProvider
      };
    }
  }

  /**
   * Send OTP via WhatsApp
   */
  async sendOTP(phone, otp, name = '') {
    // Use OTP template
    const templates = require('../templates/whatsappTemplates');
    const messageData = {
      customerName: name || 'Customer',
      otpCode: otp,
      expiryMinutes: '5',
      purpose: 'Verifikasi registrasi'
    };
    
    const message = templates.otpVerification(messageData);

    return this.sendMessage(phone, message);
  }

  /**
   * Send registration confirmation
   */
  async sendRegistrationConfirmation(phone, data) {
    // Use registration confirmation template
    const templates = require('../templates/whatsappTemplates');
    const messageData = {
      customerName: data.name,
      registrationNumber: data.registration_number,
      packageName: data.package_name,
      price: data.price?.toLocaleString('id-ID'),
      trackingUrl: data.tracking_url
    };
    
    const message = templates.registrationConfirmation(messageData);

    return this.sendMessage(phone, message);
  }

  /**
   * Send verification status update
   */
  async sendVerificationUpdate(phone, data) {
    // Use template for verification update
    const templates = require('../templates/whatsappTemplates');
    
    // Map status to appropriate message
    let message;
    if (data.status === 'verified') {
      message = `✅ *VERIFIKASI BERHASIL*

Dear ${data.name},

Data pendaftaran Anda telah diverifikasi!

📋 Registration: #${data.registration_number}
Status: ✅ Terverifikasi

*Next Steps:*
⏳ Survey lokasi akan dijadwalkan
⏳ Instalasi
⏳ Aktivasi

Kami akan menghubungi Anda segera.

_AGLIS Net - Connecting You Better!_ 🌐`;
    } else if (data.status === 'survey_scheduled') {
      message = `📅 *SURVEY DIJADWALKAN*

Dear ${data.name},

Survey lokasi telah dijadwalkan!

📋 Registration: #${data.registration_number}
📅 Jadwal Survey: ${data.survey_date || 'Akan dikonfirmasi'}

Tim survey kami akan menghubungi Anda.

_AGLIS Net - Connecting You Better!_ 🌐`;
    } else if (data.status === 'approved') {
      message = `🎉 *PENDAFTARAN DISETUJUI*

Dear ${data.name},

Selamat! Pendaftaran Anda telah disetujui!

📋 Registration: #${data.registration_number}
Status: ✅ Approved

*Next Steps:*
⏳ Penjadwalan instalasi
⏳ Instalasi oleh teknisi
⏳ Aktivasi layanan

Kami akan segera menjadwalkan instalasi.

_AGLIS Net - Connecting You Better!_ 🌐`;
    } else if (data.status === 'rejected') {
      message = `❌ *PENDAFTARAN DITOLAK*

Dear ${data.name},

Mohon maaf, pendaftaran Anda tidak dapat diproses.

📋 Registration: #${data.registration_number}
${data.rejection_reason ? `\n*Alasan:* ${data.rejection_reason}\n` : ''}
*Anda dapat:*
- Mendaftar kembali dengan data yang benar
- Hubungi CS untuk informasi lebih lanjut

📞 Customer Service: 0821-xxxx-xxxx

_AGLIS Net - We're here to help!_ 🌐`;
    } else {
      message = `📱 *UPDATE STATUS*

Dear ${data.name},

Status pendaftaran Anda telah diupdate.

📋 Registration: #${data.registration_number}

Kami akan menghubungi Anda untuk informasi lebih lanjut.

_AGLIS Net - Connecting You Better!_ 🌐`;
    }

    return this.sendMessage(phone, message);
  }

  /**
   * Send installation schedule
   */
  async sendInstallationSchedule(phone, data) {
    // Use installation schedule template
    const templates = require('../templates/whatsappTemplates');
    const messageData = {
      customerName: data.name,
      installationDate: data.installation_date,
      installationTime: data.installation_time,
      technicianName: data.technician_name,
      technicianPhone: data.technician_phone || '0821-xxxx-xxxx',
      packageName: data.package_name,
      address: data.address
    };
    
    const message = templates.installationSchedule(messageData);

    return this.sendMessage(phone, message);
  }

  /**
   * Send welcome message after activation
   */
  async sendWelcomeMessage(phone, data) {
    // Use welcome message template
    const templates = require('../templates/whatsappTemplates');
    const messageData = {
      customerName: data.name,
      customerId: data.customer_id,
      packageName: data.package_name,
      speed: data.speed || '20 Mbps',
      monthlyPrice: data.price?.toLocaleString('id-ID'),
      billingDate: data.billing_date,
      wifiName: data.wifi_name,
      wifiPassword: data.wifi_password,
      portalUrl: process.env.FRONTEND_URL || 'https://portal.aglis.biz.id',
      csPhone: '0821-xxxx-xxxx'
    };
    
    const message = templates.welcomeMessage(messageData);

    return this.sendMessage(phone, message);
  }

  /**
   * Send reminder for payment
   */
  async sendPaymentReminder(phone, data) {
    // Use payment reminder template
    const templates = require('../templates/whatsappTemplates');
    const messageData = {
      customerName: data.name,
      invoiceNumber: data.invoice_number || 'INV-XXXXX',
      amount: data.amount?.toLocaleString('id-ID'),
      dueDate: data.due_date,
      period: data.period,
      paymentUrl: `${process.env.FRONTEND_URL || 'https://portal.aglis.biz.id'}/payments/${data.invoice_id || ''}`
    };
    
    const message = templates.paymentReminder(messageData);

    return this.sendMessage(phone, message);
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP in memory (fallback if Redis unavailable)
   * Format: { phone: { otp, expires, attempts } }
   */
  otpStorage = new Map();

  /**
   * Save OTP for verification
   * Uses Redis in production for shared storage across PM2 instances
   */
  async saveOTP(phone, otp) {
    const formattedPhone = this.formatPhoneNumber(phone);
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    const otpData = {
      otp,
      expiresAt,
      attempts: 0
    };

    try {
      if (this.useRedis) {
        // Store in Redis with 5 minutes expiry
        const key = `otp:${formattedPhone}`;
        await redisClient.set(key, JSON.stringify(otpData), 300); // 300 seconds = 5 minutes
        console.log(`🔑 OTP SAVED (Redis): Phone=${formattedPhone}, OTP=${otp}, Key=${key}, Process=${process.pid}`);
      } else {
        // Fallback to in-memory storage
        this.otpStorage.set(formattedPhone, otpData);
        console.log(`🔑 OTP SAVED (Memory): Phone=${formattedPhone}, OTP=${otp}, Process=${process.pid}`);
        
        // Auto cleanup after expiry (memory only)
        setTimeout(() => {
          this.otpStorage.delete(formattedPhone);
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('❌ Failed to save OTP to Redis, using memory:', error.message);
      // Fallback to memory if Redis fails
      this.otpStorage.set(formattedPhone, otpData);
      setTimeout(() => {
        this.otpStorage.delete(formattedPhone);
      }, 5 * 60 * 1000);
    }

    return true;
  }

  /**
   * Store OTP in Redis or memory for verification
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @param {number} expiryMinutes - Expiry time in minutes
   * @param {string} purpose - Purpose of OTP (registration, login, etc)
   */
  async storeOTP(phone, otp, expiryMinutes = 10, purpose = 'verification') {
    const formattedPhone = this.formatPhoneNumber(phone);
    const otpData = {
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + (expiryMinutes * 60 * 1000),
      purpose
    };

    try {
      // Try to store in Redis first
      if (this.useRedis && redisClient.isReady) {
        try {
          const key = `otp:${formattedPhone}`;
          const expirySeconds = expiryMinutes * 60;
          // Use SETEX command format: SETEX key seconds value
          await redisClient.sendCommand(['SETEX', key, expirySeconds.toString(), JSON.stringify(otpData)]);
          console.log(`💾 OTP STORED (Redis): Phone=${formattedPhone}, OTP=${otp}, Purpose=${purpose}, Expiry=${expiryMinutes}min, Process=${process.pid}`);
          return { success: true, storage: 'redis' };
        } catch (redisError) {
          console.error('❌ Redis store failed, falling back to memory:', redisError.message);
          // Fall through to memory storage
        }
      }

      // Fallback to memory storage
      if (!this.otpStorage) {
        this.otpStorage = new Map();
      }
      this.otpStorage.set(formattedPhone, otpData);
      console.log(`💾 OTP STORED (Memory): Phone=${formattedPhone}, OTP=${otp}, Purpose=${purpose}, Expiry=${expiryMinutes}min, Process=${process.pid}`);
      
      // Set timeout to clear from memory
      setTimeout(() => {
        if (this.otpStorage) {
          this.otpStorage.delete(formattedPhone);
          console.log(`🗑️ OTP EXPIRED (Memory): Phone=${formattedPhone}, Process=${process.pid}`);
        }
      }, expiryMinutes * 60 * 1000);

      return { success: true, storage: 'memory' };
    } catch (error) {
      console.error('❌ Error storing OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify OTP
   * Checks Redis first, falls back to memory if Redis unavailable
   */
  async verifyOTP(phone, otp) {
    const formattedPhone = this.formatPhoneNumber(phone);
    let stored = null;
    let isFromRedis = false;

    try {
      // Try to get OTP from Redis first
      if (this.useRedis) {
        const key = `otp:${formattedPhone}`;
        const redisData = await redisClient.get(key);
        if (redisData) {
          stored = JSON.parse(redisData);
          isFromRedis = true;
          console.log(`🔍 OTP VERIFY (Redis): Phone=${formattedPhone}, InputOTP=${otp}, Key=${key}, Process=${process.pid}`);
        }
      }
      
      // Fallback to memory if Redis didn't have it
      if (!stored) {
        stored = this.otpStorage.get(formattedPhone);
        console.log(`🔍 OTP VERIFY (Memory): Phone=${formattedPhone}, InputOTP=${otp}, Process=${process.pid}, StorageSize=${this.otpStorage.size}`);
      }

    } catch (error) {
      console.error('❌ Redis get error, checking memory:', error.message);
      stored = this.otpStorage.get(formattedPhone);
    }

    if (!stored) {
      console.log(`❌ OTP NOT FOUND: Phone=${formattedPhone}`);
      if (!isFromRedis && this.otpStorage.size > 0) {
        console.log(`Available memory keys:`, Array.from(this.otpStorage.keys()));
      }
      return {
        success: false,
        error: 'OTP tidak ditemukan atau sudah kadaluarsa'
      };
    }

    console.log(`📦 STORED OTP: ${stored.otp}, Expires: ${new Date(stored.expiresAt).toISOString()}, Attempts: ${stored.attempts || 0}, Source: ${isFromRedis ? 'Redis' : 'Memory'}`);

    if (Date.now() > stored.expiresAt) {
      // Delete from both storages
      if (isFromRedis) {
        await redisClient.del(`otp:${formattedPhone}`).catch(e => console.error('Redis delete error:', e));
      }
      this.otpStorage.delete(formattedPhone);
      console.log(`⏰ OTP EXPIRED: Phone=${formattedPhone}`);
      return {
        success: false,
        error: 'OTP sudah kadaluarsa'
      };
    }

    if (stored.attempts >= 3) {
      // Delete from both storages
      if (isFromRedis) {
        await redisClient.del(`otp:${formattedPhone}`).catch(e => console.error('Redis delete error:', e));
      }
      this.otpStorage.delete(formattedPhone);
      console.log(`🚫 TOO MANY ATTEMPTS: Phone=${formattedPhone}`);
      return {
        success: false,
        error: 'Terlalu banyak percobaan. Silakan minta OTP baru.'
      };
    }

    if (stored.otp !== otp) {
      stored.attempts++;
      
      // Update attempt count in Redis
      if (isFromRedis) {
        const key = `otp:${formattedPhone}`;
        const ttl = Math.ceil((stored.expires - Date.now()) / 1000); // remaining seconds
        await redisClient.set(key, JSON.stringify(stored), ttl).catch(e => console.error('Redis update error:', e));
      }
      
      console.log(`❌ OTP MISMATCH: Stored="${stored.otp}" vs Input="${otp}", Attempt ${stored.attempts}/3`);
      return {
        success: false,
        error: 'Kode OTP salah',
        attemptsLeft: 3 - stored.attempts
      };
    }

    // OTP valid - delete from both storages
    if (isFromRedis) {
      await redisClient.del(`otp:${formattedPhone}`).catch(e => console.error('Redis delete error:', e));
    }
    this.otpStorage.delete(formattedPhone);
    console.log(`✅ OTP VERIFIED: Phone=${formattedPhone}`);
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  }

  /**
   * Send and save OTP
   */
  async sendAndSaveOTP(phone, name = '') {
    const otp = this.generateOTP();
    await this.saveOTP(phone, otp);
    const result = await this.sendOTP(phone, otp, name);
    
    return {
      ...result,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in dev mode
    };
  }
}

// Export singleton instance
module.exports = new WhatsAppService();

