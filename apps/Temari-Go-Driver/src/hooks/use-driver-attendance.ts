import { useCallback, useEffect, useMemo, useState } from 'react';

import { getBusAttendance, getDriverAbsences } from '@/api/attendance';
import { getMyJobs } from '@/api/driver';
import type { AttendanceSummary, AttendanceStudent, DriverAbsence } from '@/types/attendance';

export function useDriverAttendance(search: string) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [busId, setBusId] = useState<number | null>(null);
  const [absences, setAbsences] = useState<DriverAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const jobs = await getMyJobs('active');
      const inferredBus = jobs[0]?.bus_id ?? null;
      setBusId(inferredBus);
      if (!inferredBus) {
        setSummary(null);
        setAbsences([]);
        return;
      }
      const [nextSummary, nextAbsences] = await Promise.all([
        getBusAttendance(inferredBus),
        getDriverAbsences(),
      ]);
      setSummary(nextSummary);
      setAbsences(nextAbsences);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredStudents = useMemo<AttendanceStudent[]>(
    () =>
      (summary?.expectedStudents ?? []).filter((student) =>
        `${student.full_name} ${student.id}`.toLowerCase().includes(search.toLowerCase())
      ),
    [search, summary?.expectedStudents]
  );

  return { summary, busId, absences, loading, error, filteredStudents, load };
}
