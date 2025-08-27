import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import logger from '../utils/logger';

let suiClient: SuiClient;
let adminKeypair: Ed25519Keypair;

export async function initSuiClient(): Promise<void> {
  try {
    const network = process.env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' || 'testnet';
    const rpcUrl = process.env.SUI_RPC_URL || getFullnodeUrl(network);
    
    suiClient = new SuiClient({ url: rpcUrl });
    
    // Initialize admin keypair from private key
    if (process.env.SUI_ADMIN_PRIVATE_KEY) {
      // Handle both base64 and bech32 (suiprivkey1...) formats
      const privateKeyString = process.env.SUI_ADMIN_PRIVATE_KEY;
      if (privateKeyString.startsWith('suiprivkey1')) {
        // Bech32 format - use Ed25519Keypair.fromSecretKey with the string directly
        adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyString);
      } else {
        // Base64 format - decode to bytes first
        const privateKeyBytes = Buffer.from(privateKeyString, 'base64');
        adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
      }
    }
    
    // Test connection
    const checkpoint = await suiClient.getLatestCheckpointSequenceNumber();
    logger.info(`Connected to Sui ${network} at checkpoint ${checkpoint}`);
    
  } catch (error) {
    logger.error('Failed to initialize Sui client:', error);
    throw error;
  }
}

export function getSuiClient(): SuiClient {
  if (!suiClient) {
    throw new Error('Sui client not initialized');
  }
  return suiClient;
}

export function getAdminKeypair(): Ed25519Keypair {
  if (!adminKeypair) {
    throw new Error('Admin keypair not initialized');
  }
  return adminKeypair;
}