import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 8080}`;
const TOKEN = process.env.TEST_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJmMTNjMTc0NmRkMTg1ZGUyZWU4NDQiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1NzQyNjg4NywiZXhwIjoxNzU3NDMwNDg3fQ.un1rI6UOZrtmow8SvkKYQAiaBFcUPY50QUalO8o9Y4g';

interface PaymentTestData {
  cardUuid: string;
  amount: number;
  merchantId: string;
  terminalId: string;
}

async function testPaymentFlow() {
  console.log('🚀 Starting NFC Payment Flow Test\n');
  console.log('================================\n');

  const testData: PaymentTestData = {
    cardUuid: '550e8400-e29b-41d4-a716-446655440000',
    amount: 1.5,
    merchantId: 'MERCHANT_001',
    terminalId: 'TERMINAL_001',
  };

  try {
    // Step 1: Test NFC Validation (no auth required)
    console.log('📋 Step 1: Testing NFC Card Validation...');
    try {
      const validationResponse = await axios.post(
        `${API_URL}/api/payment/nfc-validate`,
        {
          cardUuid: testData.cardUuid,
          amount: testData.amount,
          merchantId: testData.merchantId,
        }
      );
      console.log('✅ NFC Validation Response:', validationResponse.data);
    } catch (error: any) {
      console.log('⚠️  NFC Validation Error:', error.response?.data || error.message);
    }
    console.log('\n');

    // Step 2: Process Async Payment
    console.log('💳 Step 2: Processing Async Payment...');
    const paymentResponse = await axios.post(
      `${API_URL}/api/payment/process-async`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Payment Initiated:', {
      success: paymentResponse.data.success,
      transactionId: paymentResponse.data.transactionId,
      status: paymentResponse.data.status,
      jobId: paymentResponse.data.tracking?.jobId,
    });
    console.log('\n');

    const transactionId = paymentResponse.data.transactionId;

    // Step 3: Check Transaction Status
    console.log('🔍 Step 3: Checking Transaction Status...');
    
    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const statusResponse = await axios.get(
      `${API_URL}/api/payment/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      }
    );

    console.log('📊 Transaction Status:', {
      transactionId: statusResponse.data.transactionId,
      status: statusResponse.data.status,
      txHash: statusResponse.data.txHash,
      amount: statusResponse.data.amount,
      gasFee: statusResponse.data.gasFee,
      completedAt: statusResponse.data.completedAt,
    });

    if (statusResponse.data.txHash && statusResponse.data.txHash !== 'pending_' + transactionId) {
      const network = process.env.SUI_NETWORK || 'testnet';
      console.log(`\n🔗 View on Sui Explorer: https://suiscan.xyz/${network}/tx/${statusResponse.data.txHash}`);
    }

    // Step 4: Get Transaction History
    console.log('\n📜 Step 4: Getting Transaction History...');
    const historyResponse = await axios.get(
      `${API_URL}/api/payment/transactions`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
        params: {
          limit: 5,
        },
      }
    );

    console.log(`✅ Found ${historyResponse.data.total} transactions`);
    console.log('Recent transactions:', historyResponse.data.transactions.slice(0, 3).map((tx: any) => ({
      id: tx._id,
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.createdAt,
    })));

    // Step 5: Get Payment Stats
    console.log('\n📈 Step 5: Getting Payment Statistics...');
    const statsResponse = await axios.get(
      `${API_URL}/api/payment/stats`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
        params: {
          period: 'day',
        },
      }
    );

    console.log('📊 Today\'s Stats:', {
      totalTransactions: statsResponse.data.totalTransactions,
      totalAmount: statsResponse.data.totalAmount,
      averageAmount: statsResponse.data.averageAmount,
      successRate: `${statsResponse.data.successRate}%`,
    });

    console.log('\n================================');
    console.log('✨ Payment Flow Test Completed Successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', {
      message: error.response?.data?.error || error.message,
      status: error.response?.status,
      details: error.response?.data,
    });
    process.exit(1);
  }
}

// WebSocket monitoring (optional)
function setupWebSocketMonitoring(transactionId: string) {
  console.log('\n🔌 Setting up WebSocket monitoring for transaction:', transactionId);
  
  // This would require socket.io-client
  // For now, just log that it would be monitored
  console.log('⚡ Would monitor WebSocket events:');
  console.log('  - payment:processing');
  console.log('  - payment:completed');
  console.log('  - payment:failed');
}

// Run the test
testPaymentFlow().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});