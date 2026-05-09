import { Router } from 'express';

import { streamRealtime } from '../controllers/realtime.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

router.get('/stream', authMiddleware, streamRealtime);

export default router;
