import cron from 'node-cron';
import { RouteRunService } from '../services/routeRun.service';
import { db } from '../../models';
import { QueryTypes } from 'sequelize';

/**
 * Schedule automatic creation of route runs for the next school day.
 *
 * Design:
 * - Runs daily at 01:00 UTC (well after midnight).
 * - Creates a RouteRun for each active Route that has at least one student assignment.
 * - Skips routes that already have a run for the target date.
 *
 * Target date logic:
 * - If today is Friday, target Monday (skip weekend).
 * - Otherwise, target tomorrow.
 * - Holiday logic can be added later via a school calendar table.
 */
export function startRouteRunScheduler(): void {
  // Cron: minute hour day-of-month month day-of-week
  // '0 1 * * *' => 01:00 every day (UTC)
  const cronExpression = '0 1 * * *';

  cron.schedule(
    cronExpression,
    async () => {
      // Prevent duplicate work when running multiple backend instances.
      const LOCK_KEY = 910_000_002;
      const [{ acquired }] = (await (db as any).sequelize.query(
        'SELECT pg_try_advisory_lock(:key) AS acquired',
        {
          replacements: { key: LOCK_KEY },
          type: QueryTypes.SELECT,
        }
      )) as Array<{ acquired: boolean }>;

      if (!acquired) {
        console.log('[Scheduler] Route run creation job already running on another instance. Skipping.');
        return;
      }

      try {
        const tomorrow = getNextSchoolDay(new Date());
        const targetDate = tomorrow.toISOString().slice(0, 10);

        console.log(`[Scheduler] Auto-creating route runs for ${targetDate}...`);

        const result = await RouteRunService.autoCreateRunsForDate(targetDate);

        console.log(
          `[Scheduler] Route runs created: ${result.created}, skipped: ${result.skipped}${
            result.errors.length ? `, errors: ${result.errors.length}` : ''
          }`
        );

        if (result.errors.length) {
          console.error('[Scheduler] Route run creation errors:', result.errors);
        }
      } catch (error) {
        console.error('[Scheduler] Error auto-creating route runs:', error);
      } finally {
        try {
          await (db as any).sequelize.query('SELECT pg_advisory_unlock(:key)', {
            replacements: { key: LOCK_KEY },
            type: QueryTypes.SELECT,
          });
        } catch (e) {
          console.warn('[Scheduler] Failed to release advisory lock:', e);
        }
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  console.log(
    '[Scheduler] Route run auto-creation scheduler started. Will run daily at 01:00 (UTC).'
  );
}

/**
 * Get the next school day from a given date.
 * Skips Saturday and Sunday.
 */
function getNextSchoolDay(from: Date): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  const dayOfWeek = next.getDay();
  // Sunday = 0, Saturday = 6
  if (dayOfWeek === 0) {
    next.setDate(next.getDate() + 1); // Skip to Monday
  } else if (dayOfWeek === 6) {
    next.setDate(next.getDate() + 2); // Skip to Monday
  }
  return next;
}
