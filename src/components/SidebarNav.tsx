'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { getCurrentWeekId } from '@/utils/helpers';

const DAY_MAP: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday', 0: 'Sunday',
};

export function SidebarNav() {
  const pathname = usePathname();
  const weeks = useStore((state) => state.weeks);
  const [weekId, setWeekId] = useState<string | null>(null);

  useEffect(() => {
    setWeekId(getCurrentWeekId());
  }, []);

  const currentWeek = weekId ? weeks[weekId] : null;
  const todayLabel = DAY_MAP[new Date().getDay()];

  const totalGoals = currentWeek?.goals.length ?? 0;
  const completedGoals = currentWeek?.goals.filter(g => g.completed).length ?? 0;
  const totalInsights = currentWeek?.learnings.length ?? 0;

  const dueTodayCount = currentWeek?.goals.filter(
    g => g.daySelected === todayLabel && !g.completed
  ).length ?? 0;

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
        EVOLUTION
      </span>
      <Link href="/year-review" className={getLinkClass('/year-review')}>
        Year in Curiosity
      </Link>
    </div>
  );
}
