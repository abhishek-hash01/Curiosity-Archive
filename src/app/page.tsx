'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getCurrentWeekId, getCurrentWeekStartDate } from '@/utils/helpers';
import { GoalsList } from '@/components/GoalsList';
import { LearningStream } from '@/components/LearningStream';
import { WeeklyReflection } from '@/components/WeeklyReflection';
import { format, parseISO, addDays } from 'date-fns';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDaysLeftLabel(): string {
  const day = new Date().getDay(); // 0 = Sunday
  if (day === 0) return 'Last day of the week';
  const daysLeft = 7 - day;
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

function getWeekRange(startDate: string): string {
  const start = parseISO(startDate);
  const end = addDays(start, 6);
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export default function ThisWeekPage() {
  const [weekId, setWeekId] = useState<string | null>(null);
  const [isSunday, setIsSunday] = useState(false);
  const [weekRange, setWeekRange] = useState('');
  const [greeting, setGreeting] = useState('');
  const [daysLeft, setDaysLeft] = useState('');
  const initializeWeek = useStore((state) => state.initializeWeek);

  useEffect(() => {
    const currentId = getCurrentWeekId();
    const startDate = getCurrentWeekStartDate();

    initializeWeek(currentId, startDate);
    setWeekId(currentId);
    setIsSunday(new Date().getDay() === 0);
    setGreeting(getGreeting());
    setDaysLeft(getDaysLeftLabel());
    setWeekRange(getWeekRange(startDate));
  }, [initializeWeek]);

  if (!weekId) {
    return (
      <div className="flex p-8 items-center justify-center min-h-full">
        <div className="animate-pulse text-muted-foreground">Loading archive...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-8 py-6 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">{greeting} —</p>
            <h1 className="text-2xl font-semibold tracking-tight">This Week</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">{weekRange}</p>
          </div>
          <div className="text-right shrink-0 mt-1">
            <span className="text-sm font-medium text-primary font-mono">{daysLeft}</span>
          </div>
        </div>
        {isSunday && (
          <div className="mt-3 flex items-center gap-3 bg-purpleSoft border border-primary/25 rounded-lg px-4 py-2.5">
            <span className="text-primary text-xs font-bold shrink-0">◆</span>
            <p className="text-xs text-primary/80">
              It&apos;s Sunday — anything you plan today goes straight into{' '}
              <span className="font-semibold text-primary">next week</span>.
            </p>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto w-full px-8 py-8 md:grid md:grid-cols-2 lg:grid-cols-5 gap-12">
        {/* Left Column: Goals & Reflection */}
        <div className="flex flex-col lg:col-span-2 space-y-10 h-full">
          <GoalsList weekId={weekId} />

          <div className="pt-6 border-t border-border/50">
            <WeeklyReflection weekId={weekId} />
          </div>
        </div>

        {/* Right Column: Learnings */}
        <div className="lg:col-span-3 h-full mb-[50vh]">
          <LearningStream weekId={weekId} />
        </div>
      </div>
    </div>
  );
}
