import { Router } from 'express';
import authRoutes from './auth.routes';
import paymentRoutes from './payment.routes';
import walletRoutes from './wallet.routes';
import cardRoutes from './card.routes';
import userRoutes from './user.routes';
import merchantRoutes from './merchant.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'NFC Payment API v1.0',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      payment: '/api/payment',
      wallet: '/api/wallet',
      card: '/api/card',
      user: '/api/user',
      merchant: '/api/merchant',
      admin: '/api/admin',
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/payment', paymentRoutes);
router.use('/wallet', walletRoutes);
router.use('/card', cardRoutes);
router.use('/user', userRoutes);
router.use('/merchant', merchantRoutes);
router.use('/admin', adminRoutes);

// 404 handler for API routes
router.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

export default router;