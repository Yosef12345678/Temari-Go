import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginApi, logout as logoutApi } from '@/api/auth';
import { setSessionExpiredHandler } from '@/api/sessionExpired';
import { unwrapData } from '@/api/envelope';
import type { LoginRequest } from '@/types/auth';
import { bootstrapSession, clearSession, setSession, type SessionState } from '@/storage/session';

type SessionContextValue = SessionState & {
  bootstrapComplete: boolean;
  signIn: (body: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'unknown', tokens: null });
  const [bootstrapComplete, setBootstrapComplete] = useState(false);

  useEffect(() => {
    bootstrapSession()
      .then((next) => setState(next))
      .finally(() => setBootstrapComplete(true));
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await clearSession();
      setState({ status: 'unauthenticated', tokens: null });
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const signIn = useCallback(async (body: LoginRequest) => {
    const response = await loginApi(body);
    const payload = unwrapData(response);
    await setSession(payload.tokens);
    setState({ status: 'authenticated', tokens: payload.tokens });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      await clearSession();
      setState({ status: 'unauthenticated', tokens: null });
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, bootstrapComplete, signIn, signOut }),
    [bootstrapComplete, signIn, signOut, state]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider.');
  }
  return context;
}
