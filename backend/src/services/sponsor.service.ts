import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient } from '../config/sui.config';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

export class SponsorService {
    private sponsorKeypair: Ed25519Keypair | null = null;
    private sponsorAddress: string | null = null;

    constructor() {
        this.initializeSponsor();
    }

    private initializeSponsor() {
        try {
            const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;

            if (!sponsorPrivateKey) {
                logger.warn('SPONSOR_PRIVATE_KEY not found in environment variables');
                logger.warn('Sponsor service will use testnet faucet only');
                return;
            }

            // Support both bech32 and base64 formats
            if (sponsorPrivateKey.startsWith('suiprivkey1')) {
                this.sponsorKeypair = Ed25519Keypair.fromSecretKey(sponsorPrivateKey);
            } else {
                // Assume base64 format
                const keyBytes = Buffer.from(sponsorPrivateKey, 'base64');
                this.sponsorKeypair = Ed25519Keypair.fromSecretKey(keyBytes);
            }

            this.sponsorAddress = this.sponsorKeypair.getPublicKey().toSuiAddress();

            logger.info('Sponsor service initialized', {
                sponsorAddress: this.sponsorAddress
            });

            // Log sponsor balances on startup
            this.logSponsorBalances();

        } catch (error) {
            logger.error('Failed to initialize sponsor service:', error);
        }
    }

    private async logSponsorBalances() {
        if (!this.sponsorAddress) return;

        try {
            const suiClient = getSuiClient();

            // Check SUI balance
            const suiBalance = await suiClient.getBalance({
                owner: this.sponsorAddress,
                coinType: '0x2::sui::SUI'
            });

            // Check MY_COIN balance
            const myCoinBalance = await suiClient.getBalance({
                owner: this.sponsorAddress,
                coinType: CONSTANTS.MY_COIN.TYPE
            });

            logger.info('Sponsor wallet balances:', {
                address: this.sponsorAddress,
                suiBalance: (parseInt(suiBalance.totalBalance) / 1_000_000_000).toFixed(4) + ' SUI',
                myCoinBalance: (parseInt(myCoinBalance.totalBalance) / Math.pow(10, CONSTANTS.MY_COIN.DECIMALS)).toFixed(2) + ' sVND'
            });

        } catch (error) {
            logger.error('Failed to check sponsor balances:', error);
        }
    }

    // Faucet SUI from sponsor wallet (same as sponsorSui but renamed for clarity)
    async faucetSui(recipientAddress: string, amount: number = 0.1): Promise<any> {
        if (!this.sponsorKeypair || !this.sponsorAddress) {
            throw new Error('Sponsor wallet not configured. Please set SPONSOR_PRIVATE_KEY in environment');
        }

        try {
            logger.info(`Fauceting ${amount} SUI to ${recipientAddress} from sponsor wallet`);

            // Use the sponsorSui method directly
            return await this.sponsorSui(recipientAddress, amount);
        } catch (error) {
            logger.error('Faucet SUI from sponsor wallet failed:', error);
            throw error;
        }
    }

    // Faucet MY_COIN from sponsor wallet
    async faucetMyCoin(recipientAddress: string, amount: number = 100): Promise<any> {
        if (!this.sponsorKeypair || !this.sponsorAddress) {
            throw new Error('Sponsor wallet not configured. Please set SPONSOR_PRIVATE_KEY in environment');
        }

        try {
            logger.info(`Fauceting ${amount} MY_COIN (sVND) to ${recipientAddress} from sponsor wallet`);

            // Use the sponsorMyCoin method directly
            return await this.sponsorMyCoin(recipientAddress, amount);
        } catch (error) {
            logger.error('Faucet MY_COIN from sponsor wallet failed:', error);
            throw error;
        }
    }

    // Send SUI from sponsor wallet
    async sponsorSui(recipientAddress: string, amount: number): Promise<any> {
        if (!this.sponsorKeypair || !this.sponsorAddress) {
            throw new Error('Sponsor wallet not configured. Please set SPONSOR_PRIVATE_KEY in environment');
        }

        try {
            const suiClient = getSuiClient();
            const amountInMist = amount * 1_000_000_000;

            // Check sponsor SUI balance
            const balance = await suiClient.getBalance({
                owner: this.sponsorAddress,
                coinType: '0x2::sui::SUI'
            });

            const availableBalance = parseInt(balance.totalBalance);
            const requiredAmount = amountInMist + CONSTANTS.DEFAULT_GAS_BUDGET;

            if (availableBalance < requiredAmount) {
                throw new Error(
                    `Insufficient sponsor balance. Required: ${requiredAmount / 1_000_000_000} SUI, ` +
                    `Available: ${availableBalance / 1_000_000_000} SUI`
                );
            }

            // Build transfer transaction
            const tx = new Transaction();
            tx.setSender(this.sponsorAddress);

            const [paymentCoin] = tx.splitCoins(tx.gas, [
                tx.pure.u64(amountInMist)
            ]);

            tx.transferObjects([paymentCoin], tx.pure.address(recipientAddress));
            tx.setGasBudget(CONSTANTS.DEFAULT_GAS_BUDGET);

            // Execute transaction
            const result = await suiClient.signAndExecuteTransaction({
                transaction: tx,
                signer: this.sponsorKeypair,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                }
            });

            // Wait for confirmation
            await suiClient.waitForTransaction({
                digest: result.digest
            });

            logger.info('Sponsor SUI transfer completed:', {
                from: this.sponsorAddress,
                to: recipientAddress,
                amount: amount + ' SUI',
                txHash: result.digest,
                gasUsed: result.effects?.gasUsed
            });

            return {
                success: true,
                txHash: result.digest,
                amount: amount,
                currency: 'SUI',
                from: this.sponsorAddress,
                to: recipientAddress,
                gasUsed: result.effects?.gasUsed,
                explorerUrl: `https://suiscan.xyz/testnet/tx/${result.digest}`
            };

        } catch (error) {
            logger.error('Sponsor SUI transfer failed:', error);
            throw error;
        }
    }

    // Send MY_COIN from sponsor wallet
    async sponsorMyCoin(recipientAddress: string, amount: number): Promise<any> {
        if (!this.sponsorKeypair || !this.sponsorAddress) {
            throw new Error('Sponsor wallet not configured. Please set SPONSOR_PRIVATE_KEY in environment');
        }

        try {
            const suiClient = getSuiClient();
            const rawAmount = amount * Math.pow(10, CONSTANTS.MY_COIN.DECIMALS);

            // Get sponsor's MY_COIN objects
            const coinsResponse = await suiClient.getCoins({
                owner: this.sponsorAddress,
                coinType: CONSTANTS.MY_COIN.TYPE
            });

            if (!coinsResponse.data || coinsResponse.data.length === 0) {
                throw new Error(`Sponsor has no MY_COIN balance at ${this.sponsorAddress}`);
            }

            // Sort coins by balance for optimal selection
            const sortedCoins = coinsResponse.data.sort((a, b) => {
                const balanceA = BigInt(a.balance);
                const balanceB = BigInt(b.balance);
                if (balanceA < balanceB) return -1;
                if (balanceA > balanceB) return 1;
                return 0;
            });

            // Calculate total balance
            const totalBalance = sortedCoins.reduce((sum, coin) =>
                sum + BigInt(coin.balance), BigInt(0)
            );

            if (totalBalance < BigInt(rawAmount)) {
                throw new Error(
                    `Insufficient MY_COIN balance. Required: ${amount} sVND, ` +
                    `Available: ${Number(totalBalance) / Math.pow(10, CONSTANTS.MY_COIN.DECIMALS)} sVND`
                );
            }

            // Build optimized transaction
            const tx = new Transaction();
            tx.setSender(this.sponsorAddress);

            // Strategy: Find exact match or single sufficient coin
            const exactCoin = sortedCoins.find(coin =>
                BigInt(coin.balance) === BigInt(rawAmount)
            );

            if (exactCoin) {
                // Direct transfer without split
                tx.transferObjects(
                    [tx.object(exactCoin.coinObjectId)],
                    tx.pure.address(recipientAddress)
                );
            } else {
                const sufficientCoin = sortedCoins.find(coin =>
                    BigInt(coin.balance) >= BigInt(rawAmount)
                );

                if (sufficientCoin) {
                    // Split from single sufficient coin
                    const [paymentCoin] = tx.splitCoins(
                        tx.object(sufficientCoin.coinObjectId),
                        [tx.pure.u64(rawAmount)]
                    );
                    tx.transferObjects([paymentCoin], tx.pure.address(recipientAddress));
                } else {
                    // Merge multiple coins
                    let accumulatedBalance = BigInt(0);
                    const coinsToUse = [];

                    for (const coin of sortedCoins) {
                        coinsToUse.push(coin);
                        accumulatedBalance += BigInt(coin.balance);
                        if (accumulatedBalance >= BigInt(rawAmount)) break;
                    }

                    const primaryCoin = tx.object(coinsToUse[0].coinObjectId);

                    if (coinsToUse.length > 1) {
                        const coinsToMerge = coinsToUse.slice(1).map(c =>
                            tx.object(c.coinObjectId)
                        );
                        tx.mergeCoins(primaryCoin, coinsToMerge);
                    }

                    const [paymentCoin] = tx.splitCoins(primaryCoin, [
                        tx.pure.u64(rawAmount)
                    ]);
                    tx.transferObjects([paymentCoin], tx.pure.address(recipientAddress));
                }
            }

            tx.setGasBudget(CONSTANTS.DEFAULT_GAS_BUDGET);

            // Execute transaction
            const result = await suiClient.signAndExecuteTransaction({
                transaction: tx,
                signer: this.sponsorKeypair,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                }
            });

            // Wait for confirmation
            await suiClient.waitForTransaction({
                digest: result.digest
            });

            logger.info('Sponsor MY_COIN transfer completed:', {
                from: this.sponsorAddress,
                to: recipientAddress,
                amount: amount + ' sVND',
                txHash: result.digest,
                gasUsed: result.effects?.gasUsed
            });

            return {
                success: true,
                txHash: result.digest,
                amount: amount,
                currency: 'sVND',
                from: this.sponsorAddress,
                to: recipientAddress,
                gasUsed: result.effects?.gasUsed,
                explorerUrl: `https://suiscan.xyz/testnet/tx/${result.digest}`
            };

        } catch (error) {
            logger.error('Sponsor MY_COIN transfer failed:', error);
            throw error;
        }
    }

    // Get sponsor wallet info
    async getSponsorInfo(): Promise<any> {
        if (!this.sponsorAddress) {
            return {
                configured: false,
                message: 'Sponsor wallet not configured'
            };
        }

        try {
            const suiClient = getSuiClient();

            const [suiBalance, myCoinBalance] = await Promise.all([
                suiClient.getBalance({
                    owner: this.sponsorAddress,
                    coinType: '0x2::sui::SUI'
                }),
                suiClient.getBalance({
                    owner: this.sponsorAddress,
                    coinType: CONSTANTS.MY_COIN.TYPE
                })
            ]);

            return {
                configured: true,
                address: this.sponsorAddress,
                balances: {
                    sui: {
                        raw: suiBalance.totalBalance,
                        formatted: (parseInt(suiBalance.totalBalance) / 1_000_000_000).toFixed(4) + ' SUI'
                    },
                    myCoin: {
                        raw: myCoinBalance.totalBalance,
                        formatted: (parseInt(myCoinBalance.totalBalance) / Math.pow(10, CONSTANTS.MY_COIN.DECIMALS)).toFixed(2) + ' sVND'
                    }
                },
                explorerUrl: `https://suiscan.xyz/testnet/account/${this.sponsorAddress}`
            };

        } catch (error) {
            logger.error('Failed to get sponsor info:', error);
            throw error;
        }
    }

    // Bulk sponsor for multiple addresses
    async bulkSponsor(recipients: { address: string, suiAmount?: number, myCoinAmount?: number }[]): Promise<any> {
        const results = [];

        for (const recipient of recipients) {
            const result: any = {
                address: recipient.address,
                transactions: []
            };

            try {
                // Send SUI if requested
                if (recipient.suiAmount && recipient.suiAmount > 0) {
                    const suiResult = await this.sponsorSui(recipient.address, recipient.suiAmount);
                    result.transactions.push({
                        type: 'SUI',
                        ...suiResult
                    });
                }

                // Send MY_COIN if requested
                if (recipient.myCoinAmount && recipient.myCoinAmount > 0) {
                    const coinResult = await this.sponsorMyCoin(recipient.address, recipient.myCoinAmount);
                    result.transactions.push({
                        type: 'sVND',
                        ...coinResult
                    });
                }

                result.success = true;

            } catch (error) {
                result.success = false;
                result.error = error instanceof Error ? error.message : 'Unknown error';
                logger.error(`Bulk sponsor failed for ${recipient.address}:`, error);
            }

            results.push(result);

            // Add small delay between transactions to avoid rate limiting
            if (recipients.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return {
            success: true,
            results,
            summary: {
                total: recipients.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        };
    }
}

// Export singleton instance
export const sponsorService = new SponsorService();