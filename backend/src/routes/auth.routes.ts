import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleCallback,
  driverSelfRegister,
  listDriverApplications,
  approveDriverApplication,
  rejectDriverApplication,
} from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/register', register);
router.post('/driver/register', driverSelfRegister);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// /api/auth/login
// Social auth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Admin workflow for pending driver verification
router.get('/admin/driver-applications', authMiddleware, authorize('admin'), listDriverApplications);
router.post('/admin/driver-applications/:userId/approve', authMiddleware, authorize('admin'), approveDriverApplication);
router.post('/admin/driver-applications/:userId/reject', authMiddleware, authorize('admin'), rejectDriverApplication);

export default router;


