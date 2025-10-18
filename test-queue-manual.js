// Test WhatsApp Queue - Manual Job Addition
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { addWhatsAppJob, getQueueStats } = require('./backend/src/queues/whatsappQueue');

async function testQueue() {
  console.log('🧪 Testing WhatsApp Queue...\n');

  try {
    // Test 1: Add OTP job
    console.log('1️⃣ Adding OTP job to queue...');
    const otpJob = await addWhatsAppJob('send-otp', {
      phone: '08197670700',
      message: 'Your OTP: 123456',
      otp: '123456',
      name: 'Test User'
    }, {
      priority: 10
    });
    console.log(`✅ OTP Job added: ${otpJob.id}\n`);

    // Test 2: Add notification job
    console.log('2️⃣ Adding notification job to queue...');
    const notifJob = await addWhatsAppJob('send-notification', {
      phone: '08197670700',
      message: 'Test notification from queue system',
      type: 'test'
    }, {
      priority: 5
    });
    console.log(`✅ Notification Job added: ${notifJob.id}\n`);

    // Wait a bit for worker to process
    console.log('⏳ Waiting 3 seconds for worker to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: Check queue stats
    console.log('\n3️⃣ Checking queue stats...');
    const stats = await getQueueStats();
    console.log('📊 Queue Statistics:');
    console.log(`   - Waiting: ${stats.waiting}`);
    console.log(`   - Active: ${stats.active}`);
    console.log(`   - Completed: ${stats.completed}`);
    console.log(`   - Failed: ${stats.failed}`);
    console.log(`   - Total: ${stats.total}\n`);

    console.log('✅ Queue test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Queue test failed:', error);
    process.exit(1);
  }
}

testQueue();

