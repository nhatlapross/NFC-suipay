import cron from 'node-cron';
import { getOracleService } from '../services/oracle.service';
import logger from '../utils/logger';

class PriceUpdaterWorker {
  private oracleService = getOracleService();
  private isRunning = false;

  /**
   * Khởi động worker cập nhật tỉ giá mỗi phút
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Price updater worker is already running');
      return;
    }

    // Cập nhật tỉ giá mỗi phút
    cron.schedule('* * * * *', async () => {
      await this.updatePrice();
    });

    // Cập nhật ngay lập tức khi khởi động
    this.updatePrice();

    this.isRunning = true;
    logger.info('🔄 Price updater worker started - updating every minute');
  }

  /**
   * Dừng worker
   */
  stop(): void {
    this.isRunning = false;
    logger.info('⏹️ Price updater worker stopped');
  }

  /**
   * Cập nhật tỉ giá từ CoinGecko và gửi lên smart contract
   */
  private async updatePrice(): Promise<void> {
    try {
      logger.info('🔄 Starting price update...');
      
      // Lấy tỉ giá từ CoinGecko và các nguồn khác
      const newRate = await this.oracleService.fetchAndUpdateRate();
      
      logger.info(`✅ Price updated successfully: ${newRate.usdToVnd.toFixed(0)} VND/USD`);
      logger.info(`   Source: ${newRate.source}`);
      logger.info(`   Timestamp: ${new Date(newRate.timestamp).toISOString()}`);
      
    } catch (error) {
      logger.error('❌ Failed to update price:', error);
      
      // Thử lấy tỉ giá hiện tại từ smart contract
      try {
        const currentRate = await this.oracleService.getCurrentRate();
        if (currentRate) {
          logger.info(`📊 Current rate from smart contract: ${currentRate.usdToVnd.toFixed(0)} VND/USD`);
        }
      } catch (contractError) {
        logger.error('❌ Failed to get current rate from smart contract:', contractError);
      }
    }
  }

  /**
   * Cập nhật tỉ giá ngay lập tức (manual trigger)
   */
  async updateNow(): Promise<void> {
    logger.info('🔄 Manual price update triggered...');
    await this.updatePrice();
  }

  /**
   * Kiểm tra trạng thái worker
   */
  getStatus(): { isRunning: boolean; lastUpdate?: Date } {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate
    };
  }

  private lastUpdate?: Date;
}

// Singleton instance
let priceUpdaterWorker: PriceUpdaterWorker | null = null;

export function getPriceUpdaterWorker(): PriceUpdaterWorker {
  if (!priceUpdaterWorker) {
    priceUpdaterWorker = new PriceUpdaterWorker();
  }
  return priceUpdaterWorker;
}

export function startPriceUpdaterWorker(): void {
  const worker = getPriceUpdaterWorker();
  worker.start();
}

export function stopPriceUpdaterWorker(): void {
  const worker = getPriceUpdaterWorker();
  worker.stop();
}
