'use client';

import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, subDays, getDay, startOfWeek } from 'date-fns';
import { ExamPeriod } from '@/types';

interface Props {
  periods: ExamPeriod[];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Color intensity steps (warm purple ramp)
const LEVEL_COLORS = [
  'var(--border)',           // 0 hours
  '#e8ddf2',                // <1 hour
  '#c9b4e0',                // 1-2 hours
  '#9b7ec5',                // 2-4 hours
  '#6b4c9a',                // 4+ hours
];

function getLevel(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 60) return 1;
  if (minutes < 120) return 2;
  if (minutes < 240) return 3;
  return 4;
}

export function StudyHeatmap({ periods }: Props) {
  // Build a map of date → total study minutes across all periods
  const heatData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of periods) {
      for (const slot of p.slots) {
        if (slot.activity === 'break') continue;
        if (!slot.completed) continue; // only count completed sessions
        const mins = slot.actualMinutesSpent != null
          ? slot.actualMinutesSpent
          : (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime));
        map[slot.date] = (map[slot.date] || 0) + mins;
      }
    }
    return map;
  }, [periods]);

  // Build calendar grid: last 90 days → today
  const today = new Date();
  const startDate = subDays(today, 89);
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  // Group into weeks (columns), starting from Monday
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Pad the first week with null if it doesn't start on Monday
    const firstDayOfWeek = getDay(allDays[0]);
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < mondayOffset; i++) {
      currentWeek.push(null);
    }

    for (const day of allDays) {
      const dow = getDay(day);
      const mondayIdx = dow === 0 ? 6 : dow - 1;

      if (mondayIdx === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [allDays]);

  const CELL = 13;
  const GAP = 3;

  // Totals
  const totalStudyDays = Object.values(heatData).filter((m) => m > 0).length;
  const totalMins = Object.values(heatData).reduce((a, b) => a + b, 0);
  const totalHours = Math.floor(totalMins / 60);

  // Current streak
  const streak = useMemo(() => {
    let count = 0;
    let cursor = today;
    while (true) {
      const ds = format(cursor, 'yyyy-MM-dd');
      if ((heatData[ds] || 0) > 0) {
        count++;
        cursor = subDays(cursor, 1);
      } else {
        break;
      }
    }
    return count;
  }, [heatData, today]);

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  return (
    <div className="flex flex-col gap-3">
      {/* Summary stats */}
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-2xl font-bold font-mono tracking-tight">{totalHours}h</p>
          <p className="text-[10px] text-muted-foreground font-mono">total study</p>
        </div>
        <div>
          <p className="text-2xl font-bold font-mono tracking-tight">{totalStudyDays}</p>
          <p className="text-[10px] text-muted-foreground font-mono">active days</p>
        </div>
        <div>
          <p className="text-2xl font-bold font-mono tracking-tight">{streak}</p>
          <p className="text-[10px] text-muted-foreground font-mono">day streak</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 pr-1.5 shrink-0" style={{ marginTop: CELL + GAP + 2 }}>
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="text-[8px] font-mono text-muted-foreground/60 flex items-center"
                style={{ height: CELL }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-0.5">
            {/* Month labels */}
            <div className="flex gap-0.5" style={{ height: CELL }}>
              {weeks.map((week, wi) => {
                // Show month label on the first week that starts in a new month
                const firstDay = week.find((d) => d !== null);
                const prevWeek = weeks[wi - 1];
                const prevDay = prevWeek?.findLast((d) => d !== null);
                const showLabel = firstDay && (!prevDay || format(firstDay, 'MMM') !== format(prevDay, 'MMM'));
                return (
                  <div
                    key={wi}
                    className="text-[8px] font-mono text-muted-foreground/60 flex items-end"
                    style={{ width: CELL }}
                  >
                    {showLabel ? format(firstDay!, 'MMM') : ''}
                  </div>
                );
              })}
            </div>

            {/* Grid rows (one per day of week) */}
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <div key={dayIdx} className="flex gap-0.5">
                {weeks.map((week, wi) => {
                  const day = dayIdx < week.length ? week[dayIdx] : null;
                  if (!day) {
                    return (
                      <div key={wi} style={{ width: CELL, height: CELL }} />
                    );
                  }
                  const ds = format(day, 'yyyy-MM-dd');
                  const mins = heatData[ds] || 0;
                  const level = getLevel(mins);
                  const isToday = ds === format(today, 'yyyy-MM-dd');

                  return (
                    <div
                      key={wi}
                      className="rounded-[2px] transition-colors"
                      style={{
                        width: CELL,
                        height: CELL,
                        backgroundColor: LEVEL_COLORS[level],
                        outline: isToday ? '2px solid var(--primary)' : undefined,
                        outlineOffset: isToday ? '-1px' : undefined,
                      }}
                      title={`${format(day, 'EEE, MMM d')}: ${Math.floor(mins / 60)}h ${mins % 60}m`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono">
        <span>Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: CELL, height: CELL, backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
