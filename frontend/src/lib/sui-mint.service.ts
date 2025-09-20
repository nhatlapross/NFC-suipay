import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SUI_CONFIG } from '@/config/sui';

export interface MintRequest {
  amount: number;
  currency: 'USD' | 'VND';
  walletAddress: string;
  privateKey: string;
}

export interface MintResponse {
  success: boolean;
  transactionDigest?: string;
  error?: string;
}

export class SuiMintService {
  private client: SuiClient;
  private packageId: string;

  // Treasury Cap IDs (cần được cập nhật với IDs thực tế)
  private usdTreasuryCap = '0x3736073d1271ee3d8730f22613ed8787a5d43ca0d60791f13ca6d40693673e3e';
  private vndTreasuryCap = '0xc8542d8af1f915d92b2379ba031a370a75e2000ef05cbaa9c6d214712a1cea1e';

  constructor() {
    this.client = new SuiClient({ url: SUI_CONFIG.RPC_URL });
    this.packageId = SUI_CONFIG.PACKAGE_ID;
  }

  // Mint USD tokens
  async mintUsd(amount: number, walletAddress: string, privateKey: string): Promise<MintResponse> {
    try {
      const keypair = Ed25519Keypair.fromSecretKey(privateKey);
      
      // Convert amount to smallest unit (6 decimals)
      const amountInSmallestUnit = Math.floor(amount * 1000000);

      // Create transaction
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::USD::mint_and_transfer`,
        arguments: [
          tx.object(this.usdTreasuryCap),
          tx.pure.u64(amountInSmallestUnit),
          tx.pure.address(walletAddress)
        ]
      });

      // Execute transaction
      const result = await this.client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      return {
        success: true,
        transactionDigest: result.digest
      };
    } catch (error: any) {
      console.error('USD mint failed:', error);
      return {
        success: false,
        error: error.message || 'USD mint failed'
      };
    }
  }

  // Mint VND tokens
  async mintVnd(amount: number, walletAddress: string, privateKey: string): Promise<MintResponse> {
    try {
      const keypair = Ed25519Keypair.fromSecretKey(privateKey);
      
      // Convert amount to smallest unit (6 decimals)
      const amountInSmallestUnit = Math.floor(amount * 1000000);

      // Create transaction
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::VND::mint_and_transfer`,
        arguments: [
          tx.object(this.vndTreasuryCap),
          tx.pure.u64(amountInSmallestUnit),
          tx.pure.address(walletAddress)
        ]
      });

      // Execute transaction
      const result = await this.client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      return {
        success: true,
        transactionDigest: result.digest
      };
    } catch (error: any) {
      console.error('VND mint failed:', error);
      return {
        success: false,
        error: error.message || 'VND mint failed'
      };
    }
  }

  // Mint tokens based on currency
  async mintTokens(request: MintRequest): Promise<MintResponse> {
    const { amount, currency, walletAddress, privateKey } = request;

    if (currency === 'USD') {
      return this.mintUsd(amount, walletAddress, privateKey);
    } else if (currency === 'VND') {
      return this.mintVnd(amount, walletAddress, privateKey);
    } else {
      return {
        success: false,
        error: 'Invalid currency. Only USD and VND are supported.'
      };
    }
  }

  // Get Treasury Cap IDs from the network
  async getTreasuryCaps(): Promise<{ usdTreasuryCap: string; vndTreasuryCap: string }> {
    try {
      // This would need to be implemented based on how Treasury Caps are stored
      // For now, return the hardcoded values
      return {
        usdTreasuryCap: this.usdTreasuryCap,
        vndTreasuryCap: this.vndTreasuryCap
      };
    } catch (error) {
      console.error('Failed to get treasury caps:', error);
      throw new Error('Failed to get treasury caps');
    }
  }
}

// Export singleton instance
export const suiMintService = new SuiMintService();
