import express from 'express';
import { body } from 'express-validator';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// Get all projects
router.get('/', getAllProjects);

// Get project by ID
router.get('/:id', getProjectById);

// Create project (admin only)
router.post(
  '/',
  requireAdmin,
  [
    body('name').notEmpty().trim(),
    body('projectId').notEmpty().trim(),
    body('description').optional().trim(),
    body('clientCode').optional().trim(),
    body('responsibleUserId').optional().isUUID(),
  ],
  createProject
);

// Update project (admin only)
router.put(
  '/:id',
  requireAdmin,
  [
    body('name').optional().notEmpty().trim(),
    body('projectId').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('clientCode').optional().trim(),
    body('responsibleUserId').optional().isUUID(),
  ],
  updateProject
);

// Delete project (admin only)
router.delete('/:id', requireAdmin, deleteProject);

export default router;

