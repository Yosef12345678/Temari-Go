import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthTokens } from '@/src/api/tokenStore';
import { request } from '@/src/api/http';
import { bootstrapSession, clearSession, setSession, type SessionState } from '@/src/storage/session';
import { subscribeToSessionExpired } from '@/src/auth/sessionEvents';
import type { ApiEnvelope } from '@/src/api/envelope';
import type { LoginData, RegisterRequest } from '@/src/types/auth';

type AuthContextValue = {
  session: SessionState;
  restore: () => Promise<void>;
  login: (payload: { emailOrUsername: string; password: string }) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<SessionState>({ status: 'unknown', tokens: null });

  const restore = useCallback(async () => {
    setSessionState({ status: 'unknown', tokens: null });
    const next = await bootstrapSession();
    setSessionState(next);
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    return subscribeToSessionExpired(() => {
      setSessionState({ status: 'unauthenticated', tokens: null });
    });
  }, []);

  const login = useCallback(async (payload: { emailOrUsername: string; password: string }) => {
    // Backend: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
    const res = await request<ApiEnvelope<LoginData>>('POST', '/auth/login', {
      auth: false,
      body: { email: payload.emailOrUsername.trim(), password: payload.password },
    });
    const tokens: AuthTokens | null =
      res?.data?.tokens?.accessToken && res?.data?.tokens?.refreshToken
        ? { accessToken: res.data.tokens.accessToken, refreshToken: res.data.tokens.refreshToken }
        : null;
    if (!tokens) throw { status: 0, message: 'We could not sign you in. Please try again.' };
    await setSession(tokens);
    setSessionState({ status: 'authenticated', tokens });
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    // Backend: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
    const res = await request<ApiEnvelope<LoginData>>('POST', '/auth/register', {
      auth: false,
      body: {
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
        phone_number: payload.phone_number?.trim() || undefined,
        language_preference: payload.language_preference?.trim() || undefined,
      },
    });

    const tokens: AuthTokens | null =
      res?.data?.tokens?.accessToken && res?.data?.tokens?.refreshToken
        ? { accessToken: res.data.tokens.accessToken, refreshToken: res.data.tokens.refreshToken }
        : null;
    if (!tokens) throw { status: 0, message: 'We could not create your account. Please try again.' };
    await setSession(tokens);
    setSessionState({ status: 'authenticated', tokens });
  }, []);

  const logout = useCallback(async () => {
    try {
      await request('POST', '/auth/logout', { auth: true });
    } catch {
      // ignore server errors on logout; we still clear locally
    }
    await clearSession();
    setSessionState({ status: 'unauthenticated', tokens: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      restore,
      login,
      register,
      logout,
    }),
    [session, restore, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

