import { useCallback, useEffect, useState } from 'react';

import { getMe } from '@/api/driver';
import type { UserMe } from '@/types/user';

export function useDriverProfile() {
  const [profile, setProfile] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getMe());
    } catch (e: any) {
      setError(e?.message ?? 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, loading, error, load };
}
