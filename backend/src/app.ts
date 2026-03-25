import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import { errorMiddleware } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';
import paymentsRoutes from './routes/payments.routes';
import invoiceRoutes from './routes/invoice.routes';
import attendanceRoutes from './routes/attendance.routes';
import studentRoutes from './routes/student.routes';
import busRoutes from './routes/bus.routes';
import locationRoutes from './routes/location.routes';
import geofenceRoutes from './routes/geofence.routes';
import alcoholTestRoutes from './routes/alcoholTest.routes';
import driverFeedbackRoutes from './routes/driverFeedback.routes';
import driverRatingRoutes from './routes/driverRating.routes';
import notificationRoutes from './routes/notification.routes';
import rfidCardRoutes from './routes/rfidCard.routes';
import routeRoutes from './routes/route.routes';
import routeAssignmentRoutes from './routes/routeAssignment.routes';
import schoolRoutes from './routes/school.routes';

dotenv.config();

const app = express();

const isDev = process.env.NODE_ENV !== 'production';
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

function isExpoDevOrigin(origin: string): boolean {
	// Expo web dev server commonly runs on ports like 8081 and 19006.
	// Allow localhost + common private-network IPs on any port in dev, but keep it scoped.
	if (!/^https?:\/\//.test(origin)) return false;
	if (!isDev) return false;
	return new RegExp(
		'^http:\\/\\/(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|192\\.168\\.\\d{1,3}\\.\\d{1,3}|172\\.(1[6-9]|2\\d|3[0-1])\\.\\d{1,3}\\.\\d{1,3}):\\d+$'
	).test(origin);
}

app.use(
	cors({
		origin: (origin, cb) => {
			// Native apps often don't send an Origin header.
			if (!origin) return cb(null, true);

			// Explicit allow-list from env.
			if (corsOrigins.includes(origin)) return cb(null, true);

			// Default web/dev origins (kept for backward compatibility).
			if (
				origin === 'http://localhost:3000' ||
				origin === 'http://127.0.0.1:3000' ||
				origin === 'http://localhost:8081' ||
				origin === 'http://127.0.0.1:8081'
			) {
				return cb(null, true);
			}

			// Expo dev server (typically localhost on a port)
			if (isExpoDevOrigin(origin)) return cb(null, true);

			// Block unknown origins in production; allow in dev only for local origins.
			return cb(null, false);
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
		optionsSuccessStatus: 204,
	})
);
app.use(express.json());
app.use(cookieParser());

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Add auth and user routes directly
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/alcohol-tests', alcoholTestRoutes);
app.use('/api/driver-feedback', driverFeedbackRoutes);
app.use('/api/driver-ratings', driverRatingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rfid-cards', rfidCardRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/route-assignments', routeAssignmentRoutes);
app.use('/api/schools', schoolRoutes);

app.use(errorMiddleware);

export default app;
