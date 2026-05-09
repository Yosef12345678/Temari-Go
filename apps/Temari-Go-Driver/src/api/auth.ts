import type { ApiEnvelope } from '@/api/envelope';
import { request } from '@/api/http';
import type { LoginData, LoginRequest, RefreshData, RefreshRequest } from '@/types/auth';

export async function login(body: LoginRequest): Promise<ApiEnvelope<LoginData>> {
  const normalized = { email: body.emailOrUsername, password: body.password };
  return await request<ApiEnvelope<LoginData>>('POST', '/auth/login', { auth: false, body: normalized });
}

export async function refresh(body: RefreshRequest): Promise<ApiEnvelope<RefreshData>> {
  return await request<ApiEnvelope<RefreshData>>('POST', '/auth/refresh', {
    auth: false,
    allowRefresh: false,
    body,
  });
}

export async function logout(): Promise<unknown> {
  return await request('POST', '/auth/logout', { auth: true });
}
