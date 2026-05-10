import { Router } from 'express';
import {
  createRouteRunAssignment,
  getAssignmentsByRunId,
  updateRouteRunAssignment,
  deleteRouteRunAssignment,
} from '../controllers/routeRunAssignment.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorize('admin'));

// POST /api/route-run-assignments - Assign student to route run
router.post('/', createRouteRunAssignment);

// GET /api/route-run-assignments/run/:routeRunId - Get assignments for a route run
router.get('/run/:routeRunId', getAssignmentsByRunId);

// PUT /api/route-run-assignments/:id - Update assignment pickup info
router.put('/:id', updateRouteRunAssignment);

// DELETE /api/route-run-assignments/:id - Remove student from route run
router.delete('/:id', deleteRouteRunAssignment);

export default router;
