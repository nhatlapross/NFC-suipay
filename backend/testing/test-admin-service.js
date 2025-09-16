const mongoose = require('mongoose');
const { adminService } = require('../dist/services/admin.service.js');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment-app';

async function testAdminService() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Testing Admin Service Methods...\n');

    // Test 1: Get Payment Dashboard
    console.log('1️⃣ Testing getPaymentDashboard...');
    try {
      const dashboard = await adminService.getPaymentDashboard();
      console.log('✅ Dashboard data:', {
        activeCards: dashboard.activeCards,
        activeMerchants: dashboard.activeMerchants,
        totalTransactions: dashboard.totalTransactions,
        averageTransactionTime: dashboard.averageTransactionTime
      });
    } catch (error) {
      console.log('❌ Dashboard error:', error.message);
    }

    // Test 2: Get Card Health Status  
    console.log('\n2️⃣ Testing getCardHealthStatus...');
    try {
      const cardHealth = await adminService.getCardHealthStatus();
      console.log('✅ Card health data:', {
        cardStats: cardHealth.cardStats,
        problematicCardsCount: cardHealth.problematicCards.length
      });
    } catch (error) {
      console.log('❌ Card health error:', error.message);
    }

    // Test 3: Get System Health Metrics
    console.log('\n3️⃣ Testing getSystemHealthMetrics...');
    try {
      const systemHealth = await adminService.getSystemHealthMetrics();
      console.log('✅ System health data:', {
        systemStatus: systemHealth.systemStatus,
        timestamp: systemHealth.timestamp
      });
    } catch (error) {
      console.log('❌ System health error:', error.message);
    }

    // Test 4: Get Transactions (with filters)
    console.log('\n4️⃣ Testing getTransactions...');
    try {
      const transactions = await adminService.getTransactions({
        status: 'completed'
      }, 1, 5);
      console.log('✅ Transactions data:', {
        total: transactions.total,
        pages: transactions.pages,
        currentPage: transactions.currentPage,
        transactionsCount: transactions.transactions.length
      });
    } catch (error) {
      console.log('❌ Transactions error:', error.message);
    }

    // Test 5: Get Merchant Payment Health
    console.log('\n5️⃣ Testing getMerchantPaymentHealth...');
    try {
      const merchantHealth = await adminService.getMerchantPaymentHealth();
      console.log('✅ Merchant health data:', {
        merchantCount: merchantHealth.length,
        sampleMerchant: merchantHealth[0] || 'No merchants found'
      });
    } catch (error) {
      console.log('❌ Merchant health error:', error.message);
    }

    console.log('\n🎉 Admin Service Tests Completed!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testAdminService().catch(console.error);