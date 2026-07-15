import express from 'express';
import {
  getAllInputCorrespondence,
  getInputCorrespondenceById,
  getInputCorrespondenceNumbers,
  checkInputCorrespondenceEditPermission,
  createInputCorrespondence,
  updateInputCorrespondence,
  deleteInputCorrespondence,
  uploadInputCorrespondencePdf,
  downloadInputCorrespondencePdf,
} from '../controllers/correspondenceController.js';
import { authenticate } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);
router.use(generalLimiter);

router.get('/', getAllInputCorrespondence);
router.get('/numbers', getInputCorrespondenceNumbers);
router.post('/', createInputCorrespondence);
router.get('/:id/download', downloadInputCorrespondencePdf);
router.get('/:id/permission', checkInputCorrespondenceEditPermission);
router.post('/:id/pdf', uploadInputCorrespondencePdf);
router.get('/:id', getInputCorrespondenceById);
router.put('/:id', updateInputCorrespondence);
router.delete('/:id', deleteInputCorrespondence);

export default router;
