#!/usr/bin/env node

/**
 * Test WhatsApp OTP Service
 * Quick script to test if WhatsApp OTP is working
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE = '081234567890'; // Replace with your test phone number
const TEST_NAME = 'Test User';

async function testRequestOTP() {
  console.log('\n🧪 Testing WhatsApp OTP Request...\n');
  
  try {
    console.log(`📞 Requesting OTP for: ${TEST_PHONE}`);
    
    const response = await axios.post(`${API_BASE_URL}/registrations/public/request-otp`, {
      phone: TEST_PHONE,
      full_name: TEST_NAME
    });

    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n📱 OTP should be sent to WhatsApp now!');
      console.log('💡 Check your WhatsApp for the OTP code');
      
      // If in dev mode, show the OTP from response (if available)
      if (response.data.otp) {
        console.log(`\n🔑 OTP Code (Dev Mode): ${response.data.otp}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run test
testRequestOTP();

