const { execSync } = require('child_process');

async function runSwapFlow() {
  console.log('🚀 Running Complete Swap Flow\n');
  
  try {
    // 1. Mint tokens
    console.log('1. Minting tokens...');
    execSync('node mint-tokens.js', { stdio: 'inherit' });
    
    // 2. Add liquidity
    console.log('\n2. Adding liquidity...');
    execSync('node add-liquidity.js', { stdio: 'inherit' });
    
    // 3. Test swap
    console.log('\n3. Testing swap...');
    execSync('node swap-tokens.js', { stdio: 'inherit' });
    
    console.log('\n🎉 Complete swap flow finished successfully!');
    
  } catch (error) {
    console.error('❌ Swap flow failed:', error.message);
  }
}

runSwapFlow();
