import { Router } from 'express';
import { sponsorController } from '../controllers/sponsor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Get sponsor info (public for transparency)
router.get('/info',
    sponsorController.getSponsorInfo
);

// All routes require authentication
router.use(authenticate);

// Faucet funds from sponsor wallet (any authenticated user)
router.post('/faucet/sui',
    paymentLimiter,
    sponsorController.faucetSui
);

router.post('/faucet/mycoin',
    paymentLimiter,
    sponsorController.faucetMyCoin
);

// Sponsor funds to specific address (admin/merchant only)
router.post('/sui',
    authorize('admin', 'merchant'),
    paymentLimiter,
    sponsorController.sponsorSui
);

router.post('/mycoin',
    authorize('admin', 'merchant'),
    paymentLimiter,
    sponsorController.sponsorMyCoin
);

// Sponsor funds to current user's wallet
router.post('/user',
    paymentLimiter,
    sponsorController.sponsorUser
);

// Bulk sponsor (admin only)
router.post('/bulk',
    authorize('admin'),
    sponsorController.bulkSponsor
);

export default router;