import mongoose from 'mongoose';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient } from '../config/sui.config';
import { User } from '../models/User.model';
import { Merchant } from '../models/Merchant.model';
import { Transaction as TransactionModel } from '../models/Transaction.model';
import { initSuiClient } from '../config/sui.config';
import dotenv from 'dotenv';

dotenv.config();

async function testDirectPayment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
    console.log('✅ Connected to MongoDB');
    
    // Initialize Sui client
    await initSuiClient();
    console.log('✅ Sui client initialized');
    
    // Get user with private key
    const user = await User.findById('68bf13c1746dd185de2ee844').select('+encryptedPrivateKey');
    if (!user || !user.encryptedPrivateKey || !user.walletAddress) {
      throw new Error('User not found or wallet not configured');
    }
    console.log('✅ User found:', user.walletAddress);
    
    // Get merchant
    const merchant = await Merchant.findOne({ merchantId: 'MERCHANT_001' });
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    console.log('✅ Merchant found:', merchant.walletAddress);
    
    // Handle private key
    let keypair: Ed25519Keypair;
    if (user.encryptedPrivateKey.startsWith('suiprivkey1')) {
      keypair = Ed25519Keypair.fromSecretKey(user.encryptedPrivateKey);
      console.log('✅ Using bech32 private key');
    } else {
      throw new Error('Private key format not supported in test');
    }
    
    // Build transaction
    const amount = 0.01; // 0.01 SUI
    const amountInMist = Math.floor(amount * 1_000_000_000);
    
    console.log('\n📋 Transaction details:');
    console.log('- From:', user.walletAddress);
    console.log('- To:', merchant.walletAddress);
    console.log('- Amount:', amount, 'SUI');
    console.log('- Amount in MIST:', amountInMist);
    
    const tx = new Transaction();
    tx.setSender(user.walletAddress);
    
    // Split coins for payment
    const [paymentCoin] = tx.splitCoins(tx.gas, [
      tx.pure.u64(amountInMist)
    ]);
    
    // Transfer to merchant
    tx.transferObjects([paymentCoin], tx.pure.address(merchant.walletAddress));
    
    // Set gas budget
    tx.setGasBudget(10000000); // 0.01 SUI for gas
    
    console.log('\n🚀 Executing transaction on Sui blockchain...');
    
    // Sign and execute
    const suiClient = getSuiClient();
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });
    
    console.log('\n✅ Transaction submitted!');
    console.log('- Digest:', result.digest);
    console.log('- Status:', result.effects?.status.status);
    
    // Wait for confirmation
    console.log('\n⏳ Waiting for confirmation...');
    const confirmedTx = await suiClient.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
      },
    });
    
    const gasFee = Number(confirmedTx.effects?.gasUsed?.computationCost || 0) / 1_000_000_000;
    
    console.log('\n🎉 Transaction confirmed!');
    console.log('- TX Hash:', result.digest);
    console.log('- Gas Fee:', gasFee, 'SUI');
    console.log('- Total Cost:', amount + gasFee, 'SUI');
    console.log(`- Explorer: https://suiscan.xyz/testnet/tx/${result.digest}`);
    
    // Save to database
    const dbTransaction = await TransactionModel.create({
      userId: user._id,
      cardUuid: '550e8400-e29b-41d4-a716-446655440000',
      txHash: result.digest,
      type: 'payment',
      amount,
      currency: 'SUI',
      merchantId: merchant._id,
      merchantName: merchant.merchantName,
      status: 'completed',
      gasFee,
      totalAmount: amount + gasFee,
      fromAddress: user.walletAddress,
      toAddress: merchant.walletAddress,
      completedAt: new Date(),
    });
    
    console.log('\n✅ Transaction saved to database:', dbTransaction._id);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the test
testDirectPayment();