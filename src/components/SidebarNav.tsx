'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { getCurrentWeekId, getRealCurrentWeekId } from '@/utils/helpers';
import { GraduationCap } from 'lucide-react';

const DAY_MAP: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday',
  0: 'Monday', // Sunday → treat as Monday (planning for next week)
};

export function SidebarNav() {
  const pathname = usePathname();
  const weeks = useStore((state) => state.weeks);
  const examPeriods = useStore((state) => state.examPeriods);

  const [weekId, setWeekId] = useState<string | null>(null);
  const [realWeekId, setRealWeekId] = useState<string | null>(null);
  const [todayDate, setTodayDate] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>('Monday');

  // Defer all store-derived UI until after client mount so the server's
  // initial empty-store render matches the first client render during hydration.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWeekId(getCurrentWeekId());
    setRealWeekId(getRealCurrentWeekId());
    setTodayLabel(DAY_MAP[new Date().getDay()]);
    setTodayDate(
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
    setMounted(true);
  }, []);

  // Safe to read only after mount — Zustand's persist rehydrates from
  // localStorage synchronously on the client before the first render,
  // but the server has no localStorage, so values would differ.
  const currentWeek = mounted && weekId ? weeks[weekId] : null;
  const realCurrentWeek = mounted && realWeekId ? weeks[realWeekId] : null;

  const totalGoals = currentWeek?.goals.length ?? 0;
  const completedGoals = currentWeek?.goals.filter(g => g.completed).length ?? 0;
  const totalInsights = (realCurrentWeek ?? currentWeek)?.learnings.length ?? 0;
  const dueTodayCount = currentWeek?.goals.filter(
    g => g.daySelected === todayLabel && !g.completed
  ).length ?? 0;

  const activeExamPeriod = mounted
    ? Object.values(examPeriods).find((p) => {
        const now = new Date();
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        end.setHours(23, 59, 59);
        return now >= start && now <= end;
      }) ?? null
    : null;

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `px-3 py-2 text-sm font-medium rounded-md transition-colors w-full text-left flex items-center gap-2 ${
      isActive
        ? 'bg-primary/10 text-primary !font-semibold'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;
  };

  return (
    <div className="flex md:flex-col gap-1 items-start w-full">

      {/* Today's date — locale-sensitive, only rendered after mount */}
      {todayDate && (
        <div className="w-full px-3 pb-2 hidden md:block">
          <span className="text-[11px] font-mono text-muted-foreground/70 tracking-wide">
            {todayDate}
          </span>
        </div>
      )}

      {/* This Week + inline quick stats */}
      <div className="w-full">
        <Link href="/" className={getLinkClass('/')}>
          This Week
        </Link>
        {currentWeek && (
          <div className="px-3 pb-1 flex flex-col gap-0.5 hidden md:flex">
            <span className="text-[10px] font-mono text-muted-foreground">
              {completedGoals}/{totalGoals} goals · {totalInsights} insight{totalInsights !== 1 ? 's' : ''}
            </span>
            {dueTodayCount > 0 && (
              <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {dueTodayCount} due today
              </span>
            )}
          </div>
        )}
      </div>

      <Link href="/timeline" className={getLinkClass('/timeline')}>
        Timeline
      </Link>
      <Link href="/insights" className={getLinkClass('/insights')}>
        Insights Map
      </Link>

      <div className="h-4 hidden md:block" />
      <span className="text-xs text-muted-foreground font-mono px-3 mb-1 hidden md:block mt-2 tracking-widest">
        FOCUS
      </span>
      <div className="w-full">
        <Link href="/exam" className={getLinkClass('/exam')}>
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          Exam Mode
          {activeExamPeriod && (
            <span className="ml-auto text-[9px] font-mono text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              active
            </span>
          )}
        </Link>
        {activeExamPeriod && (
          <div className="px-3 pb-1 hidden md:block">
            <span className="text-[10px] font-mono text-muted-foreground truncate block">
              {activeExamPeriod.title}
            </span>
          </div>
        )}
      </div>

      <div className="h-4 hidden md:block" />
      <span className="text-xs text-muted-foreground font-mono px-3 mb-1 hidden md:block mt-2 tracking-widest">
        EVOLUTION
      </span>
      <Link href="/year-review" className={getLinkClass('/year-review')}>
        Year in Curiosity
      </Link>
    </div>
  );
}
