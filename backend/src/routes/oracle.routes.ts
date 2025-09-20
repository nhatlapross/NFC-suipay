import { Router } from 'express';
import { oracleController } from '../controllers/oracle.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: Router = Router();

// Public routes
router.get('/rate', oracleController.getCurrentRate);
router.get('/currencies', oracleController.getSupportedCurrencies);
router.post('/convert', oracleController.convertCurrency);

// Protected routes (require authentication)
router.post('/rate/update', authenticate, oracleController.updateRate);
router.post('/rate/set', authenticate, oracleController.setExchangeRate);

export default router;
