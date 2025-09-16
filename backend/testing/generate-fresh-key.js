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

async function generateFreshKey() {
    console.log('===========================================');
    console.log('   Generate Fresh Valid Keypair');
    console.log('===========================================\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
        console.log('✅ Connected to MongoDB\n');

        const USER_EMAIL = 'test5@gmail.com';

        // Generate a completely fresh keypair
        console.log('🔑 Generating fresh keypair...');
        const keypair = new Ed25519Keypair();
        const address = keypair.getPublicKey().toSuiAddress();
        const secretKey = keypair.getSecretKey(); // This gives us valid bech32 format

        console.log('\n🎉 FRESH KEYPAIR GENERATED:');
        console.log('=====================================');
        console.log('Address:', address);
        console.log('Private Key:', secretKey);
        console.log('=====================================\n');

        // Verify the keypair works
        console.log('🧪 Verifying keypair...');
        const testKeypair = Ed25519Keypair.fromSecretKey(secretKey);
        const verifyAddress = testKeypair.getPublicKey().toSuiAddress();
        console.log('  Generated address:', address);
        console.log('  Verified address:', verifyAddress);
        console.log('  Match:', address === verifyAddress ? '✅' : '❌');

        if (address === verifyAddress) {
            console.log('\n✅ Keypair verified successfully!\n');

            // Update user
            console.log('Updating user in database...');
            await User.updateOne(
                { email: USER_EMAIL },
                {
                    $set: {
                        walletAddress: address,
                        encryptedPrivateKey: secretKey // Store bech32 format directly
                    }
                }
            );

            console.log('✅ User updated successfully!\n');

            // Final verification
            const updatedUser = await User.findOne({ email: USER_EMAIL });
            console.log('📋 Final configuration:');
            console.log('  Email:', updatedUser.email);
            console.log('  Wallet Address:', updatedUser.walletAddress);
            console.log('  Private Key Format: Sui bech32');

            // Test loading the key
            const finalTest = Ed25519Keypair.fromSecretKey(updatedUser.encryptedPrivateKey);
            const finalAddress = finalTest.getPublicKey().toSuiAddress();
            console.log('  Final test address:', finalAddress);
            console.log('  Address match:', finalAddress === updatedUser.walletAddress ? '✅' : '❌');

            console.log('\n🎉 SUCCESS! User now has a valid keypair.');
            console.log('\n📝 Next steps:');
            console.log('1. This new address needs MY_COIN and SUI for testing');
            console.log('2. You can now test payments without authentication errors');
            console.log('3. Update your recipient address if needed\n');

            console.log('🚀 Try testing now with: quick-test.cmd');

        } else {
            console.log('❌ Keypair verification failed!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

generateFreshKey().catch(console.error);