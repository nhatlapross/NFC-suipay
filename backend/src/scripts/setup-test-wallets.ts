import mongoose from 'mongoose';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { User } from '../models/User.model';
import { Merchant } from '../models/Merchant.model';
import { encryptPrivateKey } from '../services/encryption.service';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestWallets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
    console.log('Connected to MongoDB');

    // Initialize Sui client
    const network = process.env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' || 'testnet';
    const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
    console.log(`Connected to Sui ${network}`);

    // Generate keypair for test user
    console.log('\n🔑 Generating test user wallet...');
    const userKeypair = new Ed25519Keypair();
    const userAddress = userKeypair.getPublicKey().toSuiAddress();
    const userPrivateKey = userKeypair.getSecretKey();
    
    console.log('User wallet address:', userAddress);
    
    // Check if it's already a string (bech32) or Uint8Array
    let privateKeyBase64: string;
    if (typeof userPrivateKey === 'string') {
      // It's already a bech32 string, store it directly
      console.log('User private key (bech32):', userPrivateKey);
      privateKeyBase64 = userPrivateKey; // Don't encrypt bech32
    } else {
      // It's Uint8Array, convert to base64
      privateKeyBase64 = Buffer.from(userPrivateKey).toString('base64');
      console.log('User private key (base64):', privateKeyBase64);
    }
    
    // Encrypt private key only if it's base64
    const encryptedUserKey = typeof userPrivateKey === 'string' 
      ? userPrivateKey  // Store bech32 directly
      : encryptPrivateKey(privateKeyBase64);
    
    // Update test user with wallet
    const testUser = await User.findOne({ email: 'user@example.com' });
    if (testUser) {
      testUser.walletAddress = userAddress;
      testUser.encryptedPrivateKey = encryptedUserKey;
      await testUser.save();
      console.log('✅ Test user wallet updated');
    } else {
      console.log('⚠️  Test user not found, creating new user...');
      await User.create({
        email: 'user@example.com',
        password: 'Test123456!',
        phoneNumber: '+1234567890',
        fullName: 'Test User',
        walletAddress: userAddress,
        encryptedPrivateKey: encryptedUserKey,
        role: 'user',
        kycStatus: 'verified',
        status: 'active',
      });
      console.log('✅ Test user created with wallet');
    }

    // Generate keypair for test merchant
    console.log('\n🔑 Generating test merchant wallet...');
    const merchantKeypair = new Ed25519Keypair();
    const merchantAddress = merchantKeypair.getPublicKey().toSuiAddress();
    const merchantPrivateKey = merchantKeypair.getSecretKey();
    
    console.log('Merchant wallet address:', merchantAddress);
    console.log('Merchant private key (base64):', Buffer.from(merchantPrivateKey).toString('base64'));
    
    // Update test merchant with wallet
    const testMerchant = await Merchant.findOne({ merchantId: 'MERCHANT_001' });
    if (testMerchant) {
      testMerchant.walletAddress = merchantAddress;
      await testMerchant.save();
      console.log('✅ Test merchant wallet updated');
    } else {
      console.log('⚠️  Test merchant not found');
    }

    // Check balances
    console.log('\n💰 Checking balances...');
    
    try {
      const userBalance = await suiClient.getBalance({
        owner: userAddress,
        coinType: '0x2::sui::SUI',
      });
      console.log(`User balance: ${Number(userBalance.totalBalance) / 1_000_000_000} SUI`);
      
      if (Number(userBalance.totalBalance) === 0) {
        console.log('\n⚠️  User wallet has no SUI. To get testnet SUI:');
        console.log(`   1. Visit: https://discord.gg/sui`);
        console.log(`   2. Go to #testnet-faucet channel`);
        console.log(`   3. Type: !faucet ${userAddress}`);
      }
    } catch (error) {
      console.log('Could not fetch user balance:', error);
    }

    try {
      const merchantBalance = await suiClient.getBalance({
        owner: merchantAddress,
        coinType: '0x2::sui::SUI',
      });
      console.log(`Merchant balance: ${Number(merchantBalance.totalBalance) / 1_000_000_000} SUI`);
    } catch (error) {
      console.log('Could not fetch merchant balance:', error);
    }

    console.log('\n✨ Test wallets setup complete!');
    console.log('\n📝 Save these credentials securely:');
    console.log('=====================================');
    console.log('USER_WALLET_ADDRESS=' + userAddress);
    console.log('USER_PRIVATE_KEY=' + Buffer.from(userPrivateKey).toString('base64'));
    console.log('MERCHANT_WALLET_ADDRESS=' + merchantAddress);
    console.log('MERCHANT_PRIVATE_KEY=' + Buffer.from(merchantPrivateKey).toString('base64'));
    console.log('=====================================');

  } catch (error) {
    console.error('Error setting up wallets:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the setup
setupTestWallets();