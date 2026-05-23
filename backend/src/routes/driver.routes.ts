import { Router } from 'express';

import {
  getDriverJobById,
  getDriverJobs,
  getDriverJobAlcoholCheck,
  startDriverJobAlcoholCheck,
  updateDriverJobStatus,
} from '../controllers/driver.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorize('driver', 'admin'));

router.get('/me/jobs', getDriverJobs);
router.get('/jobs/:jobId', getDriverJobById);
router.post('/jobs/:jobId/alcohol-check', startDriverJobAlcoholCheck);
router.get('/jobs/:jobId/alcohol-check', getDriverJobAlcoholCheck);
router.post('/jobs/:jobId/accept', (req, res) => updateDriverJobStatus(req, res, 'accepted'));
router.post('/jobs/:jobId/arrive', (req, res) => updateDriverJobStatus(req, res, 'arrived'));
router.post('/jobs/:jobId/pickup', (req, res) => updateDriverJobStatus(req, res, 'picked_up'));
router.post('/jobs/:jobId/complete', (req, res) => updateDriverJobStatus(req, res, 'completed'));
router.post('/jobs/:jobId/cancel', (req, res) => updateDriverJobStatus(req, res, 'cancelled'));

export default router;
