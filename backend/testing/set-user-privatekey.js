const mongoose = require('mongoose');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');
require('dotenv').config();

// Encryption setup
const algorithm = 'aes-256-gcm';
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Ensure we have a valid 32-byte key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    // Generate a new key if not present or invalid
    ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    console.log('⚠️  Generated new ENCRYPTION_KEY. Add to .env file:');
    console.log(`ENCRYPTION_KEY=${ENCRYPTION_KEY}\n`);
}

function encryptPrivateKey(privateKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// User schema
const userSchema = new mongoose.Schema({
    email: String,
    walletAddress: String,
    encryptedPrivateKey: String,
});
const User = mongoose.model('User', userSchema);

async function setUserPrivateKey() {
    console.log('===========================================');
    console.log('   Set User Private Key');
    console.log('===========================================\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
        console.log('✅ Connected to MongoDB\n');

        const USER_EMAIL = 'test5@gmail.com';
        const TARGET_ADDRESS = '0xc555389e3659831c86065d42d085db54e015b347a25e3f5c69d91a589cee1e3b';

        // Find user
        const user = await User.findOne({ email: USER_EMAIL });
        if (!user) {
            console.error(`❌ User not found: ${USER_EMAIL}`);
            process.exit(1);
        }

        console.log('Found user:');
        console.log('  Email:', user.email);
        console.log('  Wallet Address:', user.walletAddress);
        console.log('  Has private key:', !!user.encryptedPrivateKey);

        console.log('\n🔑 IMPORTANT: You need the private key for address:');
        console.log(`   ${TARGET_ADDRESS}`);
        console.log('\nThis address has 37 MY_COIN (37000000 raw units)\n');

        // ============================================
        // OPTION 1: If you have the Sui private key (bech32 format)
        // ============================================
        // Uncomment and set this if you have it:

        // const suiPrivateKey = 'suiprivkey1...your_key_here...';
        // const keypair = Ed25519Keypair.fromSecretKey(suiPrivateKey);
        // const derivedAddress = keypair.getPublicKey().toSuiAddress();
        // console.log('Private key derives to:', derivedAddress);
        // if (derivedAddress === TARGET_ADDRESS) {
        //     user.encryptedPrivateKey = suiPrivateKey;
        //     await user.save();
        //     console.log('✅ Private key updated successfully!');
        // } else {
        //     console.log('❌ This key derives to wrong address!');
        // }

        // ============================================
        // OPTION 2: Generate a NEW keypair
        // ============================================
        console.log('Generating a NEW keypair...\n');

        const newKeypair = new Ed25519Keypair();
        const newAddress = newKeypair.getPublicKey().toSuiAddress();
        const suiPrivateKey = newKeypair.getSecretKey();
        // Extract private key bytes for base64 encoding
        const privateKeyBytes = newKeypair.keypair.secretKey.slice(0, 32);
        const privateKeyBase64 = Buffer.from(privateKeyBytes).toString('base64');

        console.log('🎉 NEW KEYPAIR GENERATED:');
        console.log('=====================================');
        console.log('New Address:', newAddress);
        console.log('Private Key (Base64):', privateKeyBase64);
        console.log('Private Key (Sui format):', suiPrivateKey);
        console.log('=====================================\n');

        console.log('⚠️  SAVE THIS PRIVATE KEY SECURELY!\n');

        // Update user with new keypair
        console.log('Do you want to use this new keypair? (You will need to transfer MY_COIN to the new address)');
        console.log('Updating user with new keypair...\n');

        // Store encrypted private key
        const encryptedKey = encryptPrivateKey(privateKeyBase64);

        user.walletAddress = newAddress;
        user.encryptedPrivateKey = encryptedKey;
        await user.save();

        console.log('✅ User updated with new keypair!');
        console.log('\n📋 Updated configuration:');
        console.log('  Email:', user.email);
        console.log('  New Wallet Address:', newAddress);
        console.log('  Private key: Encrypted and saved');

        console.log('\n🚨 NEXT STEPS:');
        console.log('=====================================');
        console.log(`1. Transfer MY_COIN from old address: ${TARGET_ADDRESS}`);
        console.log(`   to new address: ${newAddress}`);
        console.log('\n2. Transfer any SUI for gas fees to the new address');
        console.log('\n3. Test the payment with: node quick-test.cmd');

        console.log('\n💡 To transfer MY_COIN, you can:');
        console.log('   - Use Sui Wallet browser extension');
        console.log('   - Use Sui CLI');
        console.log('   - Use another script if you have the old private key');

        // ============================================
        // OPTION 3: Import existing private key
        // ============================================
        console.log('\n=====================================');
        console.log('If you have the private key for the old address, you can:');
        console.log('1. Comment out the "Generate NEW keypair" section above');
        console.log('2. Uncomment OPTION 1 section');
        console.log('3. Set your private key there');
        console.log('4. Run this script again');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run
setUserPrivateKey().catch(console.error);