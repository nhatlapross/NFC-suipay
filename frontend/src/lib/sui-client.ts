import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import { bcs } from '@mysten/sui/bcs';
import { verifyTransactionSignature } from '@mysten/sui/verify';

// Initialize Sui Client with latest SDK
const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
export const suiClient = new SuiClient({
  url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(network as 'testnet' | 'mainnet' | 'devnet'),
});

// Get wallet balance with new API
export async function getWalletBalance(address: string) {
  try {
    const balance = await suiClient.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI',
    });
    
    return {
      balance: parseFloat(balance.totalBalance) / 1_000_000_000,
      coinType: balance.coinType,
      coinObjectCount: balance.coinObjectCount,
      lockedBalance: balance.lockedBalance ? parseFloat(balance.lockedBalance.toString()) / 1_000_000_000 : 0,
    };
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

// Build payment transaction with new Transaction API
export async function buildPaymentTransaction(
  senderAddress: string,
  recipientAddress: string,
  amount: number,
  merchantId?: string
) {
  const tx = new Transaction();
  
  // Set sender
  tx.setSender(senderAddress);
  
  // Split coins for payment
  const [paymentCoin] = tx.splitCoins(tx.gas, [
    tx.pure.u64(amount * 1_000_000_000) // Convert SUI to MIST
  ]);
  
  // Transfer to recipient
  tx.transferObjects([paymentCoin], tx.pure.address(recipientAddress));
  
  // Optional: Add metadata for merchant
  if (merchantId) {
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::payment_system::record_payment`,
      arguments: [
        tx.pure.string(merchantId),
        tx.pure.u64(amount * 1_000_000_000),
        tx.pure.u64(Date.now()),
      ],
    });
  }
  
  // Set gas budget
  tx.setGasBudget(10_000_000); // 0.01 SUI
  
  return tx;
}

// Execute transaction with new API
export async function executeTransaction(
  transaction: Transaction,
  keypair: Ed25519Keypair
) {
  try {
    const result = await suiClient.signAndExecuteTransaction({
      transaction,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });
    
    // Wait for transaction to be indexed
    await suiClient.waitForTransaction({
      digest: result.digest,
    });
    
    return result;
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  }
}

// Build NFC payment transaction for smart contract
export async function buildNFCPaymentTransaction(
  cardUuid: string,
  amount: number,
  merchantAddress: string,
  walletAddress: string
) {
  const tx = new Transaction();
  
  tx.setSender(walletAddress);
  
  // Call smart contract function
  tx.moveCall({
    target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::payment_system::process_payment`,
    arguments: [
      tx.pure.string(cardUuid), // Card UUID
      tx.pure.u64(amount * 1_000_000_000), // Amount in MIST
      tx.pure.address(merchantAddress), // Merchant address
      tx.pure.string(new Date().toISOString()), // Timestamp
    ],
  });
  
  tx.setGasBudget(20_000_000); // 0.02 SUI for complex transaction
  
  return tx;
}

// Get transaction details
export async function getTransactionDetails(digest: string) {
  try {
    const txDetails = await suiClient.getTransactionBlock({
      digest,
      options: {
        showInput: true,
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
        showEvents: true,
      },
    });
    
    return txDetails;
  } catch (error) {
    console.error('Error getting transaction details:', error);
    throw error;
  }
}

// Get owned objects with pagination
export async function getOwnedObjects(address: string, cursor?: string) {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      cursor,
      limit: 50,
      options: {
        showType: true,
        showContent: true,
        showDisplay: true,
        showOwner: true,
        showPreviousTransaction: true,
      },
    });
    
    return objects;
  } catch (error) {
    console.error('Error getting owned objects:', error);
    throw error;
  }
}

// Get coins with filtering
export async function getCoins(
  address: string,
  coinType: string = '0x2::sui::SUI',
  cursor?: string
) {
  try {
    const coins = await suiClient.getCoins({
      owner: address,
      coinType,
      cursor,
      limit: 100,
    });
    
    return coins;
  } catch (error) {
    console.error('Error getting coins:', error);
    throw error;
  }
}

// Request SUI from faucet (testnet/devnet only)
export async function requestFromFaucet(address: string) {
  if (network === 'mainnet') {
    throw new Error('Faucet is not available on mainnet');
  }
  
  try {
    const result = await requestSuiFromFaucetV2({
      host: getFaucetHost(network as 'testnet' | 'devnet'),
      recipient: address,
    });
    
    return result;
  } catch (error) {
    console.error('Error requesting from faucet:', error);
    throw error;
  }
}

// Subscribe to events
export async function subscribeToEvents(filter: any, callback: (event: any) => void) {
  try {
    const unsubscribe = await suiClient.subscribeEvent({
      filter,
      onMessage: callback,
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to events:', error);
    throw error;
  }
}

// Dry run transaction before execution
export async function dryRunTransaction(
  transaction: Transaction,
  senderAddress: string
) {
  try {
    const result = await suiClient.dryRunTransactionBlock({
      transactionBlock: await transaction.build({ client: suiClient }),
    });
    
    return result;
  } catch (error) {
    console.error('Error in dry run:', error);
    throw error;
  }
}

// Multi-get objects
export async function getMultipleObjects(objectIds: string[]) {
  try {
    const objects = await suiClient.multiGetObjects({
      ids: objectIds,
      options: {
        showType: true,
        showContent: true,
        showOwner: true,
        showPreviousTransaction: true,
      },
    });
    
    return objects;
  } catch (error) {
    console.error('Error getting multiple objects:', error);
    throw error;
  }
}

// Get latest checkpoint
export async function getLatestCheckpoint() {
  try {
    const checkpoint = await suiClient.getLatestCheckpointSequenceNumber();
    return checkpoint;
  } catch (error) {
    console.error('Error getting latest checkpoint:', error);
    throw error;
  }
}

// Verify transaction signature
export async function verifyTxSignature(
  transactionBytes: Uint8Array,
  signature: string | Uint8Array
) {
  try {
    const isValid = await verifyTransactionSignature(
      transactionBytes,
      typeof signature === 'string' ? signature : Buffer.from(signature).toString('base64')
    );
    
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Helper: Format amount to SUI
export function formatSUI(amount: string | number): number {
  return typeof amount === 'string' 
    ? parseFloat(amount) / 1_000_000_000 
    : amount / 1_000_000_000;
}

// Helper: Convert SUI to MIST
export function suiToMist(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000_000));
}

// Helper: Parse Move call arguments
export function parseMoveCallArgs(args: any[]): any[] {
  const tx = new Transaction();
  
  return args.map((arg) => {
    if (typeof arg === 'string' && arg.startsWith('0x')) {
      return tx.pure.address(arg);
    } else if (typeof arg === 'number') {
      return tx.pure.u64(arg);
    } else if (typeof arg === 'string') {
      return tx.pure.string(arg);
    } else if (typeof arg === 'boolean') {
      return tx.pure.bool(arg);
    } else if (Array.isArray(arg)) {
      return tx.pure.vector('u8', arg);
    }
    return arg;
  });
}