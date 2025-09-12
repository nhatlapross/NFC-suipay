"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Merchant_model_1 = require("../models/Merchant.model");
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateApiKey = () => crypto_1.default.randomBytes(32).toString('hex');
async function seedMerchant() {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
        console.log('Connected to MongoDB');
        // Check if merchant already exists
        const existingMerchant = await Merchant_model_1.Merchant.findOne({ merchantId: 'MERCHANT_001' });
        if (existingMerchant) {
            console.log('Merchant MERCHANT_001 already exists');
            console.log('Merchant wallet address:', existingMerchant.walletAddress);
            return;
        }
        // Create test merchant
        const testMerchant = await Merchant_model_1.Merchant.create({
            merchantId: 'MERCHANT_001',
            merchantName: 'Test Coffee Shop',
            businessType: 'Restaurant',
            walletAddress: '0x7d2f5c8e9a3b1f4e6d5c8a9b3f1e4d6c5a8b9f3e', // Example wallet address
            email: 'merchant@testcoffeeshop.com',
            phoneNumber: '+1234567890',
            address: {
                street: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                country: 'USA',
                postalCode: '94105',
            },
            apiKeys: {
                publicKey: generateApiKey(),
                secretKey: generateApiKey(),
                webhookSecret: generateApiKey(),
            },
            webhookUrl: 'https://example.com/webhook',
            isActive: true,
            isVerified: true,
            commission: 2.5, // 2.5% commission
            settlementPeriod: 'daily',
            nextSettlementDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            totalTransactions: 0,
            totalVolume: 0,
        });
        console.log('Test merchant created successfully:');
        console.log('Merchant ID:', testMerchant.merchantId);
        console.log('Merchant Name:', testMerchant.merchantName);
        console.log('Wallet Address:', testMerchant.walletAddress);
        console.log('Public Key:', testMerchant.apiKeys.publicKey);
    }
    catch (error) {
        console.error('Error seeding merchant:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
// Run the seed function
seedMerchant();
//# sourceMappingURL=seed-merchant.js.map