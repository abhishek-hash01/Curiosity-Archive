'use client';

import { useStore } from '@/store/useStore';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';

export default function YearReviewPage() {
  const weeks = useStore((state) => state.weeks);

  // Compute the story of the year
  const stats = useMemo(() => {
    const weekArray = Object.values(weeks);
    
    // 1. Total insights & active weeks
    const activeWeeks = weekArray.length;
    let totalInsights = 0;
    
    // 2. Top topics (frequencies)
    const freqs = new Map<string, number>();
    
    // 3. Most active month
    const monthCounts = new Map<string, number>();
    
    // 4. Largest learning spike (week with most insights)
    let maxInsightsInAWeek = 0;
    let maxWeekLabel = '';

    weekArray.forEach(week => {
      const insightsCount = week.learnings.length;
      totalInsights += insightsCount;
      
      if (insightsCount > maxInsightsInAWeek) {
        maxInsightsInAWeek = insightsCount;
        maxWeekLabel = `Week of ${format(parseISO(week.startDate), "MMM d")}`;
      }

      const monthLabel = format(parseISO(week.startDate), "MMMM yyyy");
      monthCounts.set(monthLabel, (monthCounts.get(monthLabel) || 0) + insightsCount);

      week.learnings.forEach(learning => {
        learning.tags.forEach(tag => {
          freqs.set(tag, (freqs.get(tag) || 0) + 1);
        });
      });
    });

    const topTopics = Array.from(freqs.entries())
      .map(([name, count]) => ({ name: `#${name}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
      
    const topMonth = Array.from(monthCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      activeWeeks,
      totalInsights,
      topTopics,
      topMonth,
      maxWeekLabel,
      maxInsightsInAWeek
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

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-muted/5 selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-2xl mx-auto w-full px-8 py-24 flex flex-col gap-16 pb-[30vh]">
        
        {/* Header Title */}
        <div className="text-center flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="text-2xl font-bold text-primary-foreground tracking-tighter">
              {currentYear}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
            Year in Curiosity
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            A look back at the terrain of your thinking, the questions you asked, and the map you built.
          </p>
        </div>

        {/* Big Numbers */}
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-background border border-border shadow-sm">
            <span className="text-5xl font-bold tracking-tighter text-primary mb-2">{stats.totalInsights}</span>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Insights</span>
          </div>
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-background border border-border shadow-sm">
            <span className="text-5xl font-bold tracking-tighter mb-2">{stats.activeWeeks}</span>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Weeks</span>
          </div>
        </div>

        {/* Narrative Stats */}
        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
          
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
                <span className="text-muted-foreground italic">No topics tagged yet.</span>
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
