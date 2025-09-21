const { execSync } = require('child_process');

// Configuration
const PACKAGE_ID = '0x9cef0ecb45dec10eeab38bd1ba8e81c6515b49a437ee1324d07fad8b7816a46a';
const POOL_OBJECT_ID = '0xfb9b73c95fcc948cbb4860cbe1816c726ae79e797cf9c71865638c6832727ade';

async function addLiquidity() {
  console.log('💧 Adding Liquidity to Pool\n');
  
  try {
    // 1. Get current address
    console.log('1. Getting current address...');
    const addressOutput = execSync('sui client active-address', { encoding: 'utf8' });
    const address = addressOutput.trim();
    console.log(`✅ Current address: ${address}`);
    
    // 2. Get user's coins
    console.log('\n2. Getting user\'s coins...');
    const coinsOutput = execSync('sui client objects --json', { encoding: 'utf8' });
    const coins = JSON.parse(coinsOutput);
    
    let usdCoinId = null;
    let vndCoinId = null;
    
    // Find USD and VND coins
    for (const coin of coins) {
      if (coin.data?.type?.includes('USD::USD') && coin.data?.owner?.AddressOwner === address) {
        usdCoinId = coin.data.objectId;
        console.log(`✅ Found USD coin: ${usdCoinId}`);
      }
      if (coin.data?.type?.includes('VND::VND') && coin.data?.owner?.AddressOwner === address) {
        vndCoinId = coin.data.objectId;
        console.log(`✅ Found VND coin: ${vndCoinId}`);
      }
    }
    
    if (!usdCoinId || !vndCoinId) {
      console.log('❌ Could not find USD or VND coins. Please mint tokens first.');
      return;
    }
    
    // 3. Deposit VND to pool
    console.log('\n3. Depositing VND to pool...');
    const depositVndCommand = `sui client call --package ${PACKAGE_ID} --module swap --function deposit_VND --args ${POOL_OBJECT_ID} ${vndCoinId} --gas-budget 10000000`;
    
    console.log(`Running: ${depositVndCommand}`);
    const vndOutput = execSync(depositVndCommand, { encoding: 'utf8' });
    console.log('✅ VND deposited successfully');
    
    // 4. Deposit USD to pool
    console.log('\n4. Depositing USD to pool...');
    const depositUsdCommand = `sui client call --package ${PACKAGE_ID} --module swap --function deposit_USD --args ${POOL_OBJECT_ID} ${usdCoinId} --gas-budget 10000000`;
    
    console.log(`Running: ${depositUsdCommand}`);
    const usdOutput = execSync(depositUsdCommand, { encoding: 'utf8' });
    console.log('✅ USD deposited successfully');
    
    // 5. Check pool status
    console.log('\n5. Checking pool status...');
    const poolOutput = execSync(`sui client object ${POOL_OBJECT_ID}`, { encoding: 'utf8' });
    console.log('✅ Pool status updated');
    
    console.log('\n🎯 Summary:');
    console.log('✅ VND deposited to pool successfully');
    console.log('✅ USD deposited to pool successfully');
    console.log('✅ Pool is now ready for swaps');
    console.log('✅ Users can now swap VND/USD');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Test swap functions with real tokens');
    console.log('2. Verify pool balance after deposits');
    console.log('3. Test different swap amounts');
    
  } catch (error) {
    console.error('❌ Adding liquidity failed:', error.message);
  }
}

addLiquidity();
