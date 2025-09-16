const mongoose = require('mongoose');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');
require('dotenv').config();

// Encryption functions (same as in your app)
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

// User schema (simplified)
const userSchema = new mongoose.Schema({
    email: String,
    walletAddress: String,
    encryptedPrivateKey: String,
});

const User = mongoose.model('User', userSchema);

async function updateUserPrivateKey() {
    console.log('===========================================');
    console.log('   Update User Private Key Script');
    console.log('===========================================\n');

    // Configuration - UPDATE THESE VALUES
    const CONFIG = {
        userEmail: 'test5@gmail.com',  // Email of user to update

        // Option 1: Provide a new private key that matches the wallet address
        // This should be the private key for address: 0xc555389e3659831c86065d42d085db54e015b347a25e3f5c69d91a589cee1e3b
        newPrivateKey: null, // Set this if you have the correct private key

        // Option 2: Generate a new keypair and update both wallet address and private key
        generateNewKeypair: true,  // Set to true to generate new keypair

        // Option 3: Use existing Sui private key (bech32 format)
        suiPrivateKey: null, // Example: 'suiprivkey1...'
    };

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Find user
        const user = await User.findOne({ email: CONFIG.userEmail });
        if (!user) {
            console.error(`❌ User not found: ${CONFIG.userEmail}`);
            process.exit(1);
        }

        console.log('Found user:');
        console.log('  Email:', user.email);
        console.log('  Current wallet address:', user.walletAddress);

        // Decrypt current private key to check
        if (user.encryptedPrivateKey) {
            try {
                let currentKeypair;
                if (user.encryptedPrivateKey.startsWith('suiprivkey1')) {
                    currentKeypair = Ed25519Keypair.fromSecretKey(user.encryptedPrivateKey);
                } else {
                    const decrypted = decryptPrivateKey(user.encryptedPrivateKey);
                    const keyBuffer = Buffer.from(decrypted, 'base64');
                    const secretKey = keyBuffer.length > 32 ? keyBuffer.subarray(0, 32) : keyBuffer;
                    currentKeypair = Ed25519Keypair.fromSecretKey(secretKey);
                }
                const currentDerivedAddress = currentKeypair.getPublicKey().toSuiAddress();
                console.log('  Current key derives to:', currentDerivedAddress);
                console.log('  Match:', currentDerivedAddress === user.walletAddress ? '✅' : '❌ MISMATCH!');
            } catch (error) {
                console.log('  Could not decrypt current key:', error.message);
            }
        }

        console.log('\n-----------------------------------\n');

        let newKeypair;
        let newAddress;
        let keyToStore;

        if (CONFIG.newPrivateKey) {
            // Option 1: Use provided private key
            console.log('Using provided private key...');

            if (CONFIG.newPrivateKey.startsWith('suiprivkey1')) {
                newKeypair = Ed25519Keypair.fromSecretKey(CONFIG.newPrivateKey);
                keyToStore = CONFIG.newPrivateKey; // Store as-is for bech32
            } else {
                // Assume it's base64 or hex
                const keyBuffer = Buffer.from(CONFIG.newPrivateKey, 'base64');
                const secretKey = keyBuffer.length > 32 ? keyBuffer.subarray(0, 32) : keyBuffer;
                newKeypair = Ed25519Keypair.fromSecretKey(secretKey);
                keyToStore = encryptPrivateKey(CONFIG.newPrivateKey);
            }

            newAddress = newKeypair.getPublicKey().toSuiAddress();

        } else if (CONFIG.suiPrivateKey) {
            // Option 3: Use Sui format private key
            console.log('Using Sui format private key...');
            newKeypair = Ed25519Keypair.fromSecretKey(CONFIG.suiPrivateKey);
            newAddress = newKeypair.getPublicKey().toSuiAddress();
            keyToStore = CONFIG.suiPrivateKey; // Store bech32 format directly

        } else if (CONFIG.generateNewKeypair) {
            // Option 2: Generate new keypair
            console.log('Generating new keypair...');
            newKeypair = new Ed25519Keypair();
            newAddress = newKeypair.getPublicKey().toSuiAddress();

            // Get the private key and encrypt it
            const privateKeyBase64 = Buffer.from(newKeypair.export().privateKey).toString('base64');
            keyToStore = encryptPrivateKey(privateKeyBase64);

            console.log('\n🔑 NEW KEYPAIR GENERATED:');
            console.log('  Public address:', newAddress);
            console.log('  Private key (base64):', privateKeyBase64);
            console.log('  Bech32 format:', newKeypair.getSecretKey());
            console.log('\n⚠️  IMPORTANT: Save this private key securely!');

        } else {
            console.error('❌ No update option selected. Please configure the script.');
            process.exit(1);
        }

        console.log('\nNew configuration:');
        console.log('  New address:', newAddress);
        console.log('  Old address:', user.walletAddress);

        // Ask for confirmation
        console.log('\n⚠️  WARNING: This will update the user\'s wallet configuration!');
        console.log('Make sure you have:');
        console.log('1. Transferred any MY_COIN from old address to new address');
        console.log('2. Backed up the current configuration');

        // Update user
        const updateData = {
            encryptedPrivateKey: keyToStore
        };

        // Only update wallet address if generating new keypair or if it's different
        if (CONFIG.generateNewKeypair || newAddress !== user.walletAddress) {
            updateData.walletAddress = newAddress;
            console.log('\n✅ Will update wallet address to:', newAddress);
        }

        console.log('\nUpdating user in database...');
        await User.updateOne(
            { email: CONFIG.userEmail },
            { $set: updateData }
        );

        console.log('✅ User updated successfully!');

        // Verify the update
        const updatedUser = await User.findOne({ email: CONFIG.userEmail });
        console.log('\nVerification:');
        console.log('  Email:', updatedUser.email);
        console.log('  Wallet address:', updatedUser.walletAddress);

        // Test decryption
        if (!updatedUser.encryptedPrivateKey.startsWith('suiprivkey1')) {
            const testDecrypt = decryptPrivateKey(updatedUser.encryptedPrivateKey);
            console.log('  Private key encrypted: ✅');
        } else {
            console.log('  Private key format: Sui bech32');
        }

        console.log('\n✨ Update complete!');
        console.log('\nNext steps:');
        console.log('1. Transfer MY_COIN to the new address:', newAddress);
        console.log('2. Test the payment with the updated configuration');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Add command to show all users
async function listUsers() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment';
        await mongoose.connect(mongoUri);

        const users = await User.find({}, 'email walletAddress').limit(10);
        console.log('\nUsers in database:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} - ${user.walletAddress}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error listing users:', error);
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'list') {
    listUsers();
} else if (command === 'update') {
    updateUserPrivateKey();
} else {
    console.log('Usage:');
    console.log('  node update-user-key.js list     - List all users');
    console.log('  node update-user-key.js update   - Update user private key');
    console.log('\nBefore running update, edit CONFIG in the script!');
}