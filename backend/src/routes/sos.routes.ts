import { Router } from 'express';

import { triggerSOS } from '../controllers/sos.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/', authMiddleware, authorize('driver', 'admin'), triggerSOS);

export default router;
