const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

// Test configuration
const TEST_CONFIG = {
    // Login credentials
    email: 'test5@gmail.com',
    password: 'Password123!',

    // Test recipient address (your current wallet)
    testAddress: '0x8feac43d7189be6a6c31d51ab12627d90ceba109fb966fa7da77901207875831',
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
        console.log('User wallet:', response.data.data.user.walletAddress);
        return response.data.data.user;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        throw error;
    }
}

async function getSponsorInfo() {
    try {
        console.log('\n💰 Getting sponsor info...');
        const response = await axios.get(`${API_BASE_URL}/sponsor/info`);

        console.log('✅ Sponsor info:');
        console.log('  Configured:', response.data.data.configured);

        if (response.data.data.configured) {
            console.log('  Address:', response.data.data.address);
            console.log('  SUI Balance:', response.data.data.balances.sui.formatted);
            console.log('  sVND Balance:', response.data.data.balances.myCoin.formatted);
            console.log('  Explorer:', response.data.data.explorerUrl);
        } else {
            console.log('  Message:', response.data.data.message);
        }

        return response.data.data;
    } catch (error) {
        console.error('❌ Get sponsor info failed:', error.response?.data || error.message);
        throw error;
    }
}

async function testFaucetSui() {
    try {
        console.log('\n🚰 Testing SUI faucet from sponsor wallet...');
        const response = await axios.post(
            `${API_BASE_URL}/sponsor/faucet/sui`,
            {
                address: TEST_CONFIG.testAddress,
                amount: 0.1  // 0.1 SUI
            },
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        console.log('✅ Faucet request successful:');
        console.log('  Amount:', response.data.data.amount, 'SUI');
        console.log('  From:', response.data.data.from);
        console.log('  To:', response.data.data.to);
        console.log('  TX Hash:', response.data.data.txHash);
        console.log('  Explorer:', response.data.data.explorerUrl);

        return response.data.data;
    } catch (error) {
        console.error('❌ Faucet SUI failed:', error.response?.data || error.message);
        return null;
    }
}

async function testFaucetMyCoin() {
    try {
        console.log('\n🪙 Testing sVND faucet from sponsor wallet...');
        const response = await axios.post(
            `${API_BASE_URL}/sponsor/faucet/mycoin`,
            {
                address: TEST_CONFIG.testAddress,
                amount: 100  // 100 sVND
            },
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        console.log('✅ Faucet request successful:');
        console.log('  Amount:', response.data.data.amount, 'sVND');
        console.log('  From:', response.data.data.from);
        console.log('  To:', response.data.data.to);
        console.log('  TX Hash:', response.data.data.txHash);
        console.log('  Explorer:', response.data.data.explorerUrl);

        return response.data.data;
    } catch (error) {
        console.error('❌ Faucet sVND failed:', error.response?.data || error.message);
        return null;
    }
}

async function testSponsorSui() {
    try {
        console.log('\n💸 Testing sponsor SUI...');
        const response = await axios.post(
            `${API_BASE_URL}/sponsor/sui`,
            {
                address: TEST_CONFIG.testAddress,
                amount: 0.05  // 0.05 SUI
            },
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        console.log('✅ SUI sponsor successful:');
        console.log('  Amount:', response.data.data.amount, 'SUI');
        console.log('  From:', response.data.data.from);
        console.log('  To:', response.data.data.to);
        console.log('  TX Hash:', response.data.data.txHash);
        console.log('  Gas Used:', response.data.data.gasUsed);
        console.log('  Explorer:', response.data.data.explorerUrl);

        return response.data.data;
    } catch (error) {
        console.error('❌ Sponsor SUI failed:', error.response?.data || error.message);
        return null;
    }
}

async function testSponsorMyCoin() {
    try {
        console.log('\n🪙 Testing sponsor sVND...');
        const response = await axios.post(
            `${API_BASE_URL}/sponsor/mycoin`,
            {
                address: TEST_CONFIG.testAddress,
                amount: 10  // 10 sVND
            },
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        console.log('✅ sVND sponsor successful:');
        console.log('  Amount:', response.data.data.amount, 'sVND');
        console.log('  From:', response.data.data.from);
        console.log('  To:', response.data.data.to);
        console.log('  TX Hash:', response.data.data.txHash);
        console.log('  Gas Used:', response.data.data.gasUsed);
        console.log('  Explorer:', response.data.data.explorerUrl);

        return response.data.data;
    } catch (error) {
        console.error('❌ Sponsor sVND failed:', error.response?.data || error.message);
        return null;
    }
}

async function testSponsorUser() {
    try {
        console.log('\n🎁 Testing sponsor user (both SUI and sVND)...');
        const response = await axios.post(
            `${API_BASE_URL}/sponsor/user`,
            {
                suiAmount: 0.1,   // 0.1 SUI
                myCoinAmount: 20  // 20 sVND
            },
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        console.log('✅ User sponsor result:');
        console.log('  Success:', response.data.success);
        console.log('  Message:', response.data.message);
        console.log('  Recipient:', response.data.data.recipient);
        console.log('  Transactions:');

        response.data.data.transactions.forEach((tx, i) => {
            console.log(`    ${i + 1}. ${tx.type}: ${tx.success ? '✅' : '❌'}`);
            if (tx.success) {
                console.log(`       Amount: ${tx.amount} ${tx.currency}`);
                console.log(`       TX: ${tx.txHash}`);
            } else {
                console.log(`       Error: ${tx.error}`);
            }
        });

        console.log('  Summary:', response.data.data.summary);

        return response.data.data;
    } catch (error) {
        console.error('❌ Sponsor user failed:', error.response?.data || error.message);
        return null;
    }
}

async function runTests() {
    console.log('========================================');
    console.log('    Sponsor Service Test Script');
    console.log('========================================');
    console.log(`Test recipient: ${TEST_CONFIG.testAddress}`);

    try {
        // Test 1: Get sponsor info (public)
        const sponsorInfo = await getSponsorInfo();

        if (!sponsorInfo.configured) {
            console.log('\n⚠️  Sponsor wallet not configured!');
            console.log('Add SPONSOR_PRIVATE_KEY to .env file to enable sponsor features');
            console.log('Only faucet will be available.\n');
        }

        // Test 2: Login for authenticated tests
        await login();

        // Test 3: Faucet SUI from sponsor wallet
        if (sponsorInfo.configured) {
            await testFaucetSui();
        }

        // Test 4: Faucet MY_COIN from sponsor wallet
        if (sponsorInfo.configured) {
            await testFaucetMyCoin();
        }

        // Test 5: Sponsor SUI (admin/merchant only)
        if (sponsorInfo.configured) {
            await testSponsorSui();
        }

        // Test 6: Sponsor MY_COIN (admin/merchant only)
        if (sponsorInfo.configured) {
            await testSponsorMyCoin();
        }

        // Test 7: Sponsor user (both currencies)
        if (sponsorInfo.configured) {
            await testSponsorUser();
        }

        console.log('\n========================================');
        console.log('           Test Summary');
        console.log('========================================');
        console.log('✅ Test completed! Check your wallet balance:');
        console.log(`   Address: ${TEST_CONFIG.testAddress}`);
        console.log(`   Explorer: https://suiscan.xyz/testnet/account/${TEST_CONFIG.testAddress}`);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Instructions
console.log('⚠️  Before running:');
console.log('1. Make sure backend is running on port 8080');
console.log('2. Update TEST_CONFIG with your test address');
console.log('3. Add SPONSOR_PRIVATE_KEY to .env for full testing');
console.log('\nStarting test in 3 seconds...\n');

setTimeout(() => {
    runTests().then(() => {
        console.log('\n✨ All tests completed!');
        process.exit(0);
    }).catch(error => {
        console.error('\n💥 Test suite failed:', error.message);
        process.exit(1);
    });
}, 3000);