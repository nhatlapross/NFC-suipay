const { execSync } = require('child_process');

// Configuration
const PACKAGE_ID = '0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a';
const USD_TREASURY_CAP = '0x3736073d1271ee3d8730f22613ed8787a5d43ca0d60791f13ca6d40693673e3e';
const VND_TREASURY_CAP = '0xc8542d8af1f915d92b2379ba031a370a75e2000ef05cbaa9c6d214712a1cea1e';

async function mintTokens() {
  console.log('🪙 Minting USD and VND Tokens\n');
  
  try {
    // 1. Get current address
    console.log('1. Getting current address...');
    const addressOutput = execSync('sui client active-address', { encoding: 'utf8' });
    const address = addressOutput.trim();
    console.log(`✅ Current address: ${address}`);
    
    // 2. Mint USD tokens
    console.log('\n2. Minting USD tokens...');
    const mintUsdCommand = `sui client call --package ${PACKAGE_ID} --module USD --function mint_token --args ${USD_TREASURY_CAP} --gas-budget 10000000`;
    
    console.log(`Running: ${mintUsdCommand}`);
    const usdOutput = execSync(mintUsdCommand, { encoding: 'utf8' });
    console.log('✅ USD tokens minted successfully');
    
    // Extract USD coin ID from output
    const usdCoinIdMatch = usdOutput.match(/ObjectID: (0x[a-fA-F0-9]+)/);
    if (usdCoinIdMatch) {
      const usdCoinId = usdCoinIdMatch[1];
      console.log(`✅ USD Coin ID: ${usdCoinId}`);
    }
    
    // 3. Mint VND tokens
    console.log('\n3. Minting VND tokens...');
    const mintVndCommand = `sui client call --package ${PACKAGE_ID} --module VND --function mint_token --args ${VND_TREASURY_CAP} --gas-budget 10000000`;
    
    console.log(`Running: ${mintVndCommand}`);
    const vndOutput = execSync(mintVndCommand, { encoding: 'utf8' });
    console.log('✅ VND tokens minted successfully');
    
    // Extract VND coin ID from output
    const vndCoinIdMatch = vndOutput.match(/ObjectID: (0x[a-fA-F0-9]+)/);
    if (vndCoinIdMatch) {
      const vndCoinId = vndCoinIdMatch[1];
      console.log(`✅ VND Coin ID: ${vndCoinId}`);
    }
    
    console.log('\n🎯 Summary:');
    console.log('✅ USD tokens minted successfully');
    console.log('✅ VND tokens minted successfully');
    console.log('✅ Ready for adding liquidity to pool');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Add liquidity to pool using the minted tokens');
    console.log('2. Test swap functions with real tokens');
    console.log('3. Verify pool balance after adding liquidity');
    
  } catch (error) {
    console.error('❌ Minting failed:', error.message);
  }
}

mintTokens();
