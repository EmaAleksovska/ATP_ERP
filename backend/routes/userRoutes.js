import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getSenderUserOptions,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// Sender options for correspondence (any authenticated user)
router.get('/sender-options', getSenderUserOptions);

// Get all users (admin only)
router.get('/', requireAdmin, getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create user (admin only)
router.post(
  '/',
  requireAdmin,
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').optional().isIn(['admin', 'user']),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  createUser
);

// Update user (admin only)
router.put(
  '/:id',
  requireAdmin,
  [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['admin', 'user']),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  updateUser
);

// Delete user (admin only)
router.delete('/:id', requireAdmin, deleteUser);

// Update user status (admin only)
router.patch(
  '/:id/status',
  requireAdmin,
  [body('status').isIn(['active', 'inactive'])],
  updateUserStatus
);

export default router;

