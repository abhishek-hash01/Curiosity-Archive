import { format, startOfWeek } from 'date-fns';

export function getCurrentWeekId(): string {
  // Format: yyyy-'W'II (e.g., 2024-W12)
  return format(new Date(), "yyyy-'W'II");
}

export function getCurrentWeekStartDate(): string {
  return startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
}

/**
 * Extracts tags from a string. E.g. "Hello #world" -> ["world"]
 */
export function extractTags(text: string): string[] {
  const matches = text.match(/#[\w-]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((t) => t.substring(1).toLowerCase())));
}
