import { Router } from 'express';
import { scanAttendance, syncAttendance, manualAttendance, getStudentAttendance, getBusAttendance, getAllAttendance, reportParentAbsence, getDriverAbsences, getParentAbsences } from '../controllers/attendance.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import deviceAuthMiddleware from '../middlewares/deviceAuth.middleware';

const router = Router();

// Microcontroller ingestion endpoints (secured via device auth)
router.post('/scan', deviceAuthMiddleware, scanAttendance);
router.post('/sync', deviceAuthMiddleware, syncAttendance);

// Protected endpoints for drivers and users
router.post('/manual', authMiddleware, manualAttendance);
router.post('/absence', authMiddleware, reportParentAbsence);
router.get('/driver/absences', authMiddleware, authorize('driver', 'admin'), getDriverAbsences);
router.get('/parent-absences', authMiddleware, authorize('admin'), getParentAbsences);
router.get('/', authMiddleware, getAllAttendance);
router.get('/student/:studentId', authMiddleware, getStudentAttendance);
router.get('/bus/:busId', authMiddleware, authorize('driver', 'admin'), getBusAttendance);

export default router;

