const { execSync } = require('child_process');
const axios = require('axios');

async function deployOracle() {
  console.log('🚀 Deploying Oracle with Real-time Price\n');
  
  try {
    // 1. Lấy giá thực tế từ CoinGecko
    console.log('1. Fetching real-time price from CoinGecko...');
    const coingeckoResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=vnd');
    const usdToVnd = Math.floor(coingeckoResponse.data.usd.vnd);
    const timestamp = Math.floor(Date.now() / 1000);
    
    console.log(`✅ CoinGecko rate: ${usdToVnd.toLocaleString()} VND/USD`);
    console.log(`✅ Timestamp: ${new Date(timestamp * 1000).toISOString()}`);
    
    // 2. Publish smart contract
    console.log('\n2. Publishing smart contract...');
    const publishOutput = execSync('sui client publish', { 
      cwd: '/Users/huc/Documents/CodewithHUC/swap',
      encoding: 'utf8'
    });
    
    console.log('✅ Smart contract published');
    
    // 3. Extract Package ID từ output
    const packageIdMatch = publishOutput.match(/PackageID: (0x[a-fA-F0-9]+)/);
    if (!packageIdMatch) {
      throw new Error('Could not find Package ID in publish output');
    }
    
    const packageId = packageIdMatch[1];
    console.log(`✅ Package ID: ${packageId}`);
    
    // 4. Gọi create_price function với giá thực tế
    console.log('\n3. Creating Price object with real-time price...');
    const initCommand = `sui client call --package ${packageId} --module custom_oracle --function create_price --args ${usdToVnd} ${timestamp} --gas-budget 10000000`;
    
    console.log(`Running: ${initCommand}`);
    const initOutput = execSync(initCommand, { 
      cwd: '/Users/huc/Documents/CodewithHUC/swap',
      encoding: 'utf8'
    });
    
    console.log('✅ Price object initialized');
    
    // 5. Extract Object ID từ output
    const objectIdMatch = initOutput.match(/ObjectID: (0x[a-fA-F0-9]+)/);
    if (!objectIdMatch) {
      throw new Error('Could not find Object ID in init output');
    }
    
    const objectId = objectIdMatch[1];
    console.log(`✅ Price Object ID: ${objectId}`);
    
    // 6. Tạo file .env cho backend
    console.log('\n4. Creating .env configuration...');
    const envContent = `# Sui Blockchain Configuration
SUI_PACKAGE_ID=${packageId}
SUI_ORACLE_OBJECT_ID=${objectId}
SUI_ADMIN_PRIVATE_KEY=your_admin_private_key
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
`;
    
    console.log('📝 Add this to your backend .env file:');
    console.log(envContent);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Copy the .env configuration above');
    console.log('2. Add it to your backend .env file');
    console.log('3. Restart backend: npm run dev');
    console.log('4. Price updater worker will start automatically');
    console.log('5. Smart contract will be updated every minute');
    
    console.log('\n📊 Summary:');
    console.log(`✅ Package ID: ${packageId}`);
    console.log(`✅ Object ID: ${objectId}`);
    console.log(`✅ Initial Price: ${usdToVnd.toLocaleString()} VND/USD`);
    console.log(`✅ Timestamp: ${new Date(timestamp * 1000).toISOString()}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deployOracle();
