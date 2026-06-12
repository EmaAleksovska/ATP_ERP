import express from 'express';
import { body } from 'express-validator';
import { login, getCurrentUser, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

// Get current user
router.get('/me', authenticate, getCurrentUser);

// Forgot password
router.post(
  '/forgot-password',
  generalLimiter,
  [body('email').isEmail().normalizeEmail()],
  forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  generalLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  resetPassword
);

export default router;

