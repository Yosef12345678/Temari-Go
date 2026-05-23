/** East Africa Time (GMT+3), e.g. Nairobi. */
const TIME_ZONE = 'Africa/Nairobi';

export const ALCOHOL_CHECK_SCHEDULE_LABEL =
  'Breath tests are only available 06:00–07:00 and 15:00–16:00 East Africa Time.';

function getEatHourMinute(date: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { hour, minute };
}

/** Morning 06:00–07:00 and afternoon 15:00–16:00 in East Africa Time. */
export function isWithinAlcoholCheckSchedule(date: Date = new Date()): boolean {
  const { hour, minute } = getEatHourMinute(date);
  const minutesOfDay = hour * 60 + minute;
  const inMorning = minutesOfDay >= 6 * 60 && minutesOfDay < 7 * 60;
  const inAfternoon = minutesOfDay >= 15 * 60 && minutesOfDay < 16 * 60;
  return inMorning || inAfternoon;
}

export function alcoholCheckScheduleMeta(date: Date = new Date()) {
  return {
    schedule_active: isWithinAlcoholCheckSchedule(date),
    schedule_label: ALCOHOL_CHECK_SCHEDULE_LABEL,
  };
}
