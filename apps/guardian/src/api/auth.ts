import { request } from '@/src/api/http';
import type { LoginData, LoginRequest, RefreshData, RefreshRequest, RegisterRequest } from '@/src/types/auth';
import type { ApiEnvelope } from '@/src/api/envelope';

export async function register(body: RegisterRequest): Promise<ApiEnvelope<LoginData>> {
  // Backend responds: { success: true, data: { user, tokens } }
  return await request<ApiEnvelope<LoginData>>('POST', '/auth/register', { auth: false, body });
}

export async function login(body: LoginRequest): Promise<ApiEnvelope<LoginData>> {
  // Backend responds: { success: true, data: { user, tokens } }
  return await request<ApiEnvelope<LoginData>>('POST', '/auth/login', { auth: false, body });
}

export async function refresh(body: RefreshRequest): Promise<ApiEnvelope<RefreshData>> {
  return await request<ApiEnvelope<RefreshData>>('POST', '/auth/refresh', { auth: false, allowRefresh: false, body });
}

export async function logout(): Promise<unknown> {
  return await request('POST', '/auth/logout', { auth: true });
}

export async function forgotPassword(body: Record<string, unknown>): Promise<unknown> {
  return await request('POST', '/auth/forgot-password', { auth: false, body });
}

export async function resetPassword(body: Record<string, unknown>): Promise<unknown> {
  return await request('POST', '/auth/reset-password', { auth: false, body });
}

