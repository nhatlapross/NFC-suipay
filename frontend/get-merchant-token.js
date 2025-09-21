// Quick script to get merchant token manually (bypass rate limits)
// Run with: node get-merchant-token.js

const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:8080';
const MERCHANT_CREDENTIALS = {
  email: "merchant@testshop.com",
  password: "Password123!"
};

async function getMerchantToken() {
  try {
    console.log('🔐 Getting merchant token...');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Merchant:', MERCHANT_CREDENTIALS.email);

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(MERCHANT_CREDENTIALS),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.status === 429) {
      console.log('❌ Rate limit exceeded');
      console.log('Response:', responseText);
      return;
    }

    const data = JSON.parse(responseText);

    if (data.success && data.token) {
      console.log('✅ Success! Copy this token:');
      console.log('================================');
      console.log(data.token);
      console.log('================================');
      console.log('Paste this token into the "Manual Token" field in the QR payment test page.');
    } else {
      console.log('❌ Login failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getMerchantToken();