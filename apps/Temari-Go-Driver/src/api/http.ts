import { constants } from '@/config/constants';
import { env } from '@/config/env';

import { getAccessToken } from './tokenStore';

export type ApiError = {
  status: number;
  message: string;
  code?: string;
};

export type RequestOptions = {
  auth?: boolean;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  timeoutMs?: number;
  allowRefresh?: boolean;
};

function toQueryString(query: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

function extractBackendError(data: unknown): { code?: string; status?: number } {
  if (typeof data !== 'object' || !data) return {};
  const maybe = data as { code?: unknown; status?: unknown; error?: any };
  const code =
    (typeof maybe.code === 'string' && maybe.code) ||
    (typeof maybe.error?.code === 'string' && maybe.error.code) ||
    undefined;
  const status =
    (typeof maybe.status === 'number' && maybe.status) ||
    (typeof maybe.error?.status === 'number' && maybe.error.status) ||
    undefined;
  return { code, status };
}

function toUserMessage(status: number, code?: string): string {
  if (code === 'INVALID_CREDENTIALS') return 'Incorrect email or password.';
  if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED') {
    return 'Your session has expired. Please sign in again.';
  }
  if (status >= 500) return 'Something went wrong. Please try again later.';
  if (status === 400) return 'Please check your input and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested item was not found.';
  if (status === 409) return 'Unable to complete your request. Please try again.';
  return 'Unable to complete your request. Please try again.';
}

function normalizeError(status: number, data: unknown): ApiError {
  const extracted = extractBackendError(data);
  return {
    status,
    code: extracted.code,
    message: toUserMessage(status, extracted.code),
  };
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? constants.api.timeoutMs;
  const allowRefresh = options.allowRefresh ?? true;
  const url = `${env.API_BASE_URL}${constants.api.basePath}${path}${toQueryString(options.query)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    };

    if (options.auth) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (res.ok) return data as T;

    if (res.status === 401 && options.auth && allowRefresh) {
      const { refreshAndUpdateSession } = await import('./refresh');
      const refreshed = await refreshAndUpdateSession();
      if (refreshed) return await request<T>(method, path, { ...options, allowRefresh: false });
    }

    throw normalizeError(res.status, data);
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw { status: 0, message: 'Connection timed out. Please try again.' } satisfies ApiError;
    }
    if (typeof e?.status === 'number' && typeof e?.message === 'string') throw e as ApiError;
    throw {
      status: 0,
      message: 'Unable to connect. Please check your internet connection and try again.',
    } satisfies ApiError;
  } finally {
    clearTimeout(timeout);
  }
}
