const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

// Test configuration - you need to update these values
const TEST_CONFIG = {
    // Login credentials for sender account
    email: 'test@example.com', // Update with your test account email
    password: 'Test123!@#',    // Update with your test account password

    // Recipient address for testing
    recipientAddress: '0x7b8e0864967427679b4e129f79dc332a885c6087ec9e187b53451a9006ee15f2', // Update with a valid test recipient address

    // Amount to send (in MY_COIN, not raw units)
    amount: 0.1
};

let authToken = null;

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_CONFIG.email,
            password: TEST_CONFIG.password
        });

        authToken = response.data.data.token;
        console.log('✅ Login successful');
        console.log('User:', response.data.data.user.email);
        console.log('Wallet:', response.data.data.user.walletAddress);
        return response.data.data.user;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        throw error;
    }
}

async function checkMyCoinBalance() {
    try {
        console.log('\n💰 Checking MY_COIN balance...');
        const response = await axios.get(`${API_BASE_URL}/payments/mycoin/balance`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Balance check successful');
        console.log('Balance:', response.data.data.balance);
        console.log('Formatted:', response.data.data.formatted);
        return response.data.data;
    } catch (error) {
        console.error('❌ Balance check failed:', error.response?.data || error.message);
        throw error;
    }
}

async function getMyCoinObjects() {
    try {
        console.log('\n📦 Getting MY_COIN objects...');
        const response = await axios.get(`${API_BASE_URL}/payments/mycoin/objects`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Got MY_COIN objects');
        console.log('Objects count:', response.data.data.objects.length);
        response.data.data.objects.forEach((obj, index) => {
            console.log(`  Object ${index + 1}:`, {
                objectId: obj.objectId,
                balance: obj.balance,
                formatted: obj.balanceFormatted
            });
        });
        return response.data.data;
    } catch (error) {
        console.error('❌ Failed to get objects:', error.response?.data || error.message);
        throw error;
    }
}

async function testMyCoinPayment() {
    try {
        console.log('\n🚀 Testing MY_COIN payment...');
        console.log('Sending to:', TEST_CONFIG.recipientAddress);
        console.log('Amount:', TEST_CONFIG.amount, 'MY_COIN');

        const response = await axios.post(
            `${API_BASE_URL}/payments/mycoin/test-payment`,
            {
                recipientAddress: TEST_CONFIG.recipientAddress,
                amount: TEST_CONFIG.amount
            },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            }
        );

        console.log('\n✅ Payment successful!');
        console.log('Transaction hash:', response.data.data.txHash);
        console.log('Status:', response.data.data.status);
        console.log('Gas used:', response.data.data.gasUsed);
        console.log('Explorer URL:', response.data.data.explorerUrl);
        return response.data.data;
    } catch (error) {
        console.error('\n❌ Payment failed:', error.response?.data || error.message);
        if (error.response?.data?.details) {
            console.error('Error details:', error.response.data.details);
        }
        throw error;
    }
}

async function runTests() {
    console.log('========================================');
    console.log('    MY_COIN Payment Test Script');
    console.log('========================================');

    try {
        // Step 1: Login
        const user = await login();

        // Step 2: Check balance before payment
        console.log('\n--- Before Payment ---');
        const balanceBefore = await checkMyCoinBalance();

        // Step 3: Get coin objects
        await getMyCoinObjects();

        // Check if we have enough balance
        if (balanceBefore.balance < TEST_CONFIG.amount) {
            console.error(`\n❌ Insufficient balance for test`);
            console.error(`Required: ${TEST_CONFIG.amount} MY_COIN`);
            console.error(`Available: ${balanceBefore.formatted}`);
            return;
        }

        // Step 4: Test payment
        const paymentResult = await testMyCoinPayment();

        // Step 5: Check balance after payment (wait a bit for blockchain)
        console.log('\n⏳ Waiting 3 seconds for transaction to be indexed...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n--- After Payment ---');
        const balanceAfter = await checkMyCoinBalance();

        // Summary
        console.log('\n========================================');
        console.log('           Test Summary');
        console.log('========================================');
        console.log('✅ Test completed successfully!');
        console.log(`Balance before: ${balanceBefore.formatted}`);
        console.log(`Balance after:  ${balanceAfter.formatted}`);
        console.log(`Amount sent:    ${TEST_CONFIG.amount} MY_COIN`);
        console.log(`Transaction:    ${paymentResult.txHash}`);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Instructions for user
console.log('\n⚠️  IMPORTANT: Before running this test, update the TEST_CONFIG:');
console.log('1. Set your test account email and password');
console.log('2. Set a valid recipient address');
console.log('3. Set the amount to send (make sure you have enough balance)');
console.log('\nPress Ctrl+C to cancel or wait 5 seconds to continue...\n');

setTimeout(() => {
    runTests().then(() => {
        console.log('\n✨ All tests completed!');
        process.exit(0);
    }).catch(error => {
        console.error('\n💥 Test suite failed:', error.message);
        process.exit(1);
    });
}, 5000);