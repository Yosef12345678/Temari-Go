import { Router } from 'express';
import {
  createRouteRun,
  getAllRouteRuns,
  getRouteRunById,
  deleteRouteRun,
} from '../controllers/routeRun.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorize('admin'));

// POST /api/route-runs - Create new route run from template
router.post('/', createRouteRun);

// GET /api/route-runs - List route runs (filter by route_id, bus_id, run_date, status)
router.get('/', getAllRouteRuns);

// GET /api/route-runs/:id - Get route run details with assignments
router.get('/:id', getRouteRunById);

// DELETE /api/route-runs/:id - Delete route run
router.delete('/:id', deleteRouteRun);

export default router;
