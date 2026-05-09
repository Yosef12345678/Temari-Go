import { useCallback, useEffect, useState } from 'react';

import { getMyJobs } from '@/api/driver';
import type { DriverJob } from '@/types/driver';

export function useActiveDriverJob() {
  const [job, setJob] = useState<DriverJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const jobs = await getMyJobs('active');
      const nextJob = jobs[0] ?? null;
      setJob(nextJob);
      return nextJob;
    } catch (e: any) {
      setError(e?.message ?? 'Unable to load active route.');
      setJob(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { job, loading, error, refresh, setJob };
}
