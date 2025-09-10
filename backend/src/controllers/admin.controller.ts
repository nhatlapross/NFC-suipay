import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

export class AdminController {
  async createAdmin(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getAllAdmins(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getAdminById(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateAdmin(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async deleteAdmin(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateAdminStatus(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }


  async getSystemStats(_req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const healthMetrics = await adminService.getSystemHealthMetrics();
      
      return res.json({
        success: true,
        data: healthMetrics
      });
    } catch (error) {
      logger.error('Error getting system stats:', error);
      next(error);
    }
  }

  async getSystemHealth(_req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const healthMetrics = await adminService.getSystemHealthMetrics();
      
      // Determine overall system health
      const successRate = healthMetrics.transactionMetrics[0]?.successful / 
                         (healthMetrics.transactionMetrics[0]?.total || 1) * 100;
      
      const systemHealth = {
        status: successRate >= 95 ? 'healthy' : successRate >= 85 ? 'warning' : 'critical',
        successRate: Math.round(successRate * 100) / 100,
        ...healthMetrics
      };

      return res.json({
        success: true,
        data: systemHealth
      });
    } catch (error) {
      logger.error('Error getting system health:', error);
      next(error);
    }
  }

  async getSystemSettings(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateSystemSettings(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getAuditLogs(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getAllAnnouncements(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async createAnnouncement(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateAnnouncement(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async deleteAnnouncement(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async exportData(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async importData(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async backupDatabase(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async restoreDatabase(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  // === PAYMENT MONITORING DASHBOARD ===
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      logger.info('Admin accessing payment dashboard', { adminId: req.user?._id });
      
      const dashboardData = await adminService.getPaymentDashboard();
      
      return res.json({
        success: true,
        data: {
          ...dashboardData,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Error getting admin dashboard:', error);
      next(error);
    }
  }

  async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getUsers(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getUser(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateUserStatus(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateUserLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async deleteUser(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  // === MERCHANT PAYMENT MONITORING ===
  async getMerchants(_req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const merchantHealth = await adminService.getMerchantPaymentHealth();
      
      return res.json({
        success: true,
        data: {
          merchants: merchantHealth,
          summary: {
            total: merchantHealth.length,
            healthy: merchantHealth.filter(m => m.isHealthy).length,
            unhealthy: merchantHealth.filter(m => !m.isHealthy).length
          }
        }
      });
    } catch (error) {
      logger.error('Error getting merchants:', error);
      next(error);
    }
  }

  async getMerchant(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { merchantId } = req.params;
      const merchantHealth = await adminService.getMerchantPaymentHealth(merchantId);
      
      if (merchantHealth.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found or no transaction data'
        });
      }

      return res.json({
        success: true,
        data: merchantHealth[0]
      });
    } catch (error) {
      logger.error('Error getting merchant:', error);
      next(error);
    }
  }

  async updateMerchantStatus(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateMerchantLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  // === TRANSACTION MANAGEMENT ===
  async getTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.merchantId) filter.merchantId = req.query.merchantId;
      if (req.query.userId) filter.userId = req.query.userId;
      if (req.query.cardId) filter.cardId = req.query.cardId;
      if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
      
      if (req.query.startDate) filter.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filter.endDate = new Date(req.query.endDate as string);
      if (req.query.minAmount) filter.minAmount = parseFloat(req.query.minAmount as string);
      if (req.query.maxAmount) filter.maxAmount = parseFloat(req.query.maxAmount as string);

      const result = await adminService.getTransactions(filter, page, limit);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting transactions:', error);
      next(error);
    }
  }

  async getTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { transactionId } = req.params;
      const transaction = await adminService.getTransactionById(transactionId);
      
      return res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error getting transaction:', error);
      if (error instanceof Error && error.message === 'Transaction not found') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      next(error);
    }
  }

  async refundTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?._id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      const result = await adminService.forceRefundTransaction(transactionId, reason, adminId);
      
      logger.info('Admin processed refund', {
        transactionId,
        adminId,
        reason,
        refundAmount: result.refundAmount
      });

      return res.json({
        success: true,
        message: 'Refund processed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error processing refund:', error);
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('refund'))) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  async updateTransactionStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { transactionId } = req.params;
      const { status, reason } = req.body;
      const adminId = req.user?._id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      const transaction = await adminService.updateTransactionStatus(
        transactionId, 
        status, 
        reason, 
        adminId
      );

      return res.json({
        success: true,
        message: 'Transaction status updated successfully',
        data: transaction
      });
    } catch (error) {
      logger.error('Error updating transaction status:', error);
      if (error instanceof Error && error.message === 'Transaction not found') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      next(error);
    }
  }

  // === NFC CARD MANAGEMENT ===
  async getCards(_req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const cardHealthStatus = await adminService.getCardHealthStatus();
      
      return res.json({
        success: true,
        data: cardHealthStatus
      });
    } catch (error) {
      logger.error('Error getting cards:', error);
      next(error);
    }
  }

  async getCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { cardId } = req.params;
      const cardDetails = await adminService.getCardById(cardId);
      
      return res.json({
        success: true,
        data: cardDetails
      });
    } catch (error) {
      logger.error('Error getting card:', error);
      if (error instanceof Error && error.message === 'Card not found') {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }
      next(error);
    }
  }

  async updateCardStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { cardId } = req.params;
      const { status } = req.body;
      const adminId = req.user?._id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      if (status === 'blocked') {
        const result = await adminService.blockCard(cardId, 'Admin status change', adminId);
        return res.json({
          success: true,
          message: 'Card blocked successfully',
          data: result
        });
      } else if (status === 'active') {
        const result = await adminService.unblockCard(cardId, adminId);
        return res.json({
          success: true,
          message: 'Card activated successfully',
          data: result
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid status. Use blockCard or unblockCard endpoints.'
      });
    } catch (error) {
      logger.error('Error updating card status:', error);
      if (error instanceof Error && error.message === 'Card not found') {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }
      next(error);
    }
  }

  async blockCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { cardId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?._id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      const result = await adminService.blockCard(cardId, reason, adminId);
      
      logger.info('Admin blocked card', { cardId, reason, adminId });

      return res.json({
        success: true,
        message: 'Card blocked successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error blocking card:', error);
      if (error instanceof Error && error.message === 'Card not found') {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }
      next(error);
    }
  }

  async unblockCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { cardId } = req.params;
      const adminId = req.user?._id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      const result = await adminService.unblockCard(cardId, adminId);
      
      logger.info('Admin unblocked card', { cardId, adminId });

      return res.json({
        success: true,
        message: 'Card unblocked successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error unblocking card:', error);
      if (error instanceof Error && error.message === 'Card not found') {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }
      next(error);
    }
  }

  async getKYCRequests(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getKYCRequest(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async approveKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async rejectKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getAuditLog(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async enableMaintenance(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async disableMaintenance(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async clearCache(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'Admin controller method not implemented yet' });
    } catch (error) { next(error); }
  }
}

export const adminController = new AdminController();