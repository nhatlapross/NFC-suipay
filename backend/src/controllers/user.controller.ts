import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';

export class UserController {
  // Profile management
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      return res.json({ success: true, user: req.user });
    } catch (error) { next(error); }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { fullName, phoneNumber } = req.body || {};

      const update: Partial<typeof req.user> = {} as any;
      if (typeof fullName === 'string' && fullName.trim().length > 0) update.fullName = fullName.trim();
      if (typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) update.phoneNumber = phoneNumber.trim();

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
      }

      const saved = await User.findByIdAndUpdate(req.user._id, update, { new: true });
      if (!saved) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.json({
        success: true,
        user: {
          id: saved._id,
          email: saved.email,
          fullName: saved.fullName,
          phoneNumber: saved.phoneNumber,
          walletAddress: saved.walletAddress,
          role: saved.role,
          dailyLimit: saved.dailyLimit,
          monthlyLimit: saved.monthlyLimit,
          kycStatus: saved.kycStatus,
        },
      });
    } catch (error) { next(error); }
  }

  async deleteAccount(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  // Settings
  async getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      return res.json({
        success: true,
        settings: {
          twoFactorAuth: !!req.user.twoFactorEnabled,
          dailyLimit: req.user.dailyLimit,
          monthlyLimit: req.user.monthlyLimit,
        },
      });
    } catch (error) { next(error); }
  }

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { twoFactorAuth } = req.body || {};

      const user = await User.findById(req.user._id).select('+twoFactorSecret');
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });

      if (typeof twoFactorAuth === 'boolean') user.twoFactorEnabled = twoFactorAuth;

      await user.save();

      return res.json({
        success: true,
        settings: {
          twoFactorAuth: !!user.twoFactorEnabled,
          dailyLimit: user.dailyLimit,
          monthlyLimit: user.monthlyLimit,
        },
      });
    } catch (error) { next(error); }
  }

  // Limits
  async getLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  // PIN management
  async setPin(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { pin, confirmPin } = req.body;

      if (!pin || !confirmPin) {
        return res.status(400).json({
          success: false,
          error: 'PIN and confirmPin are required'
        });
      }

      if (pin !== confirmPin) {
        return res.status(400).json({
          success: false,
          error: 'PIN and confirmPin do not match'
        });
      }

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          error: 'PIN must be 4 digits'
        });
      }

      // Get user document with setPin method and pinHash field
      const user = await User.findById(req.user._id).select('+pinHash');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Set PIN using model method
      console.log('Before setPin - user.pinHash:', user.pinHash);
      await user.setPin!(pin);
      console.log('After setPin - user.pinHash:', !!user.pinHash);
      await user.save();
      console.log('After save - user.pinHash:', !!user.pinHash);

      return res.json({
        success: true,
        message: 'PIN set successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async changePin(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { currentPin, newPin, confirmNewPin } = req.body;

      if (!currentPin || !newPin || !confirmNewPin) {
        return res.status(400).json({
          success: false,
          error: 'currentPin, newPin, and confirmNewPin are required'
        });
      }

      if (newPin !== confirmNewPin) {
        return res.status(400).json({
          success: false,
          error: 'New PIN and confirm PIN do not match'
        });
      }

      // Validate new PIN format (4 digits)
      if (!/^\d{4}$/.test(newPin)) {
        return res.status(400).json({
          success: false,
          error: 'PIN must be 4 digits'
        });
      }

      // Get user document
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Verify current PIN
      const isCurrentPinValid = await user.comparePin!(currentPin);
      if (!isCurrentPinValid) {
        return res.status(400).json({
          success: false,
          error: 'Current PIN is incorrect'
        });
      }

      // Set new PIN
      await user.setPin!(newPin);
      await user.save();

      return res.json({
        success: true,
        message: 'PIN changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPin(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({
          success: false,
          error: 'PIN is required'
        });
      }

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          error: 'PIN must be 4 digits'
        });
      }

      // Get user document with pinHash field
      const user = await User.findById(req.user._id).select('+pinHash');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Check if PIN is set
      console.log('PIN verify - user._id:', user._id, 'user.pinHash exists:', !!user.pinHash);
      if (!user.pinHash) {
        return res.status(400).json({
          success: false,
          error: 'PIN not set'
        });
      }

      // Verify PIN
      const isPinValid = await user.comparePin!(pin);

      return res.json({
        success: true,
        valid: isPinValid,
        message: isPinValid ? 'PIN is correct' : 'PIN is incorrect'
      });
    } catch (error) {
      next(error);
    }
  }

  // Other methods (KYC, notifications, sessions, stats, etc.)
  async getKYCStatus(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async submitKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getNotifications(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async markNotificationAsRead(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async deleteNotification(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getActiveSessions(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async terminateSession(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async terminateAllSessions(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getUserStats(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getActivity(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  // Admin methods
  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async getUserById(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateUserStatus(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async updateUserLimits(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async approveKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }

  async rejectKYC(_req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      res.json({ success: true, message: 'User controller method not implemented yet' });
    } catch (error) { next(error); }
  }
}

export const userController = new UserController();