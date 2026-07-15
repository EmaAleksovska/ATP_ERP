import express from 'express';
import {
  getAllOutputCorrespondence,
  getOutputCorrespondenceById,
  getOutputCorrespondenceNumbers,
  checkOutputCorrespondenceEditPermission,
  createOutputCorrespondence,
  updateOutputCorrespondence,
  deleteOutputCorrespondence,
  uploadOutputCorrespondencePdf,
  downloadOutputCorrespondencePdf,
} from '../controllers/correspondenceController.js';
import { authenticate } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);
router.use(generalLimiter);

router.get('/', getAllOutputCorrespondence);
router.get('/numbers', getOutputCorrespondenceNumbers);
router.post('/', createOutputCorrespondence);
router.get('/:id/download', downloadOutputCorrespondencePdf);
router.get('/:id/permission', checkOutputCorrespondenceEditPermission);
router.post('/:id/pdf', uploadOutputCorrespondencePdf);
router.get('/:id', getOutputCorrespondenceById);
router.put('/:id', updateOutputCorrespondence);
router.delete('/:id', deleteOutputCorrespondence);

export default router;
