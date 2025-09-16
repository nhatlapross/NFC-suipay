const mongoose = require('mongoose');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
require('dotenv').config();

// User schema
const userSchema = new mongoose.Schema({
    email: String,
    walletAddress: String,
    encryptedPrivateKey: String,
});
const User = mongoose.model('User', userSchema);

async function fixEncryptionIssue() {
    console.log('===========================================');
    console.log('   Fix Encryption Key Issue');
    console.log('===========================================\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
        console.log('✅ Connected to MongoDB\n');

        const USER_EMAIL = 'test5@gmail.com';
        const user = await User.findOne({ email: USER_EMAIL });

        if (!user) {
            console.error(`❌ User not found: ${USER_EMAIL}`);
            process.exit(1);
        }

        console.log('Current user:');
        console.log('  Email:', user.email);
        console.log('  Wallet Address:', user.walletAddress);
        console.log('  Has encrypted key:', !!user.encryptedPrivateKey);

        // The private key we generated earlier
        const GENERATED_PRIVATE_KEY = 'suiprivkey1qqtv4cupyky6cwg6r3f82cxkdrfajm9vgftk7laj66kuar6k652tx';
        const NEW_ADDRESS = '0xcbcf181c4dea62c7f87b078560bf1e43a0d2077effcee99c83bcc5573fe1ea90';

        console.log('\n🔧 Fixing by using Sui bech32 format directly...');

        // Verify the keypair works
        const testKeypair = Ed25519Keypair.fromSecretKey(GENERATED_PRIVATE_KEY);
        const derivedAddress = testKeypair.getPublicKey().toSuiAddress();

        console.log('Verification:');
        console.log('  Private key format: Sui bech32');
        console.log('  Derived address:', derivedAddress);
        console.log('  Expected address:', NEW_ADDRESS);
        console.log('  Match:', derivedAddress === NEW_ADDRESS ? '✅' : '❌');

        if (derivedAddress === NEW_ADDRESS) {
            // Store the private key in bech32 format directly (no encryption needed)
            await User.updateOne(
                { email: USER_EMAIL },
                {
                    $set: {
                        encryptedPrivateKey: GENERATED_PRIVATE_KEY,
                        walletAddress: NEW_ADDRESS
                    }
                }
            );

            console.log('\n✅ User updated successfully!');
            console.log('  Private key format: Sui bech32 (unencrypted)');
            console.log('  This format works directly with the Sui SDK');

            // Test the fix
            console.log('\n🧪 Testing the fix...');
            const updatedUser = await User.findOne({ email: USER_EMAIL });

            if (updatedUser.encryptedPrivateKey.startsWith('suiprivkey1')) {
                const testKeypair2 = Ed25519Keypair.fromSecretKey(updatedUser.encryptedPrivateKey);
                const testAddress = testKeypair2.getPublicKey().toSuiAddress();
                console.log('  ✅ Private key can be loaded successfully');
                console.log('  ✅ Address matches:', testAddress === updatedUser.walletAddress);
            }

            console.log('\n🎉 Fix complete! The authentication error should be resolved.');
            console.log('\n📋 Current status:');
            console.log('  - User has working private key');
            console.log('  - New wallet address set');
            console.log('  - No encryption issues');
            console.log('\n⚠️  Note: You still need to transfer funds to the new address');
            console.log(`     New address: ${NEW_ADDRESS}`);

        } else {
            console.log('❌ Address mismatch! Something went wrong.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixEncryptionIssue().catch(console.error);