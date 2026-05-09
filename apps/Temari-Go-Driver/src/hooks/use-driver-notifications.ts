import { useCallback, useEffect, useMemo, useState } from 'react';

import { getNotifications, markNotificationRead } from '@/api/notifications';
import type { DriverNotification } from '@/types/notification';

export type NotificationFilter = 'all' | 'operational' | 'safety';

export function useDriverNotifications(filter: NotificationFilter) {
  const [items, setItems] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getNotifications());
    } catch (e: any) {
      setError(e?.message ?? 'Unable to load alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (item: DriverNotification) => {
    await markNotificationRead(item.id);
    await load();
  }, [load]);

  const filtered = useMemo(() => items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'safety') return ['alcohol_alert', 'speed_violation', 'critical_motion_alert', 'sos_alert'].includes(item.type);
    return ['attendance', 'attendance_issue', 'parent_absence', 'boarding', 'exiting', 'missed_bus'].some((key) => item.type.includes(key));
  }), [filter, items]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  return { items, filtered, unreadCount, loading, error, load, markRead };
}
