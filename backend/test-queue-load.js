// Load test - Multiple jobs
require('dotenv').config();
const { addWhatsAppJob, getQueueStats } = require('./src/queues/whatsappQueue');

async function loadTest() {
  console.log('🚀 WhatsApp Queue Load Test');
  console.log('============================\n');

  try {
    const startTime = Date.now();
    const totalJobs = 10; // Test dengan 10 jobs
    const jobs = [];

    // Add jobs dengan priority berbeda
    console.log(`1️⃣ Adding ${totalJobs} jobs to queue...\n`);
    
    for (let i = 0; i < totalJobs; i++) {
      const jobType = i % 3 === 0 ? 'send-otp' : 
                     i % 3 === 1 ? 'send-notification' : 'send-group';
      const priority = i % 3 === 0 ? 10 : i % 3 === 1 ? 5 : 3;
      
      const job = await addWhatsAppJob(jobType, {
        phone: i % 2 === 0 ? '08197670700' : '120363419722776103@g.us',
        message: `Load test message #${i + 1}`,
        testId: i + 1
      }, { priority });
      
      jobs.push(job);
      console.log(`   ✅ Job ${i + 1}/${totalJobs} added (${jobType}, priority: ${priority})`);
    }

    const addTime = Date.now() - startTime;
    console.log(`\n⏱️  Time to add ${totalJobs} jobs: ${addTime}ms\n`);

    // Wait for processing
    console.log('⏳ Waiting for worker to process jobs (10s)...');
    await new Promise(r => setTimeout(r, 10000));

    // Check final stats
    console.log('\n2️⃣ Final queue statistics:');
    const stats = await getQueueStats();
    console.log(`   📊 Total processed: ${stats.completed + stats.failed}`);
    console.log(`   ✅ Completed: ${stats.completed}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⏳ Still processing: ${stats.active + stats.waiting}`);
    console.log(`   📈 Success rate: ${((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(2)}%`);

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total test time: ${totalTime}ms`);
    console.log(`   Average: ${(totalTime / totalJobs).toFixed(2)}ms per job\n`);

    console.log('✅ Load test completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

loadTest();
