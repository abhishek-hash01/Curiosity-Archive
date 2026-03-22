'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { getCurrentWeekId, getCurrentWeekStartDate, getRealCurrentWeekId, getRealCurrentWeekStartDate } from '@/utils/helpers';
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
  const day = new Date().getDay();
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
  const [weekId, setWeekId] = useState<string | null>(null);           // planning week (next week on Sundays)
  const [reflectionWeekId, setReflectionWeekId] = useState<string | null>(null); // real current week
  const [isSunday, setIsSunday] = useState(false);
  const [weekRange, setWeekRange] = useState('');
  const [greeting, setGreeting] = useState('');
  const [daysLeft, setDaysLeft] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  const initializeWeek = useStore((state) => state.initializeWeek);
  const updateWeekTitle = useStore((state) => state.updateWeekTitle);
  const week = useStore((state) => weekId ? state.weeks[weekId] : null);

  useEffect(() => {
    const currentId = getCurrentWeekId();
    const startDate = getCurrentWeekStartDate();
    const realId = getRealCurrentWeekId();
    const realStart = getRealCurrentWeekStartDate();
    initializeWeek(currentId, startDate);
    // Also ensure real current week exists (for reflection/insights on Sundays)
    if (realId !== currentId) initializeWeek(realId, realStart);
    setWeekId(currentId);
    setReflectionWeekId(realId);
    setIsSunday(new Date().getDay() === 0);
    setGreeting(getGreeting());
    setDaysLeft(getDaysLeftLabel());
    setWeekRange(getWeekRange(startDate));
  }, [initializeWeek]);

  // Sync title input when week loads
  useEffect(() => {
    if (week?.weekTitle !== undefined) {
      setTitleInput(week.weekTitle);
    }
  }, [week?.weekTitle]);

  const handleTitleBlur = () => {
    if (weekId) updateWeekTitle(weekId, titleInput.trim());
  };

  if (!weekId) {
    return (
      <div className="flex p-8 items-center justify-center min-h-full">
        <div className="animate-pulse text-muted-foreground">Loading archive...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-8 py-5 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono text-muted-foreground">{greeting} —</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isSunday ? 'Next Week' : 'This Week'}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">{weekRange}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 mt-1">
            <span className="text-sm font-medium text-primary font-mono">{daysLeft}</span>
            {/* Editable week title / theme */}
            <input
              ref={titleRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') titleRef.current?.blur(); }}
              placeholder={isSunday ? 'Name next week…' : 'Name this week…'}
              className="text-xs font-mono text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary/50 focus:outline-none transition-colors text-primary placeholder:text-muted-foreground/40 w-44"
            />
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
            <WeeklyReflection weekId={reflectionWeekId ?? weekId ?? ''} />
          </div>
        </div>

        {/* Right Column: Learnings */}
        <div className="lg:col-span-3 h-full mb-[50vh]">
          <LearningStream weekId={reflectionWeekId ?? weekId ?? ''} />
        </div>
      </div>
    </div>
  );
}
