const mongoose = require('mongoose');
const { Card } = require('../models/Card.model');
const { Merchant } = require('../models/Merchant.model');
const { User } = require('../models/User.model');
require('dotenv').config();

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
    console.log('✅ Connected to MongoDB');

    // Find the test user we created earlier
    const user = await User.findOne({ email: 'user@example.com' });
    if (!user) {
      console.error('❌ Test user not found. Please login first to create the user.');
      process.exit(1);
    }

    console.log(`🔍 Found test user: ${user.email} (${user._id})`);

    // Create sample merchants
    const merchants = [
      {
        merchantId: 'MERCHANT_001',
        merchantName: 'Coffee Shop ABC',
        businessType: 'cafe',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        isActive: true,
        contactInfo: {
          email: 'merchant@coffeeshop.com',
          phone: '+84123456789'
        },
        businessInfo: {
          businessName: 'Coffee Shop ABC',
          address: '123 Nguyen Hue, District 1, HCMC',
          taxId: 'TAX123456789'
        },
        paymentSettings: {
          acceptedCurrencies: ['SUI'],
          minTransactionAmount: 0.001,
          maxTransactionAmount: 100,
          commissionRate: 0.02
        },
        metadata: {
          category: 'food_beverage',
          tags: ['coffee', 'cafe', 'drinks'],
          description: 'Premium coffee shop in city center'
        }
      },
      {
        merchantId: 'MERCHANT_002', 
        merchantName: 'Tech Store XYZ',
        businessType: 'retail',
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        isActive: true,
        contactInfo: {
          email: 'contact@techstore.com',
          phone: '+84987654321'
        },
        businessInfo: {
          businessName: 'Tech Store XYZ',
          address: '456 Le Loi, District 3, HCMC',
          taxId: 'TAX987654321'
        },
        paymentSettings: {
          acceptedCurrencies: ['SUI'],
          minTransactionAmount: 0.01,
          maxTransactionAmount: 1000,
          commissionRate: 0.015
        },
        metadata: {
          category: 'electronics',
          tags: ['technology', 'electronics', 'gadgets'],
          description: 'Latest technology and electronics store'
        }
      },
      {
        merchantId: 'MERCHANT_TEST',
        merchantName: 'NFC Test Terminal',
        businessType: 'testing',
        walletAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
        isActive: true,
        contactInfo: {
          email: 'test@nfc.com',
          phone: '+84555666777'
        },
        businessInfo: {
          businessName: 'NFC Test Terminal',
          address: 'Test Location, Test City',
          taxId: 'TEST123456789'
        },
        paymentSettings: {
          acceptedCurrencies: ['SUI'],
          minTransactionAmount: 0.001,
          maxTransactionAmount: 10,
          commissionRate: 0.0
        },
        metadata: {
          category: 'testing',
          tags: ['test', 'nfc', 'payment'],
          description: 'Test terminal for NFC payment validation'
        }
      }
    ];

    // Insert merchants
    for (const merchantData of merchants) {
      const existingMerchant = await Merchant.findOne({ merchantId: merchantData.merchantId });
      if (!existingMerchant) {
        const merchant = await Merchant.create(merchantData);
        console.log(`✅ Created merchant: ${merchant.merchantName} (${merchant.merchantId})`);
      } else {
        console.log(`⏭️  Merchant already exists: ${existingMerchant.merchantName}`);
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
        dailyLimit: 1000000, // 1M VND equivalent in SUI
        monthlyLimit: 20000000, // 20M VND 
        singleTransactionLimit: 500000, // 500K VND
        dailySpent: 0,
        monthlySpent: 0,
        usageCount: 0,
        expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
        lastResetDate: new Date(),
        metadata: {
          issueDate: new Date(),
          cardDesign: 'blue',
          nfcEnabled: true,
          contactlessEnabled: true
        }
      },
      {
        cardUuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        userId: user._id,
        cardNumber: generateCardNumber(),
        cardType: 'virtual',
        isActive: true,
        dailyLimit: 2000000, // 2M VND
        monthlyLimit: 50000000, // 50M VND
        singleTransactionLimit: 1000000, // 1M VND
        dailySpent: 0,
        monthlySpent: 0,
        usageCount: 0,
        expiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
        lastResetDate: new Date(),
        metadata: {
          issueDate: new Date(),
          cardDesign: 'gold',
          nfcEnabled: true,
          contactlessEnabled: true,
          virtualCard: true
        }
      },
      {
        cardUuid: 'test-nfc-card-12345',
        userId: user._id,
        cardNumber: generateCardNumber(),
        cardType: 'test',
        isActive: true,
        dailyLimit: 100, // Low limit for testing (0.1 SUI)
        monthlyLimit: 1000, // 1 SUI monthly
        singleTransactionLimit: 50, // 0.05 SUI per transaction
        dailySpent: 0,
        monthlySpent: 0,
        usageCount: 0,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        lastResetDate: new Date(),
        metadata: {
          issueDate: new Date(),
          cardDesign: 'test',
          nfcEnabled: true,
          contactlessEnabled: true,
          testCard: true
        }
      }
    ];

    // Insert cards
    for (const cardData of cards) {
      const existingCard = await Card.findOne({ cardUuid: cardData.cardUuid });
      if (!existingCard) {
        const card = await Card.create(cardData);
        console.log(`✅ Created card: ${card.cardUuid} (${card.cardType})`);
      } else {
        console.log(`⏭️  Card already exists: ${existingCard.cardUuid}`);
      }
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📋 Test Data Summary:');
    console.log('User:', user.email);
    console.log('Cards created:');
    cards.forEach(card => {
      console.log(`  - ${card.cardUuid} (${card.cardType}) - Daily: ${card.dailyLimit/1000000}M VND`);
    });
    console.log('Merchants created:');
    merchants.forEach(merchant => {
      console.log(`  - ${merchant.merchantId} (${merchant.merchantName})`);
    });

    console.log('\n🧪 Test Commands:');
    console.log('1. Test NFC validation:');
    console.log(`curl -X POST http://localhost:8080/api/payment/nfc-validate \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"cardUuid": "test-nfc-card-12345", "amount": 0.01, "merchantId": "MERCHANT_TEST", "terminalId": "TERMINAL_001"}'`);
    
    console.log('\n2. Test fast payment health:');
    console.log(`curl -X GET http://localhost:8080/api/fast-payment/health`);
    
    console.log('\n3. Test authenticated endpoints:');
    console.log(`curl -X GET http://localhost:8080/api/fast-payment/cache-stats \\`);
    console.log(`  -H "Authorization: Bearer YOUR_JWT_TOKEN"`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

function generateCardNumber() {
  // Generate a 16-digit card number starting with 4000 (Visa test range)
  const prefix = '4000';
  let number = prefix;
  
  for (let i = 0; i < 12; i++) {
    number += Math.floor(Math.random() * 10);
  }
  
  return number;
}

// Run if called directly
if (require.main === module) {
  createSampleData();
}

module.exports = { createSampleData };