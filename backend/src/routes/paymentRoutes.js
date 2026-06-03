import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getReceivedPayments,
  getSentPayments,
  getPublicSupporters,
  getPaymentStats,
} from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Create order
router.post('/create-order', authenticate, createOrder);

// Verify payment
router.post('/verify', authenticate, verifyPayment);

// Get received payments (creator view)
router.get('/received', authenticate, getReceivedPayments);

// Get sent payments (supporter view)
router.get('/sent', authenticate, getSentPayments);

// Get public supporters for a creator
router.get('/supporters/:userId', getPublicSupporters);

// Get payment statistics
router.get('/stats', authenticate, getPaymentStats);

export default router;
