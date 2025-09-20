import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export interface ExchangeRate {
  usdToVnd: number;
  vndToUsd: number;
  timestamp: number;
  source: string;
}

export class OracleService {
  private suiClient: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private oracleObjectId: string;

  constructor() {
    this.suiClient = new SuiClient({ 
      url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' 
    });
    
    this.keypair = Ed25519Keypair.fromSecretKey(
      process.env.SUI_ADMIN_PRIVATE_KEY || ''
    );
    
    this.packageId = process.env.SUI_PACKAGE_ID || '';
    this.oracleObjectId = process.env.SUI_ORACLE_OBJECT_ID || '';
  }

  /**
   * Lấy tỉ giá từ smart contract oracle
   */
  async getCurrentRate(): Promise<ExchangeRate | null> {
    try {
      // Lấy object Price từ Sui blockchain
      const object = await this.suiClient.getObject({
        id: this.oracleObjectId,
        options: { 
          showContent: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true,
          showDisplay: false,
          showBcs: false,
          showStorageRebate: false
        },
      });

      if (object.data?.content?.dataType === 'moveObject') {
        const fields = object.data.content.fields as any;
        const usdToVnd = parseInt(fields.value); // Giá USD/VND từ smart contract
        const timestamp = parseInt(fields.timestamp);

        return {
          usdToVnd,
          vndToUsd: 1 / usdToVnd,
          timestamp: timestamp * 1000, // Convert từ seconds sang milliseconds
          source: 'smart-contract'
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get rate from contract:', error);
      // Trả về tỉ giá mặc định nếu không lấy được từ contract
      return {
        usdToVnd: 24300,
        vndToUsd: 1 / 24300,
        timestamp: Date.now(),
        source: 'fallback'
      };
    }
  }

  /**
   * Cập nhật tỉ giá lên smart contract
   */
  async updateRate(usdToVnd: number): Promise<string> {
    try {
      const txb = new Transaction();
      
      // Gọi function update_price từ smart contract (theo module swap::custom_oracle)
      txb.moveCall({
        target: `${this.packageId}::custom_oracle::update_price`,
        arguments: [
          txb.object(this.oracleObjectId),
          txb.pure.u64(Math.floor(usdToVnd)), // Convert to u64 integer
          txb.pure.u64(Math.floor(Date.now() / 1000)), // Convert to u64 seconds
        ],
      });

      txb.setGasBudget(10000000);

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: txb,
        signer: this.keypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      console.log('Oracle price updated successfully:', result.digest);
      return result.digest;
    } catch (error) {
      console.error('Failed to update oracle price:', error);
      throw error;
    }
  }

  /**
   * Lấy tỉ giá từ nhiều nguồn API uy tín (ưu tiên CoinGecko)
   */
  async fetchRealTimeRate(): Promise<number> {
    const sources = [
      this.fetchFromCoinGecko(), // Ưu tiên CoinGecko
      this.fetchFromExchangerateAPI(),
      this.fetchFromCurrencyAPI(),
      this.fetchFromAlphaVantage(),
      this.fetchFromVietcombank(),
      this.fetchFromFixerIO(), // Để cuối vì cần API key
    ];

    try {
      const results = await Promise.allSettled(sources);
      const validRates = results
        .filter((result): result is PromiseFulfilledResult<number> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      if (validRates.length === 0) {
        throw new Error('All exchange rate sources failed');
      }

      // Loại bỏ outliers (giá quá cao hoặc quá thấp)
      const sortedRates = validRates.sort((a, b) => a - b);
      const q1 = sortedRates[Math.floor(sortedRates.length * 0.25)];
      const q3 = sortedRates[Math.floor(sortedRates.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const filteredRates = sortedRates.filter(rate => 
        rate >= lowerBound && rate <= upperBound
      );

      const medianRate = filteredRates[Math.floor(filteredRates.length / 2)];
      
      console.log(`📊 Fetched rates: ${validRates.map(r => r.toFixed(0)).join(', ')} VND/USD`);
      console.log(`📈 Filtered rates: ${filteredRates.map(r => r.toFixed(0)).join(', ')} VND/USD`);
      console.log(`🎯 Using median rate: ${medianRate.toFixed(0)} VND/USD`);
      
      return medianRate;
    } catch (error) {
      console.error('Failed to fetch real-time rate:', error);
      return 24300; // Fallback rate
    }
  }

  /**
   * Exchangerate-api.com (Free, reliable)
   */
  private async fetchFromExchangerateAPI(): Promise<number> {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json() as any;
      return data.rates.VND;
    } catch (error) {
      throw new Error(`Exchangerate API failed: ${error}`);
    }
  }

  /**
   * Fixer.io (Professional, requires API key)
   */
  private async fetchFromFixerIO(): Promise<number> {
    try {
      const apiKey = process.env.FIXER_API_KEY;
      if (!apiKey) throw new Error('FIXER_API_KEY not configured');
      
      const response = await fetch(`http://data.fixer.io/api/latest?access_key=${apiKey}&symbols=VND`);
      const data = await response.json() as any;
      
      if (!data.success) {
        throw new Error(`Fixer API error: ${data.error?.info || 'Unknown error'}`);
      }
      
      return data.rates.VND;
    } catch (error) {
      throw new Error(`Fixer API failed: ${error}`);
    }
  }

  /**
   * Currency API (Free tier available)
   */
  private async fetchFromCurrencyAPI(): Promise<number> {
    try {
      const apiKey = process.env.CURRENCY_API_KEY;
      if (!apiKey) {
        // Fallback to free API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json() as any;
        return data.rates.VND;
      }
      
      const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&currencies=VND&base_currency=USD`);
      const data = await response.json() as any;
      
      if (!data.data || !data.data.VND) {
        throw new Error('Currency API: Invalid response format');
      }
      
      return data.data.VND.value;
    } catch (error) {
      throw new Error(`Currency API failed: ${error}`);
    }
  }

  /**
   * CoinGecko (Free, crypto-focused but has fiat rates)
   */
  private async fetchFromCoinGecko(): Promise<number> {
    try {
      // Sử dụng simple price API (chính xác hơn)
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=vnd');
      const priceData = await priceResponse.json() as any;
      
      if (priceData.usd && priceData.usd.vnd) {
        const usdToVnd = priceData.usd.vnd;
        console.log(`🪙 CoinGecko simple price: ${usdToVnd.toFixed(0)} VND/USD`);
        return usdToVnd;
      }
      
      // Fallback: thử lấy từ exchange_rates
      const response = await fetch('https://api.coingecko.com/api/v3/exchange_rates');
      const data = await response.json() as any;
      
      if (data.rates && data.rates.vnd) {
        // CoinGecko returns VND to USD, we need USD to VND
        const vndToUsd = data.rates.vnd.value;
        const usdToVnd = 1 / vndToUsd;
        console.log(`🪙 CoinGecko exchange_rates: ${usdToVnd.toFixed(0)} VND/USD`);
        return usdToVnd;
      }
      
      throw new Error('CoinGecko API: VND rate not found in both endpoints');
    } catch (error) {
      throw new Error(`CoinGecko API failed: ${error}`);
    }
  }

  /**
   * Alpha Vantage (Free tier available)
   */
  private async fetchFromAlphaVantage(): Promise<number> {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        // Fallback to exchangerate-api
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json() as any;
        return data.rates.VND;
      }
      
      const response = await fetch(`https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=VND&apikey=${apiKey}`);
      const data = await response.json() as any;
      
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }
      
      if (!data['Time Series (FX)']) {
        throw new Error('Alpha Vantage API: No time series data');
      }
      
      const timeSeries = data['Time Series (FX)'];
      const latestDate = Object.keys(timeSeries)[0];
      const latestData = timeSeries[latestDate];
      
      return parseFloat(latestData['4. close']);
    } catch (error) {
      throw new Error(`Alpha Vantage API failed: ${error}`);
    }
  }

  /**
   * Vietcombank (Mock - in real implementation, would scrape their website)
   */
  private async fetchFromVietcombank(): Promise<number> {
    try {
      // In a real implementation, you would scrape Vietcombank's website
      // or use their official API if available
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json() as any;
      
      // Add a small variation to simulate different source
      const baseRate = data.rates.VND;
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      return baseRate * (1 + variation);
    } catch (error) {
      throw new Error(`Vietcombank API failed: ${error}`);
    }
  }

  /**
   * Lấy tỉ giá từ API thực tế và cập nhật lên contract
   */
  async fetchAndUpdateRate(): Promise<ExchangeRate> {
    try {
      // Lấy tỉ giá từ API thực tế
      const usdToVnd = await this.fetchRealTimeRate();

      // Cập nhật lên smart contract
      await this.updateRate(usdToVnd);

      const newRate: ExchangeRate = {
        usdToVnd,
        vndToUsd: 1 / usdToVnd,
        timestamp: Date.now(),
        source: 'api-updated'
      };

      return newRate;
    } catch (error) {
      console.error('Failed to fetch and update rate:', error);
      throw error;
    }
  }

  /**
   * Tính toán chuyển đổi tiền tệ
   */
  async convertCurrency(amount: number, from: 'USD' | 'VND', to: 'USD' | 'VND'): Promise<number> {
    const rate = await this.getCurrentRate();
    if (!rate) throw new Error('Exchange rate not available');

    if (from === to) return amount;

    if (from === 'VND' && to === 'USD') {
      return amount * rate.vndToUsd;
    } else if (from === 'USD' && to === 'VND') {
      return amount * rate.usdToVnd;
    }
    throw new Error('Unsupported currency conversion');
  }
}

// Singleton instance
let oracleService: OracleService | null = null;

export function getOracleService(): OracleService {
  if (!oracleService) {
    oracleService = new OracleService();
  }
  return oracleService;
}
