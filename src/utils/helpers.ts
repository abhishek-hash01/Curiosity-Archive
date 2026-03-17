import { format, startOfWeek, addDays } from 'date-fns';

/**
 * Returns the effective "current" date for week calculations.
 * If today is Sunday, we treat tomorrow (Monday) as the reference date
 * so that Sunday planning goes into the upcoming week.
 */
function getEffectiveDate(): Date {
  const now = new Date();
  // 0 = Sunday
  if (now.getDay() === 0) {
    return addDays(now, 1);
  }
  return now;
}

export function getCurrentWeekId(): string {
  // Format: yyyy-'W'II (e.g., 2024-W12)
  // On Sundays, look ahead to next week so planning goes into the right week.
  return format(getEffectiveDate(), "yyyy-'W'II");
}

export function getCurrentWeekStartDate(): string {
  return startOfWeek(getEffectiveDate(), { weekStartsOn: 1 }).toISOString();
}

/**
 * Extracts tags from a string. E.g. "Hello #world" -> ["world"]
 */
export function extractTags(text: string): string[] {
  const matches = text.match(/#[\w-]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((t) => t.substring(1).toLowerCase())));
}
