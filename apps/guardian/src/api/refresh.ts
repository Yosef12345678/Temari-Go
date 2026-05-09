import { request } from './http';
import { getRefreshToken, setTokens } from './tokenStore';
import type { ApiEnvelope } from './envelope';
import { writeTokens } from '@/src/storage/secureTokens';
import type { ApiError } from './http';

type RefreshData = {
  accessToken: string;
  refreshToken?: string;
};

let inFlight: Promise<boolean> | null = null;

/**
 * Tries to refresh the access token once. Returns true if session updated.
 * Only clears tokens when the refresh token is definitely invalid/expired.
 */
export async function refreshAndUpdateSession(): Promise<boolean> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await request<ApiEnvelope<RefreshData>>('POST', '/auth/refresh', {
        auth: false,
        allowRefresh: false,
        body: { refreshToken },
      });
      const accessToken = res?.data?.accessToken;
      const rotatedRefresh = res?.data?.refreshToken;
      if (!accessToken) return false;
      const next = { accessToken, refreshToken: rotatedRefresh ?? refreshToken };
      setTokens(next);
      // Keep persisted session in sync (so app restarts don't resurrect an expired access token).
      await writeTokens(next);
      return true;
    } catch (e: unknown) {
      const err = e as Partial<ApiError> & { code?: unknown };
      const code = typeof err.code === 'string' ? err.code : undefined;
      const status = typeof err.status === 'number' ? err.status : undefined;

      // Only force re-login when the refresh token is invalid/expired (or missing).
      if (status === 401 && (code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED' || code === 'UNAUTHORIZED' || !code)) {
        setTokens(null);
      }
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

