'use client';

import { useStore } from '@/store/useStore';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';

// ── Helpers ────────────────────────────────────────────────────────────────
function getWeekId(year: number, week: number): string {
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getHeatColor(count: number): string {
  if (count === 0) return 'var(--border)';
  if (count === 1) return '#d4c0f0';
  if (count <= 3) return '#a57de0';
  if (count <= 6) return '#8558c8';
  return 'var(--primary)';
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function YearReviewPage() {
  const weeks = useStore((state) => state.weeks);

  const stats = useMemo(() => {
    const weekArray = Object.values(weeks);
    const now = new Date();
    const currentYear = now.getFullYear();

    let totalInsights = 0;
    let totalGoals = 0;
    let totalGoalsDone = 0;
    const freqs = new Map<string, number>();
    const monthCounts = new Map<string, number>();
    let maxInsightsInAWeek = 0;
    let maxWeekLabel = '';

    weekArray.forEach(week => {
      const count = week.learnings.length;
      totalInsights += count;
      totalGoals += week.goals.length;
      totalGoalsDone += week.goals.filter(g => g.completed).length;

      if (count > maxInsightsInAWeek) {
        maxInsightsInAWeek = count;
        maxWeekLabel = `Week of ${format(parseISO(week.startDate), 'MMM d')}`;
      }

      const monthLabel = format(parseISO(week.startDate), 'MMMM yyyy');
      monthCounts.set(monthLabel, (monthCounts.get(monthLabel) || 0) + count);

      week.learnings.forEach(l => l.tags.forEach(tag => freqs.set(tag, (freqs.get(tag) || 0) + 1)));
    });

    const topTopics = Array.from(freqs.entries())
      .map(([name, count]) => ({ name: `#${name}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topMonth = Array.from(monthCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // ── Streak: count consecutive weeks with ≥1 insight ──
    // Sort newest→oldest, skip leading empty weeks (e.g. current week not yet started)
    const sorted = [...weekArray].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    // Find the first week that actually has data — skip empty leading weeks
    const firstActiveIdx = sorted.findIndex(w => w.learnings.length > 0);
    let streak = 0;
    let prevDate: Date | null = null;
    if (firstActiveIdx !== -1) {
      for (let i = firstActiveIdx; i < sorted.length; i++) {
        const week = sorted[i];
        if (week.learnings.length === 0) break; // gap — streak ends
        const weekDate = new Date(week.startDate);
        if (prevDate === null) {
          streak = 1;
          prevDate = weekDate;
        } else {
          const diffWeeks = Math.round((prevDate.getTime() - weekDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (diffWeeks === 1) { streak++; prevDate = weekDate; }
          else break;
        }
      }
    }

    // ── Heatmap: weeks 1–52 for current year ──
    // Get current ISO week number
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfWeek = startOfYear.getDay() || 7;
    const isoWeekStart = dayOfWeek <= 4 ? startOfYear : new Date(currentYear, 0, 1 + (8 - dayOfWeek));
    const currentWeekNum = Math.ceil(
      ((now.getTime() - isoWeekStart.getTime()) / 86400000 + 1) / 7
    );

    interface HeatCell { weekId: string; weekNum: number; count: number; isFuture: boolean; }
    const heatmap: HeatCell[] = [];
    for (let w = 1; w <= 52; w++) {
      const weekId = getWeekId(currentYear, w);
      const weekData = weeks[weekId];
      heatmap.push({
        weekId,
        weekNum: w,
        count: weekData?.learnings.length ?? 0,
        isFuture: w > currentWeekNum,
      });
    }

    // Group into quarters (13 weeks each)
    const quarters = [
      heatmap.slice(0, 13),
      heatmap.slice(13, 26),
      heatmap.slice(26, 39),
      heatmap.slice(39, 52),
    ];

    return {
      activeWeeks: weekArray.length,
      totalInsights,
      totalGoals,
      totalGoalsDone,
      topTopics,
      topMonth,
      maxWeekLabel,
      maxInsightsInAWeek,
      streak,
      quarters,
      currentYear,
    };
  }, [weeks]);

  if (stats.activeWeeks === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-muted/5">
        <h2 className="text-xl font-semibold mb-2">No history yet.</h2>
        <p className="text-muted-foreground text-sm">Fill out your timeline to generate a story.</p>
      </div>
    );
  }

  const completionRate = stats.totalGoals > 0
    ? Math.round((stats.totalGoalsDone / stats.totalGoals) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-muted/5 selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-2xl mx-auto w-full px-8 py-16 flex flex-col gap-14 pb-[20vh]">

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
            <span className="text-xl font-bold text-primary-foreground tracking-tighter">{stats.currentYear}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">Year in Curiosity</h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            A look back at the terrain of your thinking — the questions you asked, and the map you built.
          </p>
        </div>

        {/* Activity Heatmap */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Weekly Activity</span>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              <span>less</span>
              {['var(--border)', '#d4c0f0', '#a57de0', '#8558c8', 'var(--primary)'].map((c, i) => (
                <div key={i} style={{ background: c, width: 10, height: 10, borderRadius: 2 }} />
              ))}
              <span>more</span>
            </div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4 flex flex-col gap-2">
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q, qi) => (
              <div key={q} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">{q}</span>
                <div className="flex gap-1 flex-wrap">
                  {stats.quarters[qi].map(cell => (
                    <div
                      key={cell.weekId}
                      title={cell.isFuture ? `W${cell.weekNum} (ahead)` : `W${cell.weekNum} · ${cell.count} insight${cell.count !== 1 ? 's' : ''}`}
                      style={{
                        width: 14, height: 14,
                        borderRadius: 3,
                        background: cell.isFuture ? 'var(--muted)' : getHeatColor(cell.count),
                        opacity: cell.isFuture ? 0.3 : 1,
                        cursor: 'default',
                        transition: 'opacity 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Big Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          {[
            { value: stats.totalInsights, label: 'Insights' },
            { value: stats.activeWeeks, label: 'Active Weeks' },
            { value: stats.streak, label: 'Week Streak 🔥' },
            { value: `${completionRate}%`, label: 'Goal Rate' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-background border border-border shadow-sm gap-1">
              <span className="text-4xl font-bold tracking-tighter text-primary">{value}</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest text-center">{label}</span>
            </div>
          ))}
        </div>

        {/* Narrative Stats */}
        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">

          <div className="flex flex-col items-center text-center gap-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Core Focus</span>
            <div className="flex flex-col gap-2">
              {stats.topTopics.map((topic, i) => (
                <div key={topic.name} className="flex items-center gap-3 text-2xl md:text-3xl font-semibold tracking-tight">
                  <span className="text-primary/40 font-mono text-sm w-4">{i + 1}.</span>
                  <span className="text-foreground">{topic.name}</span>
                </div>
              ))}
              {stats.topTopics.length === 0 && (
                <span className="text-muted-foreground italic text-sm">No topics tagged yet.</span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col items-center text-center gap-2 p-8 rounded-2xl bg-primary/5 border border-primary/10">
              <span className="text-xs font-bold text-primary border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-widest mb-2">Peak Activity</span>
              <span className="text-2xl font-bold tracking-tight">{stats.topMonth}</span>
              <span className="text-sm text-muted-foreground">Highest volume of insights recorded.</span>
            </div>
            <div className="flex-1 flex flex-col items-center text-center gap-2 p-8 rounded-2xl bg-background border border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Largest Spike</span>
              <span className="text-2xl font-bold tracking-tight">{stats.maxWeekLabel || 'N/A'}</span>
              <span className="text-sm text-muted-foreground">{stats.maxInsightsInAWeek} insights in one week.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
