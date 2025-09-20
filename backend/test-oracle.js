const { getContractOracleService } = require('./dist/services/contract-oracle.service');

async function testOracle() {
  try {
    console.log('Testing Oracle Service...');
    
    const oracleService = getContractOracleService();
    
    // Test get current rate
    console.log('Getting current rate...');
    const rate = await oracleService.getCurrentRate();
    console.log('Current rate:', rate);
    
    // Test fetch real time rate
    console.log('Fetching real time rate...');
    const realTimeRate = await oracleService.fetchRealTimeRate();
    console.log('Real time rate:', realTimeRate);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOracle();
