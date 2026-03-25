'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CheckCircle2, Circle, Trash2, CalendarDays, Sparkles, ChevronLeft, ChevronRight, ArrowRightToLine, ArchiveRestore } from 'lucide-react';

const DAYS_OF_WEEK = [
  { label: 'Monday', short: 'M' },
  { label: 'Tuesday', short: 'T' },
  { label: 'Wednesday', short: 'W' },
  { label: 'Thursday', short: 'T' },
  { label: 'Friday', short: 'F' },
  { label: 'Saturday', short: 'S' },
];

const DAY_INDEX_MAP: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday',
  0: 'Monday', // On Sundays, default to Monday (first day of week being planned)
};

export function GoalsList({ weekId }: { weekId: string }) {
  const todayLabel = DAY_INDEX_MAP[new Date().getDay()];
  const [viewDay, setViewDay] = useState<string>(todayLabel);
  const [text, setText] = useState('');

  const week = useStore((state) => state.weeks[weekId]);
  const addGoal = useStore((state) => state.addGoal);
  const toggleGoal = useStore((state) => state.toggleGoal);
  const removeGoal = useStore((state) => state.removeGoal);
  const setGoalDay = useStore((state) => state.setGoalDay);

  if (!week) return null;

  const completedGoals = week.goals.filter((g) => g.completed).length;
  const totalGoals = week.goals.length;
  const allDone = totalGoals > 0 && completedGoals === totalGoals;
  const progress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Goals visible for the current view day + anytime goals
  const dayGoals = week.goals.filter((g) => g.daySelected === viewDay);
  const anytimeGoals = week.goals.filter((g) => !g.daySelected || g.daySelected === 'Sunday');

  // Day navigator
  const dayIdx = DAYS_OF_WEEK.findIndex((d) => d.label === viewDay);
  const prevDay = DAYS_OF_WEEK[(dayIdx - 1 + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length].label;
  const nextDay = DAYS_OF_WEEK[(dayIdx + 1) % DAYS_OF_WEEK.length].label;

  // Dot indicator: does a given day have any goals?
  const hasDayGoals = (label: string) => week.goals.some((g) => g.daySelected === label);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      e.preventDefault();
      // Add to current view day (not "Anytime") since user is looking at that day
      addGoal(weekId, text.trim(), viewDay);
      setText('');
    }
  };

  const renderTextWithTags = (content: string) => {
    const parts = content.split(/(#[\w-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded-sm">
            {part.toLowerCase()}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const postponeToNextDay = (goalId: string, currentDayLabel: string) => {
    const idx = DAYS_OF_WEEK.findIndex(d => d.label === currentDayLabel);
    if (idx === -1) return;
    // If it's Saturday (last day), we probably just want to move it to Anytime instead of wrapping to Monday
    if (idx === DAYS_OF_WEEK.length - 1) {
      setGoalDay(weekId, goalId, undefined);
    } else {
      const tomorrow = DAYS_OF_WEEK[idx + 1].label;
      setGoalDay(weekId, goalId, tomorrow);
    }
  };

  const moveToAnytime = (goalId: string) => {
    setGoalDay(weekId, goalId, undefined);
  };

  const renderGoals = (goals: typeof week.goals, isToday: boolean, isAnytimeList = false) =>
    goals.map((goal) => (
      <div
        key={goal.id}
        className={`flex items-start gap-3 p-2 rounded-md group transition-colors ${isToday ? 'hover:bg-primary/5' : 'hover:bg-muted/50'}`}
      >
        <button
          onClick={() => toggleGoal(weekId, goal.id)}
          className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none shrink-0"
        >
          {goal.completed
            ? <CheckCircle2 className="w-5 h-5 text-primary" />
            : <Circle className={`w-5 h-5 ${isToday ? 'text-primary/50' : ''}`} />}
        </button>
        <span className={`text-sm flex-1 ${goal.completed ? 'text-muted-foreground line-through' : isToday ? 'text-foreground font-medium' : 'text-foreground'}`}>
          {renderTextWithTags(goal.text)}
        </span>
        
        {/* Actions fade in on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          {!goal.completed && !isAnytimeList && goal.daySelected && (
            <>
              <button
                onClick={() => postponeToNextDay(goal.id, goal.daySelected!)}
                className="p-1 mr-0.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded transition-colors focus:outline-none"
                title={goal.daySelected === 'Saturday' ? 'Move to Anytime (end of week)' : 'Postpone to tomorrow'}
              >
                <ArrowRightToLine className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveToAnytime(goal.id)}
                className="p-1 mr-0.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded transition-colors focus:outline-none"
                title="Move to Anytime (Backlog)"
              >
                <ArchiveRestore className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => removeGoal(weekId, goal.id)}
            className="p-1 text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors focus:outline-none"
            title="Delete goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ));

  return (
    <div className="flex flex-col gap-4 bg-background border border-border rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.04)]">

      {/* Header + progress */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Goals for the Week</h2>
          {totalGoals > 0 && (
            <span className="text-xs font-mono text-muted-foreground">{completedGoals}/{totalGoals}</span>
          )}
        </div>
        {totalGoals > 0 && (
          <div className="w-full bg-border/60 rounded-full h-1 mt-3 overflow-hidden">
            <div
              className="bg-primary rounded-full h-1 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* All-done celebration */}
      {allDone && (
         <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/5 border border-primary/20 rounded-lg text-sm font-medium text-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-4 h-4" />
          All done — great week!
        </div>
      )}

      {/* ── Day Navigator ── */}
      <div className="flex items-center justify-between px-1 py-1 bg-muted/30 rounded-xl border border-border/50">
        <button
          onClick={() => setViewDay(prevDay)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={prevDay}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Day pills strip */}
        <div className="flex items-center gap-0.5">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = day.label === viewDay;
            const isToday = day.label === todayLabel;
            const hasDots = hasDayGoals(day.label);
            return (
              <button
                key={day.label}
                onClick={() => setViewDay(day.label)}
                title={day.label}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors focus:outline-none"
                style={{
                  background: isSelected ? 'var(--primary)' : isToday ? 'var(--purple-soft)' : 'transparent',
                  color: isSelected ? 'var(--primary-foreground)' : isToday ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                <span className="text-[11px] font-semibold">{day.short}</span>
                {/* dot if day has goals */}
                <span
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: hasDots
                      ? (isSelected ? 'rgba(255,255,255,0.7)' : 'var(--primary)')
                      : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setViewDay(nextDay)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={nextDay}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selected day label */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          {viewDay}{viewDay === todayLabel ? ' — Today' : ''}
        </span>
        {dayGoals.length === 0 && (
          <span className="text-[10px] text-muted-foreground font-mono italic">nothing scheduled</span>
        )}
      </div>

      {/* Input — pre-filled to current view day */}
      <div className="flex flex-col gap-2 pb-3 border-b border-border/50">
        <input
          type="text"
          placeholder={`Add to ${viewDay}… (Enter)`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors shadow-sm"
        />
        {/* Tiny nudge to reassign to Anytime */}
        <div className="flex items-center gap-1.5 px-1">
          <CalendarDays className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-mono">
            Adding to <span className="text-primary">{viewDay}</span> — or click another day first
          </span>
        </div>
      </div>

      {/* Goals for selected day */}
      <div className="flex flex-col gap-1">
        {dayGoals.length > 0
          ? renderGoals(dayGoals, viewDay === todayLabel, false)
          : (
            <div className="py-3 text-center text-xs text-muted-foreground italic border border-dashed border-border/40 rounded-lg">
              No goals for {viewDay} yet.
            </div>
          )}
      </div>

      {/* Anytime goals — always shown */}
      {anytimeGoals.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-3 border-t border-border/40">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-2">
            Anytime
          </h3>
          {renderGoals(anytimeGoals, false, true)}
        </div>
      )}
    </div>
  );
}
