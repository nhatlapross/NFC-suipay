import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from '@/config/sui';

export interface SwapRequest {
  fromAmount: number;
  fromCurrency: 'USD' | 'VND';
  toCurrency: 'USD' | 'VND';
}

export interface SwapResponse {
  success: boolean;
  transactionDigest?: string;
  error?: string;
}

export interface CoinInfo {
  coinId: string;
  balance: number;
  type: string;
}

export class SuiSwapService {
  private client: SuiClient;
  private packageId: string;
  private poolObjectId: string;
  private oracleObjectId: string;

  constructor() {
    this.client = new SuiClient({ url: SUI_CONFIG.RPC_URL });
    this.packageId = SUI_CONFIG.PACKAGE_ID;
    this.poolObjectId = SUI_CONFIG.POOL_OBJECT_ID;
    this.oracleObjectId = SUI_CONFIG.ORACLE_OBJECT_ID;
  }

  // Get user's coins
  async getUserCoins(walletAddress: string): Promise<{ usd: CoinInfo[], vnd: CoinInfo[] }> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: walletAddress,
        options: {
          showContent: true,
          showType: true,
        },
      });

      const usdCoins: CoinInfo[] = [];
      const vndCoins: CoinInfo[] = [];

      for (const object of objects.data) {
        // Only process actual Coin objects, not TreasuryCap
        if (object.data?.type?.includes('USD::USD') && object.data.type.includes('Coin<')) {
          const content = object.data.content;
          console.log('USD Coin Debug:', {
            objectId: object.data.objectId,
            type: object.data.type,
            packageId: this.packageId,
            includesPackageId: object.data.type.includes(this.packageId),
            content: content
          });
          
          // Try different ways to parse balance
          let balance = 0;
          if (content && 'fields' in content) {
            const fields = (content as any).fields;
            // Try different field names
            balance = parseInt(fields?.value || fields?.balance || fields?.amount || '0');
          }
          
          console.log('USD Balance parsed:', balance);
          
          // Only add coins with correct package ID and positive balance
          if (object.data.type.includes(this.packageId) && balance > 0) {
            usdCoins.push({
              coinId: object.data.objectId,
              balance,
              type: object.data.type
            });
          }
        }
        if (object.data?.type?.includes('VND::VND') && object.data.type.includes('Coin<')) {
          const content = object.data.content;
          console.log('VND Coin Debug:', {
            objectId: object.data.objectId,
            type: object.data.type,
            packageId: this.packageId,
            includesPackageId: object.data.type.includes(this.packageId),
            content: content
          });
          
          // Try different ways to parse balance
          let balance = 0;
          if (content && 'fields' in content) {
            const fields = (content as any).fields;
            // Try different field names
            balance = parseInt(fields?.value || fields?.balance || fields?.amount || '0');
          }
          
          console.log('VND Balance parsed:', balance);
          
          // Only add coins with correct package ID and positive balance
          if (object.data.type.includes(this.packageId) && balance > 0) {
            vndCoins.push({
              coinId: object.data.objectId,
              balance,
              type: object.data.type
            });
          }
        }
      }

      return { usd: usdCoins, vnd: vndCoins };
    } catch (error) {
      console.error('Failed to get user coins:', error);
      throw new Error('Failed to get user coins');
    }
  }

  // Get total balance for a currency
  getTotalBalance(coins: CoinInfo[]): number {
    return coins.reduce((total, coin) => total + coin.balance, 0) / 1000000000;
  }

  // Get current exchange rate from oracle
  async getCurrentRate(): Promise<number> {
    try {
      const oracleObject = await this.client.getObject({
        id: this.oracleObjectId,
        options: { showContent: true }
      });

      const content = oracleObject.data?.content;
      if (content && 'fields' in content) {
        return parseInt((content as any).fields.value);
      }
      throw new Error('Could not fetch exchange rate from oracle');
    } catch (error) {
      console.error('Failed to get current rate:', error);
      throw new Error('Failed to get current exchange rate');
    }
  }

  // Create VND to USD swap transaction
  createVndToUsdTransaction(amount: number, vndCoinId: string): Transaction {
    const tx = new Transaction();
    // Split coin to exact amount
    const [exactVndCoin] = tx.splitCoins(tx.object(vndCoinId), [tx.pure.u64(amount)]);
    tx.moveCall({
      target: `${this.packageId}::swap::swap_VND_to_USD`,
      arguments: [
        tx.object(this.poolObjectId),
        exactVndCoin,
        tx.object(this.oracleObjectId)
      ]
    });
    return tx;
  }

  // Create USD to VND swap transaction
  createUsdToVndTransaction(amount: number, usdCoinId: string): Transaction {
    const tx = new Transaction();
    // Split coin to exact amount
    const [exactUsdCoin] = tx.splitCoins(tx.object(usdCoinId), [tx.pure.u64(amount)]);
    tx.moveCall({
      target: `${this.packageId}::swap::swap_USD_to_VND`,
      arguments: [
        tx.object(this.poolObjectId),
        exactUsdCoin,
        tx.object(this.oracleObjectId)
      ]
    });
    return tx;
  }

  // Create swap transaction based on currency
  createSwapTransaction(request: SwapRequest, coinId: string): Transaction {
    const { fromAmount, fromCurrency, toCurrency } = request;

    if (fromCurrency === 'VND' && toCurrency === 'USD') {
      return this.createVndToUsdTransaction(fromAmount, coinId);
    } else if (fromCurrency === 'USD' && toCurrency === 'VND') {
      return this.createUsdToVndTransaction(fromAmount, coinId);
    } else {
      throw new Error('Invalid currency pair. Only VND↔USD swaps are supported.');
    }
  }

  // Get pool status
  async getPoolStatus(): Promise<{ vndBalance: number; usdBalance: number }> {
    try {
      const poolObject = await this.client.getObject({
        id: this.poolObjectId,
        options: { showContent: true }
      });

      const content = poolObject.data?.content;
      if (content && 'fields' in content) {
        return {
          vndBalance: parseInt((content as any).fields.test_VND),
          usdBalance: parseInt((content as any).fields.test_USD)
        };
      }
      throw new Error('Could not fetch pool status');
    } catch (error) {
      console.error('Failed to get pool status:', error);
      throw new Error('Failed to get pool status');
    }
  }
}

// Export singleton instance
export const suiSwapService = new SuiSwapService();
