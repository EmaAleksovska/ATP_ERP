import express from 'express';
import { body } from 'express-validator';
import {
  submitTravelRequest,
  getMyTravelRequests,
  getTravelRequests,
  getRequestsForMyProjects,
  getTravelRequestById,
  approveTravelRequest,
  rejectTravelRequest,
  getApprovedCities,
} from '../controllers/travelRequestController.js';
import { authenticate } from '../middleware/auth.js';
import { requireResponsibleUser } from '../middleware/roleCheck.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// Submit travel request
router.post(
  '/',
  [
    body('projectId').isUUID(),
    body('locationCountry').optional().trim(),
    body('locationCity').notEmpty().trim(),
    body('startDate').isISO8601().toDate(),
    body('endDate').isISO8601().toDate(),
    body('dailyAllowance').isFloat({ min: 0 }),
    body('notes').optional().trim(),
  ],
  submitTravelRequest
);

// Get approved cities (cities from approved travel orders)
router.get('/approved-cities', getApprovedCities);

// Get requests for my projects (responsible user view)
router.get('/my-projects', getRequestsForMyProjects);

// Get my travel requests
router.get('/my-requests', getMyTravelRequests);

// Get all travel requests (admin sees all, users see only their own)
router.get('/', getTravelRequests);

// Get travel request by ID
router.get('/:id', getTravelRequestById);

// Approve travel request (responsible user)
router.patch('/:id/approve', requireResponsibleUser, approveTravelRequest);

// Reject travel request (responsible user)
router.patch(
  '/:id/reject',
  requireResponsibleUser,
  [body('rejectionReason').optional().trim()],
  rejectTravelRequest
);

export default router;

