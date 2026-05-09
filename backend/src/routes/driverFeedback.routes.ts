import { Router } from 'express';
import { canRateDriver, submitDriverFeedback } from '../controllers/driverFeedback.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/driver-feedback/can-rate/:driverId - Eligibility check (Parent access)
router.get('/can-rate/:driverId', authorize('parent'), canRateDriver);

// POST /api/driver-feedback - Submit driver feedback (Parent access)
router.post('/', authorize('parent'), submitDriverFeedback);

export default router;
