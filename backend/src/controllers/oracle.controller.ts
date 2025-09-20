import { Request, Response } from 'express';
import { getOracleService } from '../services/oracle.service';

export class OracleController {
  /**
   * Lấy tỉ giá hiện tại từ smart contract
   */
  async getCurrentRate(_req: Request, res: Response): Promise<void> {
    try {
      const oracleService = getOracleService();
      const rate = await oracleService.getCurrentRate();
      
      if (!rate) {
        res.status(404).json({
          success: false,
          error: 'Exchange rate not available from smart contract'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          usdToVnd: rate.usdToVnd,
          vndToUsd: rate.vndToUsd,
          timestamp: rate.timestamp,
          source: rate.source,
          formatted: {
            usdToVnd: rate.usdToVnd.toLocaleString(),
            vndToUsd: rate.vndToUsd.toFixed(6)
          }
        }
      });
    } catch (error: any) {
      console.error('Get current rate error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get exchange rate'
      });
    }
  }

  /**
   * Cập nhật tỉ giá từ API thực tế lên smart contract
   */
  async updateRate(_req: Request, res: Response): Promise<void> {
    try {
      const oracleService = getOracleService();
      const newRate = await oracleService.fetchAndUpdateRate();
      
      res.json({
        success: true,
        data: {
          usdToVnd: newRate.usdToVnd,
          vndToUsd: newRate.vndToUsd,
          timestamp: newRate.timestamp,
          source: newRate.source,
          message: 'Rate updated successfully on smart contract'
        }
      });
    } catch (error: any) {
      console.error('Update rate error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update exchange rate'
      });
    }
  }

  /**
   * Truyền tỉ giá VND/USD vào smart contract (custom oracle)
   */
  async setExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const { usdToVnd } = req.body;
      
      if (!usdToVnd || usdToVnd <= 0) {
        res.status(400).json({
          success: false,
          error: 'Missing or invalid usdToVnd rate'
        });
        return;
      }

      const oracleService = getOracleService();
      const txDigest = await oracleService.updateRate(usdToVnd);
      
      res.json({
        success: true,
        data: {
          usdToVnd,
          vndToUsd: 1 / usdToVnd,
          timestamp: Date.now(),
          transactionDigest: txDigest,
          message: 'Exchange rate sent to smart contract successfully'
        }
      });
    } catch (error: any) {
      console.error('Set exchange rate error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to set exchange rate on smart contract'
      });
    }
  }

  /**
   * Tính toán chuyển đổi tiền tệ
   */
  async convertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { amount, from, to } = req.body;
      
      if (!amount || !from || !to) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: amount, from, to'
        });
        return;
      }

      const oracleService = getOracleService();
      const convertedAmount = await oracleService.convertCurrency(amount, from, to);

      res.json({
        success: true,
        data: {
          originalAmount: amount,
          fromCurrency: from,
          toCurrency: to,
          convertedAmount: convertedAmount
        }
      });
    } catch (error: any) {
      console.error('Convert currency error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to convert currency'
      });
    }
  }

  /**
   * Lấy danh sách currencies được hỗ trợ
   */
  async getSupportedCurrencies(_req: Request, res: Response): Promise<void> {
    try {
      const currencies = [
        {
          code: 'USD',
          name: 'US Dollar',
        },
        {
          code: 'VND',
          name: 'Vietnamese Dong',
        },
      ];
      
      res.json({
        success: true,
        data: currencies
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get supported currencies'
      });
    }
  }
}

export const oracleController = new OracleController();
