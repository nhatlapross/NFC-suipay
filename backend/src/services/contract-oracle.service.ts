import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export interface ExchangeRate {
  usdToVnd: number;
  vndToUsd: number;
  timestamp: number;
  source: string;
}

export class ContractOracleService {
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
      return null;
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
   * Lấy tỉ giá từ nhiều nguồn API thực tế
   */
  async fetchRealTimeRate(): Promise<number> {
    const sources = [
      this.fetchFromExchangerateAPI(),
      this.fetchFromFixerIO(),
      this.fetchFromCurrencyAPI(),
      this.fetchFromVietcombank(),
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

      // Lấy median rate để tránh outlier
      const sortedRates = validRates.sort((a, b) => a - b);
      const medianRate = sortedRates[Math.floor(sortedRates.length / 2)];
      
      console.log(`📊 Fetched rates: ${validRates.map(r => r.toFixed(0)).join(', ')} VND/USD`);
      console.log(`📈 Using median rate: ${medianRate.toFixed(0)} VND/USD`);
      
      return medianRate;
    } catch (error) {
      console.error('Failed to fetch real-time rate:', error);
      // Fallback rate
      return 24300;
    }
  }

  private async fetchFromExchangerateAPI(): Promise<number> {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json() as any;
    return data.rates.VND;
  }

  private async fetchFromFixerIO(): Promise<number> {
    const apiKey = process.env.FIXER_API_KEY;
    if (!apiKey) throw new Error('FIXER_API_KEY not configured');
    
    const response = await fetch(`http://data.fixer.io/api/latest?access_key=${apiKey}&symbols=VND`);
    const data = await response.json() as any;
    return data.rates.VND;
  }

  private async fetchFromCurrencyAPI(): Promise<number> {
    const _response = await fetch('https://api.currencyapi.com/v3/latest?apikey=YOUR_API_KEY&currencies=VND');
    // Mock data vì chưa có API key
    return 24300;
  }

  private async fetchFromVietcombank(): Promise<number> {
    // Mock Vietcombank rate (trong thực tế cần parse HTML hoặc API)
    const _response = await fetch('https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx');
    // Parse XML response để lấy tỉ giá USD/VND
    // Tạm thời return giá mặc định
    return 24300;
  }

  /**
   * Lấy tỉ giá từ API thực tế và cập nhật lên contract
   */
  async fetchAndUpdateRate(): Promise<ExchangeRate> {
    try {
      // Lấy tỉ giá từ nhiều nguồn
      const usdToVnd = await this.fetchRealTimeRate();

      // Cập nhật lên smart contract
      await this.updateRate(usdToVnd);

      const newRate: ExchangeRate = {
        usdToVnd,
        vndToUsd: 1 / usdToVnd,
        timestamp: Date.now(),
        source: 'multi-source-updated'
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
  convertCurrency(amount: number, from: 'USD' | 'VND', to: 'USD' | 'VND'): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const rate = await this.getCurrentRate();
        if (!rate) {
          reject(new Error('Exchange rate not available'));
          return;
        }

        if (from === to) {
          resolve(amount);
          return;
        }

        if (from === 'VND' && to === 'USD') {
          resolve(amount / rate.usdToVnd);
        } else if (from === 'USD' && to === 'VND') {
          resolve(amount * rate.usdToVnd);
        } else {
          reject(new Error('Unsupported currency conversion'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Singleton instance
let contractOracleService: ContractOracleService | null = null;

export function getContractOracleService(): ContractOracleService {
  if (!contractOracleService) {
    contractOracleService = new ContractOracleService();
  }
  return contractOracleService;
}
