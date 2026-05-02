import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import {
	createDevice,
	getDevice,
	listDevices,
	rotateDeviceKey,
	setDeviceActive,
	setDeviceBus,
} from '../controllers/device.controller';

const router = Router();

// All device management routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// GET /api/devices?active=true&busId=1&page=1&pageSize=50
router.get('/', listDevices);

// GET /api/devices/:id
router.get('/:id', getDevice);

// POST /api/devices  { name, bus_id? }  -> returns rawKey once
router.post('/', createDevice);

// POST /api/devices/:id/rotate-key -> returns rawKey once
router.post('/:id/rotate-key', rotateDeviceKey);

// PATCH /api/devices/:id/active  { active: boolean }
router.patch('/:id/active', setDeviceActive);

// PATCH /api/devices/:id/bus  { bus_id: number|null }
router.patch('/:id/bus', setDeviceBus);

export default router;

