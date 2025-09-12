const { MongoClient } = require('mongodb');
require('dotenv').config();

async function createSampleData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Find existing user
    const user = await db.collection('users').findOne({ email: 'user@example.com' });
    if (!user) {
      console.error('❌ User not found. Please login to create user first.');
      return;
    }

    console.log(`🔍 Found user: ${user.email}`);

    // Create sample merchants
    const merchants = [
      {
        merchantId: 'MERCHANT_001',
        merchantName: 'Coffee Shop ABC',
        businessType: 'cafe',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        email: 'merchant001@coffeeshop.com',
        phoneNumber: '+84123456789',
        address: {
          street: '123 Nguyen Hue',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          country: 'Vietnam',
          postalCode: '700000'
        },
        apiKeys: {
          publicKey: 'pk_test_' + Math.random().toString(36).substring(2, 15),
          secretKey: 'sk_test_' + Math.random().toString(36).substring(2, 15),
          webhookSecret: 'whsec_' + Math.random().toString(36).substring(2, 15)
        },
        isActive: true,
        isVerified: true,
        commission: 0.02,
        settlementPeriod: 'daily',
        nextSettlementDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalTransactions: 0,
        totalVolume: 0,
        metadata: {
          category: 'food_beverage',
          tags: ['coffee', 'cafe', 'drinks'],
          description: 'Premium coffee shop in city center'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        merchantId: 'MERCHANT_TEST',
        merchantName: 'NFC Test Terminal',
        businessType: 'testing',
        walletAddress: '0xtest1234567890abcdef1234567890abcdef12345',
        email: 'test@nfcterminal.com',
        phoneNumber: '+84555666777',
        address: {
          street: 'Test Location',
          city: 'Test City',
          state: 'Test State',
          country: 'Vietnam',
          postalCode: '000000'
        },
        apiKeys: {
          publicKey: 'pk_test_' + Math.random().toString(36).substring(2, 15),
          secretKey: 'sk_test_' + Math.random().toString(36).substring(2, 15),
          webhookSecret: 'whsec_' + Math.random().toString(36).substring(2, 15)
        },
        isActive: true,
        isVerified: true,
        commission: 0.0,
        settlementPeriod: 'daily',
        nextSettlementDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalTransactions: 0,
        totalVolume: 0,
        metadata: {
          category: 'testing',
          tags: ['test', 'nfc', 'payment'],
          description: 'Test terminal for NFC payment validation'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert merchants
    for (const merchantData of merchants) {
      const existing = await db.collection('merchants').findOne({ merchantId: merchantData.merchantId });
      if (!existing) {
        await db.collection('merchants').insertOne(merchantData);
        console.log(`✅ Created merchant: ${merchantData.merchantName}`);
      } else {
        console.log(`⏭️  Merchant exists: ${existing.merchantName}`);
      }
    }

    // Create sample cards
    const cards = [
      {
        cardUuid: '550e8400-e29b-41d4-a716-446655440000',
        userId: user._id,
        cardNumber: generateCardNumber(),
        cardType: 'physical',
        isActive: true,
        isPrimary: true,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
        usageCount: 0,
        dailySpent: 0,
        monthlySpent: 0,
        dailyLimit: 1000, // 1000 SUI daily
        monthlyLimit: 20000, // 20000 SUI monthly
        singleTransactionLimit: 500, // 500 SUI per transaction
        lastResetDate: new Date(),
        metadata: {
          issueDate: new Date(),
          cardDesign: 'blue',
          nfcEnabled: true,
          contactlessEnabled: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        cardUuid: 'test-nfc-card-12345',
        userId: user._id,
        cardNumber: generateCardNumber(),
        cardType: 'test',
        isActive: true,
        isPrimary: false,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageCount: 0,
        dailySpent: 0,
        monthlySpent: 0,
        dailyLimit: 100, // 100 SUI daily
        monthlyLimit: 1000, // 1000 SUI monthly
        singleTransactionLimit: 50, // 50 SUI per transaction
        lastResetDate: new Date(),
        metadata: {
          issueDate: new Date(),
          cardDesign: 'test',
          nfcEnabled: true,
          contactlessEnabled: true,
          testCard: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert cards
    for (const cardData of cards) {
      const existing = await db.collection('cards').findOne({ cardUuid: cardData.cardUuid });
      if (!existing) {
        await db.collection('cards').insertOne(cardData);
        console.log(`✅ Created card: ${cardData.cardUuid} (${cardData.cardType})`);
      } else {
        console.log(`⏭️  Card exists: ${existing.cardUuid}`);
      }
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📋 Test Commands:');
    console.log('1. Test NFC validation:');
    console.log(`curl -X POST http://localhost:8080/api/payment/nfc-validate \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"cardUuid": "test-nfc-card-12345", "amount": 0.01, "merchantId": "MERCHANT_TEST", "terminalId": "TERMINAL_001"}'`);
    
    console.log('\n2. Test with valid card:');
    console.log(`curl -X POST http://localhost:8080/api/payment/nfc-validate \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"cardUuid": "550e8400-e29b-41d4-a716-446655440000", "amount": 1.5, "merchantId": "MERCHANT_001", "terminalId": "TERMINAL_001"}'`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

function generateCardNumber() {
  const prefix = '4000';
  let number = prefix;
  for (let i = 0; i < 12; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
}

createSampleData();