import { Request, Response, NextFunction } from 'express';
import { sponsorService } from '../services/sponsor.service';
import logger from '../utils/logger';
import { ERROR_CODES } from '../config/constants';

export class SponsorController {

    // Get sponsor wallet info
    async getSponsorInfo(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            const info = await sponsorService.getSponsorInfo();

            res.json({
                success: true,
                data: info
            });
        } catch (error) {
            logger.error('Get sponsor info error:', error);
            next(error);
        }
    }

    // Faucet SUI from sponsor wallet (auth required)
    async faucetSui(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            const { address, amount = 0.1 } = req.body;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    error: 'Address is required',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }

            // Validate address format
            if (!address.startsWith('0x') || address.length !== 66) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Sui address format',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            if (typeof amount !== 'number' || amount <= 0 || amount > 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be between 0.01 and 1 SUI',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            const result = await sponsorService.faucetSui(address, amount);

            res.json({
                success: true,
                message: 'SUI faucet completed from sponsor wallet',
                data: result
            });

        } catch (error) {
            logger.error('Faucet SUI error:', error);

            if (error instanceof Error && error.message.includes('Insufficient')) {
                return res.status(400).json({
                    success: false,
                    error: 'Sponsor wallet has insufficient SUI balance',
                    code: ERROR_CODES.INSUFFICIENT_BALANCE
                });
            }

            next(error);
        }
    }

    // Faucet MY_COIN from sponsor wallet (auth required)
    async faucetMyCoin(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            const { address, amount = 100 } = req.body;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    error: 'Address is required',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }

            // Validate address format
            if (!address.startsWith('0x') || address.length !== 66) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Sui address format',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            if (typeof amount !== 'number' || amount <= 0 || amount > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be between 0.01 and 1000 sVND',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            const result = await sponsorService.faucetMyCoin(address, amount);

            res.json({
                success: true,
                message: 'sVND faucet completed from sponsor wallet',
                data: result
            });

        } catch (error) {
            logger.error('Faucet MY_COIN error:', error);

            if (error instanceof Error && error.message.includes('Insufficient')) {
                return res.status(400).json({
                    success: false,
                    error: 'Sponsor wallet has insufficient sVND balance',
                    code: ERROR_CODES.INSUFFICIENT_BALANCE
                });
            }

            next(error);
        }
    }

    // Sponsor SUI from sponsor wallet (auth required)
    async sponsorSui(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            const { address, amount } = req.body;

            // Input validation
            if (!address || !amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Address and amount are required',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }

            if (!address.startsWith('0x') || address.length !== 66) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Sui address format',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            if (typeof amount !== 'number' || amount <= 0 || amount > 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be between 0.01 and 10 SUI',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            const result = await sponsorService.sponsorSui(address, amount);

            res.json({
                success: true,
                message: 'SUI sponsored successfully',
                data: result
            });

        } catch (error) {
            logger.error('Sponsor SUI error:', error);

            if (error instanceof Error && error.message.includes('Insufficient')) {
                return res.status(400).json({
                    success: false,
                    error: 'Sponsor wallet has insufficient SUI balance',
                    code: ERROR_CODES.INSUFFICIENT_BALANCE
                });
            }

            next(error);
        }
    }

    // Sponsor MY_COIN from sponsor wallet (auth required)
    async sponsorMyCoin(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            const { address, amount } = req.body;

            // Input validation
            if (!address || !amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Address and amount are required',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }

            if (!address.startsWith('0x') || address.length !== 66) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Sui address format',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            if (typeof amount !== 'number' || amount <= 0 || amount > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be between 0.01 and 1000 sVND',
                    code: ERROR_CODES.INVALID_INPUT
                });
            }

            const result = await sponsorService.sponsorMyCoin(address, amount);

            res.json({
                success: true,
                message: 'sVND sponsored successfully',
                data: result
            });

        } catch (error) {
            logger.error('Sponsor MY_COIN error:', error);

            if (error instanceof Error && error.message.includes('Insufficient')) {
                return res.status(400).json({
                    success: false,
                    error: 'Sponsor wallet has insufficient sVND balance',
                    code: ERROR_CODES.INSUFFICIENT_BALANCE
                });
            }

            next(error);
        }
    }

    // Sponsor both SUI and MY_COIN to user's current wallet
    async sponsorUser(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            const { suiAmount = 0.1, myCoinAmount = 50 } = req.body;
            const user = (req as any).user;

            if (!user.walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'User has no wallet address',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }

            const results = [];

            // Sponsor SUI if requested
            if (suiAmount > 0) {
                try {
                    const suiResult = await sponsorService.sponsorSui(user.walletAddress, suiAmount);
                    results.push({
                        type: 'SUI',
                        success: true,
                        ...suiResult
                    });
                } catch (error) {
                    results.push({
                        type: 'SUI',
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            // Sponsor MY_COIN if requested
            if (myCoinAmount > 0) {
                try {
                    const coinResult = await sponsorService.sponsorMyCoin(user.walletAddress, myCoinAmount);
                    results.push({
                        type: 'sVND',
                        success: true,
                        ...coinResult
                    });
                } catch (error) {
                    results.push({
                        type: 'sVND',
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            res.json({
                success: successful > 0,
                message: successful > 0 ?
                    `Successfully sponsored ${successful} currencies to your wallet` :
                    'All sponsor attempts failed',
                data: {
                    recipient: user.walletAddress,
                    transactions: results,
                    summary: {
                        successful,
                        failed,
                        total: results.length
                    }
                }
            });

        } catch (error) {
            logger.error('Sponsor user error:', error);
            next(error);
        }
    }

    // Bulk sponsor for multiple addresses (admin only)
    async bulkSponsor(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            const { recipients } = req.body;

            if (!Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Recipients array is required',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }

            if (recipients.length > 50) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 50 recipients per bulk request',
                    code: ERROR_CODES.VALIDATION_ERROR
                });
            }

            // Validate each recipient
            for (const recipient of recipients) {
                if (!recipient.address || (!recipient.suiAmount && !recipient.myCoinAmount)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Each recipient must have address and at least one amount',
                        code: ERROR_CODES.VALIDATION_ERROR
                    });
                }

                if (!recipient.address.startsWith('0x') || recipient.address.length !== 66) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid address format: ${recipient.address}`,
                        code: ERROR_CODES.INVALID_INPUT
                    });
                }
            }

            const result = await sponsorService.bulkSponsor(recipients);

            res.json({
                success: true,
                message: `Bulk sponsor completed. ${result.summary.successful}/${result.summary.total} successful`,
                data: result
            });

        } catch (error) {
            logger.error('Bulk sponsor error:', error);
            next(error);
        }
    }
}

export const sponsorController = new SponsorController();