'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getCurrentWeekId, getCurrentWeekStartDate } from '@/utils/helpers';
import { GoalsList } from '@/components/GoalsList';
import { LearningStream } from '@/components/LearningStream';
import { WeeklyReflection } from '@/components/WeeklyReflection';

export default function ThisWeekPage() {
  const [weekId, setWeekId] = useState<string | null>(null);
  const initializeWeek = useStore((state) => state.initializeWeek);

  useEffect(() => {
    // Ensures hydration matches and time gets generated client-side
    const currentId = getCurrentWeekId();
    const startDate = getCurrentWeekStartDate();
    
    initializeWeek(currentId, startDate);
    setWeekId(currentId);
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
        <h1 className="text-2xl font-semibold tracking-tight">This Week</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">ID: {weekId}</p>
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
