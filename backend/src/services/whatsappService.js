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
    // Indonesian number pattern: 62 + (8XX) + 7-11 digits
    const pattern = /^628\d{8,11}$/;
    return pattern.test(formatted);
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
   * Main method to send WhatsApp message
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

    // Send based on provider
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

      // Log WhatsApp activity
      console.log(`📱 WhatsApp ${result.success ? 'sent' : 'failed'} to ${target} via ${this.provider}`);

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
   * Send OTP via WhatsApp
   */
  async sendOTP(phone, otp, name = '') {
    const greeting = name ? `Halo ${name},\n\n` : 'Halo,\n\n';
    const message = `${greeting}Kode OTP Anda untuk verifikasi pendaftaran ISP Technician Management adalah:\n\n*${otp}*\n\nKode ini berlaku selama 5 menit.\nJangan berikan kode ini kepada siapapun.\n\nTerima kasih!`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send registration confirmation
   */
  async sendRegistrationConfirmation(phone, data) {
    const message = `Halo ${data.name},\n\nTerima kasih telah mendaftar sebagai customer ISP kami!\n\n📋 *Nomor Registrasi:* ${data.registration_number}\n📦 *Paket:* ${data.package_name}\n💰 *Harga:* Rp ${data.price?.toLocaleString('id-ID')}/bulan\n\nTim kami akan segera menghubungi Anda untuk proses verifikasi dan survey lokasi.\n\nAnda dapat cek status pendaftaran Anda di:\n${data.tracking_url}\n\nTerima kasih!`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send verification status update
   */
  async sendVerificationUpdate(phone, data) {
    const statusMessages = {
      verified: '✅ Data Anda telah diverifikasi',
      survey_scheduled: '📅 Survey lokasi telah dijadwalkan',
      approved: '🎉 Pendaftaran Anda telah disetujui',
      rejected: '❌ Mohon maaf, pendaftaran Anda ditolak'
    };

    let message = `Halo ${data.name},\n\n${statusMessages[data.status] || 'Status pendaftaran Anda telah diupdate'}.\n\n`;

    if (data.status === 'survey_scheduled' && data.survey_date) {
      message += `📅 *Jadwal Survey:* ${data.survey_date}\n\n`;
    }

    if (data.status === 'approved') {
      message += `Selamat! Kami akan segera menjadwalkan instalasi untuk Anda.\n\n`;
    }

    if (data.status === 'rejected' && data.rejection_reason) {
      message += `*Alasan:* ${data.rejection_reason}\n\n`;
      message += `Anda dapat mendaftar kembali atau hubungi kami untuk informasi lebih lanjut.\n\n`;
    }

    message += `📋 *Nomor Registrasi:* ${data.registration_number}\n\nTerima kasih!`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send installation schedule
   */
  async sendInstallationSchedule(phone, data) {
    const message = `Halo ${data.name},\n\n🎉 Instalasi Anda telah dijadwalkan!\n\n📅 *Tanggal:* ${data.installation_date}\n⏰ *Waktu:* ${data.installation_time}\n👷 *Teknisi:* ${data.technician_name}\n📦 *Paket:* ${data.package_name}\n📍 *Alamat:* ${data.address}\n\nTim teknisi kami akan datang sesuai jadwal. Pastikan ada yang bisa menerima teknisi di lokasi.\n\nJika ada pertanyaan, hubungi kami.\n\nTerima kasih!`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send welcome message after activation
   */
  async sendWelcomeMessage(phone, data) {
    const message = `Selamat datang di ISP kami, ${data.name}! 🎉\n\n✅ Instalasi selesai!\n👤 *ID Customer:* ${data.customer_id}\n📦 *Paket:* ${data.package_name}\n💰 *Tagihan Bulanan:* Rp ${data.price?.toLocaleString('id-ID')}\n📅 *Tanggal Tagihan:* ${data.billing_date}\n\n🌐 *Informasi WiFi:*\nNama: ${data.wifi_name}\nPassword: ${data.wifi_password}\n\nNikmati layanan internet cepat kami!\n\nUntuk bantuan, hubungi customer service kami.\n\nTerima kasih! 🚀`;

    return this.sendMessage(phone, message);
  }

  /**
   * Send reminder for payment
   */
  async sendPaymentReminder(phone, data) {
    const daysLeft = data.days_left || 3;
    const message = `Halo ${data.name},\n\n💰 *Pengingat Pembayaran*\n\nTagihan internet Anda akan jatuh tempo dalam ${daysLeft} hari.\n\n📋 *Detail:*\n- Periode: ${data.period}\n- Jumlah: Rp ${data.amount?.toLocaleString('id-ID')}\n- Jatuh Tempo: ${data.due_date}\n\nSilakan lakukan pembayaran sebelum tanggal jatuh tempo agar layanan Anda tidak terganggu.\n\nTerima kasih!`;

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
    const expires = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    const otpData = {
      otp,
      expires,
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

    console.log(`📦 STORED OTP: ${stored.otp}, Expires: ${new Date(stored.expires).toISOString()}, Attempts: ${stored.attempts}, Source: ${isFromRedis ? 'Redis' : 'Memory'}`);

    if (Date.now() > stored.expires) {
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

