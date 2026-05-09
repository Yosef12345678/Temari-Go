import { db } from '../../models';
const { User, Role, RefreshToken, DriverProfile } = db;
import { hashPassword, comparePassword } from '../utils/hash';
import {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
	signPasswordResetToken,
	verifyPasswordResetToken,
	signDriverSetupToken,
	verifyDriverSetupToken,
} from '../utils/jwt';
import { sendDriverSetupEmail, sendPasswordResetEmail } from '../utils/email';

type RegisterInput = {
	name: string;
	email: string;
	password: string;
	phone_number?: string | null;
	language_preference?: string | null;
};
type LoginInput = { email: string; password: string };
type ForgotPasswordInput = { email: string };
type ResetPasswordInput = { token: string; password: string };
type DriverSelfRegisterInput = {
	name: string;
	email: string;
	phone_number?: string | null;
	username?: string | null;
};

function parseRefreshExpiryToDate(): Date {
	const raw = process.env.REFRESH_TOKEN_EXPIRY || '7d';
	const now = Date.now();
	const match = /^([0-9]+)([smhd])$/.exec(raw);
	if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
	const value = Number(match[1]);
	const unit = match[2];
	const ms = unit === 's' ? value * 1000 : unit === 'm' ? value * 60 * 1000 : unit === 'h' ? value * 60 * 60 * 1000 : value * 24 * 60 * 60 * 1000;
	return new Date(now + ms);
}

export class AuthService {
	static async register(input: RegisterInput) {
		const existing = await User.findOne({ where: { email: input.email } });
		if (existing) {
			// Check if user is a social auth user
			if (existing.provider && (!existing.password || existing.password === 'social-auth-no-password')) {
				throw { status: 400, code: 'EMAIL_IN_USE_SOCIAL', message: 'This email is already registered with social authentication. Please use Google to sign in.' };
			}
			throw { status: 400, code: 'EMAIL_IN_USE', message: 'Email already in use.' };
		}
		const password = await hashPassword(input.password);
		// Default role for Guardian (parent registration).
		const role = await Role.findOne({ where: { name: 'parent' } });
		const user = await User.create({
			name: input.name,
			email: input.email,
			password,
			role_id: role?.id,
			phone_number: input.phone_number ?? null,
			language_preference: input.language_preference,
		});
		
		// Generate tokens for the new user
		const roleName = role?.name || 'parent';
		const { token: accessToken, expiresIn: accessTokenExpiresIn } = signAccessToken({ id: String(user.id), email: user.email, role: roleName });
		const { token: refreshToken, expiresIn: refreshTokenExpiresIn } = signRefreshToken({ id: String(user.id), email: user.email, role: roleName });
		await RefreshToken.create({ token: refreshToken, expiry_date: parseRefreshExpiryToDate(), user_id: user.id as number });
		
		return {
			user: { id: String(user.id), name: user.name, email: user.email, role: roleName },
			tokens: { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn },
		};
	}

	static async login(input: LoginInput) {
		const user = await User.findOne({
			where: { email: input.email },
			include: [
				Role,
				{ model: DriverProfile, as: 'driverProfile', required: false },
			],
		});
		if (!user) {
			throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
		}
		
		// Check if user is a social auth user (has provider and default password or no password)
		if (user.provider && (!user.password || user.password === 'social-auth-no-password')) {
			throw { status: 401, code: 'SOCIAL_AUTH_USER', message: 'This account was created with social authentication. Please use Google to sign in.' };
		}
		
		// Check if user has a password set
		if (!user.password) {
			throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
		}
		const roleName = user.role?.name || 'user';
		const driverProfile = (user as any).driverProfile;
		if (roleName === 'driver') {
			if (!driverProfile) {
				throw {
					status: 403,
					code: 'DRIVER_PROFILE_MISSING',
					message: 'Driver profile is not initialized. Contact admin.',
				};
			}
			if (driverProfile.onboarding_status !== 'active') {
				throw {
					status: 403,
					code: 'ACCOUNT_NOT_ACTIVE',
					message:
						driverProfile.onboarding_status === 'pending_verification'
							? 'Your account is pending admin verification.'
							: driverProfile.onboarding_status === 'rejected'
							? `Your account was rejected${driverProfile.rejected_reason ? `: ${driverProfile.rejected_reason}` : '.'}`
							: 'Your account is not active.',
				};
			}
		}
		
		const ok = await comparePassword(input.password, user.password);
		if (!ok) {
			throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
		}
		const { token: accessToken, expiresIn: accessTokenExpiresIn } = signAccessToken({ id: String(user.id), email: user.email, role: roleName });
		const { token: refreshToken, expiresIn: refreshTokenExpiresIn } = signRefreshToken({ id: String(user.id), email: user.email, role: roleName });
		await RefreshToken.create({ token: refreshToken, expiry_date: parseRefreshExpiryToDate(), user_id: user.id as number });
		const firstLogin = roleName === 'driver' ? Boolean(driverProfile?.first_login_pending) : false;
		if (firstLogin && driverProfile) {
			await driverProfile.update({ first_login_pending: false });
		}
		return {
			user: {
				id: String(user.id),
				name: user.name,
				email: user.email,
				role: roleName,
				account_status: roleName === 'driver' ? driverProfile?.onboarding_status ?? 'pending_verification' : 'active',
			},
			tokens: { accessToken, accessTokenExpiresIn, refreshToken, refreshTokenExpiresIn },
			first_login: firstLogin,
		};
	}

	static async refresh(refreshToken: string) {
		// verify signature
		const payload = verifyRefreshToken(refreshToken);
		// verify presence in DB and not expired
		const existing = await RefreshToken.findOne({ where: { token: refreshToken } });
		if (!existing) {
			throw { status: 401, code: 'INVALID_TOKEN', message: 'Invalid token.' };
		}
		if (existing.expiry_date && existing.expiry_date.getTime() < Date.now()) {
			throw { status: 401, code: 'TOKEN_EXPIRED', message: 'Token has expired.' };
		}
		// issue new access token
		const { token: accessToken, expiresIn: accessTokenExpiresIn } = signAccessToken({ id: payload.userId, email: payload.email, role: payload.role });
		return { accessToken, accessTokenExpiresIn };
	}

	static async logout(refreshToken: string) {
		await RefreshToken.destroy({ where: { token: refreshToken } });
		return { success: true };
	}

	static async forgotPassword(input: ForgotPasswordInput) {
		const user = await User.findOne({ where: { email: input.email } });
		if (!user) {
			// Don't reveal if email exists or not for security
			return { success: true, message: 'If the email exists, a password reset link has been sent.' };
		}

		// Check if user is a social auth user
		if (user.provider && (!user.password || user.password === 'social-auth-no-password')) {
			throw { status: 400, code: 'SOCIAL_AUTH_USER', message: 'This account was created with social authentication. Please use Google to sign in.' };
		}

		// Generate password reset token
		const roleName = 'user'; // Default role for password reset
		const { token: resetToken } = signPasswordResetToken({ 
			id: String(user.id), 
			email: user.email, 
			role: roleName 
		});

		// Send password reset email
		await sendPasswordResetEmail({
			email: user.email,
			resetToken,
			userName: user.name
		});

		return { success: true, message: 'If the email exists, a password reset link has been sent.' };
	}

	static async resetPassword(input: ResetPasswordInput) {
		try {
			// Verify as driver setup token first, fall back to standard reset token
			let payload: any;
			let tokenPurpose: 'setup' | 'reset' = 'reset';
			try {
				payload = verifyDriverSetupToken(input.token);
				tokenPurpose = 'setup';
			} catch {
				payload = verifyPasswordResetToken(input.token);
				tokenPurpose = 'reset';
			}
			
			// Find the user
			const user = await User.findOne({ where: { id: payload.userId } });
			if (!user) {
				throw { status: 400, code: 'INVALID_TOKEN', message: 'Invalid or expired reset token.' };
			}

			// Check if user is a social auth user
			if (user.provider && user.password === 'social-auth-no-password') {
				throw { status: 400, code: 'SOCIAL_AUTH_USER', message: 'This account was created with social authentication. Please use Google to sign in.' };
			}

			// Hash the new password
			const hashedPassword = await hashPassword(input.password);
			
			// Update the user's password
			const updates: Record<string, unknown> = { password: hashedPassword };
			if (tokenPurpose === 'setup' && user.role_id) {
				const role = await Role.findByPk(user.role_id);
				if (role?.name === 'driver') {
					const driverProfile = await DriverProfile.findOne({ where: { user_id: user.id } });
					if (!driverProfile) {
						throw { status: 400, code: 'DRIVER_PROFILE_MISSING', message: 'Driver profile is missing.' };
					}
					await driverProfile.update({
						onboarding_status: 'active',
						first_login_pending: true,
						verified_at: driverProfile.verified_at ?? new Date(),
						rejected_reason: null,
					});
				}
			}
			await user.update(updates);

			// Invalidate all refresh tokens for security
			await RefreshToken.destroy({ where: { user_id: user.id } });

			return { success: true, message: 'Password has been reset successfully.' };
		} catch (error: any) {
			if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
				throw { status: 400, code: 'INVALID_TOKEN', message: 'Invalid or expired reset token.' };
			}
			throw error;
		}
	}

	static async driverSelfRegister(input: DriverSelfRegisterInput) {
		const existing = await User.findOne({ where: { email: input.email } });
		if (existing) {
			throw { status: 400, code: 'EMAIL_IN_USE', message: 'Email already in use.' };
		}
		if (input.username) {
			const existingUsername = await User.findOne({ where: { username: input.username } });
			if (existingUsername) {
				throw { status: 400, code: 'USERNAME_IN_USE', message: 'Username already in use.' };
			}
		}
		const driverRole = await Role.findOne({ where: { name: 'driver' } });
		if (!driverRole) {
			throw { status: 500, code: 'ROLE_NOT_FOUND', message: 'Driver role is not configured.' };
		}
		const user = await User.create({
			name: input.name,
			email: input.email,
			password: null,
			phone_number: input.phone_number ?? null,
			username: input.username ?? null,
			role_id: driverRole.id,
		});
		await DriverProfile.create({
			user_id: user.id,
			onboarding_status: 'pending_verification',
			first_login_pending: true,
		});
		return {
			id: String(user.id),
			name: user.name,
			email: user.email,
			status: 'pending_verification',
			message:
				'Your application is pending admin verification. Please bring required documents to admin to continue.',
		};
	}

	static async listDriverApplications(status: 'pending_verification' | 'rejected' | 'active' = 'pending_verification') {
		const driverRole = await Role.findOne({ where: { name: 'driver' } });
		if (!driverRole) return [];
		const users = await User.findAll({
			where: { role_id: driverRole.id },
			include: [
				{
					model: DriverProfile,
					as: 'driverProfile',
					where: { onboarding_status: status },
					required: true,
				},
			],
			attributes: ['id', 'name', 'email', 'phone_number', 'username', 'created_at'],
			order: [['created_at', 'DESC']],
		});
		return users.map((u: any) => ({
			...u.toJSON(),
			account_status: u.driverProfile?.onboarding_status ?? 'pending_verification',
			verified_at: u.driverProfile?.verified_at ?? null,
			rejected_reason: u.driverProfile?.rejected_reason ?? null,
		}));
	}

	static async approveDriverApplication(adminUserId: number, userId: number) {
		const user = await User.findByPk(userId, { include: [Role] });
		if (!user || user.role?.name !== 'driver') {
			throw { status: 404, code: 'DRIVER_NOT_FOUND', message: 'Driver application not found.' };
		}
		const driverProfile = await DriverProfile.findOne({ where: { user_id: user.id } });
		if (!driverProfile) {
			throw { status: 404, code: 'DRIVER_PROFILE_MISSING', message: 'Driver profile not found.' };
		}
		if (driverProfile.onboarding_status === 'active' && user.password) {
			throw { status: 409, code: 'ALREADY_ACTIVE', message: 'Driver is already active.' };
		}
		await driverProfile.update({
			onboarding_status: 'pending_verification',
			verified_by: adminUserId,
			verified_at: new Date(),
			rejected_reason: null,
		});

		const { token, expiresIn } = signDriverSetupToken({
			id: String(user.id),
			email: user.email,
			role: 'driver',
		});
		await sendDriverSetupEmail({
			email: user.email,
			setupToken: token,
			userName: user.name,
		});
		return {
			driver_id: user.id,
			email: user.email,
			setup_link_expires_in: expiresIn,
			status: 'pending_password_setup',
		};
	}

	static async rejectDriverApplication(adminUserId: number, userId: number, reason?: string) {
		const user = await User.findByPk(userId, { include: [Role] });
		if (!user || user.role?.name !== 'driver') {
			throw { status: 404, code: 'DRIVER_NOT_FOUND', message: 'Driver application not found.' };
		}
		const driverProfile = await DriverProfile.findOne({ where: { user_id: user.id } });
		if (!driverProfile) {
			throw { status: 404, code: 'DRIVER_PROFILE_MISSING', message: 'Driver profile not found.' };
		}
		await driverProfile.update({
			onboarding_status: 'rejected',
			verified_by: adminUserId,
			verified_at: new Date(),
			rejected_reason: reason?.trim() || null,
		});
		return {
			driver_id: user.id,
			status: driverProfile.onboarding_status,
			rejected_reason: driverProfile.rejected_reason,
		};
	}
}


