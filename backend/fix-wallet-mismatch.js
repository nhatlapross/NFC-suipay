const mongoose = require('mongoose');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const crypto = require('crypto');
require('dotenv').config();

// Encryption setup
const algorithm = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

function encryptPrivateKey(privateKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decryptPrivateKey(encryptedData) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// User schema
const userSchema = new mongoose.Schema({
    email: String,
    walletAddress: String,
    encryptedPrivateKey: String,
});
const User = mongoose.model('User', userSchema);

async function fixWalletMismatch() {
    console.log('===========================================');
    console.log('   Fix Wallet Address Mismatch');
    console.log('===========================================\n');

    // TARGET: The address that has MY_COIN
    const TARGET_ADDRESS = '0xc555389e3659831c86065d42d085db54e015b347a25e3f5c69d91a589cee1e3b';
    const USER_EMAIL = 'test5@gmail.com';

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
        console.log('✅ Connected to MongoDB\n');

        // Connect to Sui
        const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

        // Find user
        const user = await User.findOne({ email: USER_EMAIL });
        if (!user) {
            console.error(`❌ User not found: ${USER_EMAIL}`);
            process.exit(1);
        }

        console.log('Current user configuration:');
        console.log('  Email:', user.email);
        console.log('  DB Wallet Address:', user.walletAddress);

        // Check current private key
        let currentKeypair;
        let currentDerivedAddress;

        if (user.encryptedPrivateKey) {
            try {
                if (user.encryptedPrivateKey.startsWith('suiprivkey1')) {
                    currentKeypair = Ed25519Keypair.fromSecretKey(user.encryptedPrivateKey);
                } else {
                    const decrypted = decryptPrivateKey(user.encryptedPrivateKey);
                    const keyBuffer = Buffer.from(decrypted, 'base64');
                    const secretKey = keyBuffer.length > 32 ? keyBuffer.subarray(0, 32) : keyBuffer;
                    currentKeypair = Ed25519Keypair.fromSecretKey(secretKey);
                }
                currentDerivedAddress = currentKeypair.getPublicKey().toSuiAddress();
                console.log('  Current key derives to:', currentDerivedAddress);
            } catch (error) {
                console.error('  Error with current key:', error.message);
            }
        }

        console.log('\nTarget address with MY_COIN:', TARGET_ADDRESS);

        // Check MY_COIN balance at both addresses
        console.log('\n📊 Checking balances...');

        // Check target address
        const targetBalance = await suiClient.getBalance({
            owner: TARGET_ADDRESS,
            coinType: '0x8f3c2d177fa5e156247d4de83d73fee684e5633d9f291c31a624333325f04398::my_coin::MY_COIN'
        });
        console.log(`\nMY_COIN at ${TARGET_ADDRESS}:`);
        console.log('  Balance:', targetBalance.totalBalance);

        // Check derived address if different
        if (currentDerivedAddress && currentDerivedAddress !== TARGET_ADDRESS) {
            const derivedBalance = await suiClient.getBalance({
                owner: currentDerivedAddress,
                coinType: '0x8f3c2d177fa5e156247d4de83d73fee684e5633d9f291c31a624333325f04398::my_coin::MY_COIN'
            });
            console.log(`\nMY_COIN at ${currentDerivedAddress}:`);
            console.log('  Balance:', derivedBalance.totalBalance);
        }

        console.log('\n===========================================');
        console.log('                SOLUTION');
        console.log('===========================================\n');

        if (currentDerivedAddress === TARGET_ADDRESS) {
            console.log('✅ Good news! The private key already matches the target address.');
            console.log('   The issue might be in how the address is stored in the database.\n');

            if (user.walletAddress !== TARGET_ADDRESS) {
                console.log('🔧 Fix: Update the database wallet address to match the target.\n');

                console.log('Updating database...');
                await User.updateOne(
                    { email: USER_EMAIL },
                    { $set: { walletAddress: TARGET_ADDRESS } }
                );
                console.log('✅ Database updated! Wallet address now matches the private key.');
            }
        } else {
            console.log('❌ The current private key does NOT match the target address.\n');
            console.log('You have 3 options:\n');

            console.log('Option 1: TRANSFER COINS (Recommended)');
            console.log('---------');
            console.log(`Transfer MY_COIN from ${TARGET_ADDRESS}`);
            console.log(`                   to ${currentDerivedAddress}`);
            console.log('Then the current private key will work.\n');

            console.log('Option 2: IMPORT CORRECT PRIVATE KEY');
            console.log('---------');
            console.log(`You need the private key for address: ${TARGET_ADDRESS}`);
            console.log('If you have it, update CONFIG in update-user-key.js and run it.\n');

            console.log('Option 3: GENERATE NEW WALLET');
            console.log('---------');
            console.log('Generate a completely new wallet and transfer all assets there.');
            console.log('Run: node update-user-key.js update (with generateNewKeypair: true)\n');

            // Attempt to update to use derived address if it has coins
            if (currentDerivedAddress) {
                const derivedBalance = await suiClient.getBalance({
                    owner: currentDerivedAddress,
                    coinType: '0x8f3c2d177fa5e156247d4de83d73fee684e5633d9f291c31a624333325f04398::my_coin::MY_COIN'
                });

                if (parseInt(derivedBalance.totalBalance) > 0) {
                    console.log('🎉 Good news! The derived address has MY_COIN balance!');
                    console.log('   Updating database to use the derived address...\n');

                    await User.updateOne(
                        { email: USER_EMAIL },
                        { $set: { walletAddress: currentDerivedAddress } }
                    );
                    console.log('✅ Database updated! Now using the derived address.');
                    console.log('   Payments should work now.');
                }
            }
        }

        console.log('\n===========================================\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Quick check function
async function quickCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');

        const users = await User.find({}).limit(10);
        console.log('\n📋 Users and their wallet status:\n');

        for (const user of users) {
            console.log(`User: ${user.email}`);
            console.log(`  DB Address: ${user.walletAddress}`);

            if (user.encryptedPrivateKey) {
                try {
                    let keypair;
                    if (user.encryptedPrivateKey.startsWith('suiprivkey1')) {
                        keypair = Ed25519Keypair.fromSecretKey(user.encryptedPrivateKey);
                    } else {
                        const decrypted = decryptPrivateKey(user.encryptedPrivateKey);
                        const keyBuffer = Buffer.from(decrypted, 'base64');
                        const secretKey = keyBuffer.length > 32 ? keyBuffer.subarray(0, 32) : keyBuffer;
                        keypair = Ed25519Keypair.fromSecretKey(secretKey);
                    }
                    const derived = keypair.getPublicKey().toSuiAddress();
                    console.log(`  Key derives to: ${derived}`);
                    console.log(`  Match: ${derived === user.walletAddress ? '✅' : '❌ MISMATCH'}`);
                } catch (e) {
                    console.log(`  Key error: ${e.message}`);
                }
            }
            console.log();
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run based on command
const command = process.argv[2];

if (command === 'check') {
    quickCheck();
} else if (command === 'fix') {
    fixWalletMismatch();
} else {
    console.log('Wallet Mismatch Fixer\n');
    console.log('Usage:');
    console.log('  node fix-wallet-mismatch.js check  - Check all users for mismatches');
    console.log('  node fix-wallet-mismatch.js fix    - Fix the mismatch for test5@gmail.com');
    console.log('\nThis will analyze the problem and suggest/apply fixes.');
}