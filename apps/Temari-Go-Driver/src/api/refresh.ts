import { clearTokens, writeTokens } from '@/storage/secureTokens';

import type { ApiEnvelope } from './envelope';
import type { ApiError } from './http';
import { request } from './http';
import { getRefreshToken, setTokens } from './tokenStore';

type RefreshData = {
  accessToken: string;
  refreshToken?: string;
};

let inFlight: Promise<boolean> | null = null;

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
      await writeTokens(next);
      return true;
    } catch (e: unknown) {
      const err = e as Partial<ApiError> & { code?: unknown };
      const code = typeof err.code === 'string' ? err.code : undefined;
      const status = typeof err.status === 'number' ? err.status : undefined;
      if (status === 401 && (code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED' || code === 'UNAUTHORIZED' || !code)) {
        setTokens(null);
        await clearTokens();
      }
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
