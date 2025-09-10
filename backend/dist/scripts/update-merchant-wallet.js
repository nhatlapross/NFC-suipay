"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Merchant_model_1 = require("../models/Merchant.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function updateMerchantWallet() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
        console.log('Connected to MongoDB');
        const newWalletAddress = '0xe92bfd25182a0562f126a364881502761c7d20739585234288728f449fc51bda';
        const result = await Merchant_model_1.Merchant.updateOne({ merchantId: 'MERCHANT_001' }, { walletAddress: newWalletAddress });
        console.log('Update result:', result);
        const merchant = await Merchant_model_1.Merchant.findOne({ merchantId: 'MERCHANT_001' });
        if (merchant) {
            console.log('Merchant updated successfully:');
            console.log('- ID:', merchant.merchantId);
            console.log('- Name:', merchant.merchantName);
            console.log('- Wallet:', merchant.walletAddress);
        }
        else {
            console.log('Merchant not found');
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
updateMerchantWallet();
//# sourceMappingURL=update-merchant-wallet.js.map