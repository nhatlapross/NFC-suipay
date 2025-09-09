import mongoose from 'mongoose';
import { Merchant } from '../models/Merchant.model';
import dotenv from 'dotenv';

dotenv.config();

async function updateMerchantWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
    console.log('Connected to MongoDB');
    
    const newWalletAddress = '0xe92bfd25182a0562f126a364881502761c7d20739585234288728f449fc51bda';
    
    const result = await Merchant.updateOne(
      { merchantId: 'MERCHANT_001' },
      { walletAddress: newWalletAddress }
    );
    
    console.log('Update result:', result);
    
    const merchant = await Merchant.findOne({ merchantId: 'MERCHANT_001' });
    if (merchant) {
      console.log('Merchant updated successfully:');
      console.log('- ID:', merchant.merchantId);
      console.log('- Name:', merchant.merchantName);
      console.log('- Wallet:', merchant.walletAddress);
    } else {
      console.log('Merchant not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateMerchantWallet();