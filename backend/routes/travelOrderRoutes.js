import express from 'express';
import {
  getMyTravelOrders,
  getTravelOrderById,
  downloadTravelOrderPDF,
} from '../controllers/travelOrderController.js';
import { authenticate } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// Get my travel orders
router.get('/my-orders', getMyTravelOrders);

// Download travel order PDF (must come before /:id route to ensure it matches first)
router.get('/:id/download', downloadTravelOrderPDF);

// Get travel order by ID (less specific route comes last)
router.get('/:id', getTravelOrderById);

export default router;

