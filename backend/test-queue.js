// Test WhatsApp Queue
require('dotenv').config();
const { addWhatsAppJob, getQueueStats } = require('./src/queues/whatsappQueue');

async function test() {
  console.log('🧪 Testing WhatsApp Queue...\n');

  try {
    // Add test job
    console.log('1️⃣ Adding test OTP job...');
    const job = await addWhatsAppJob('send-otp', {
      phone: '08197670700',
      message: 'Test OTP: 999999',
      otp: '999999',
      name: 'Queue Test User'
    });
    console.log(`✅ Job added: ${job.id}\n`);

    // Wait for processing
    await new Promise(r => setTimeout(r, 3000));

    // Check stats
    console.log('2️⃣ Checking queue stats...');
    const stats = await getQueueStats();
    console.log('📊 Stats:', JSON.stringify(stats, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
