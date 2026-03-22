'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CheckCircle2, Circle, Trash2, CalendarDays, Sparkles } from 'lucide-react';

const DAYS_OF_WEEK = [
  { label: 'Monday', short: 'M' },
  { label: 'Tuesday', short: 'T' },
  { label: 'Wednesday', short: 'W' },
  { label: 'Thursday', short: 'T' },
  { label: 'Friday', short: 'F' },
  { label: 'Saturday', short: 'S' },
  { label: 'Sunday', short: 'S' },
];

// Maps JS getDay() (0=Sun) to label
const DAY_INDEX_MAP: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday', 0: 'Sunday',
};

export function GoalsList({ weekId }: { weekId: string }) {
  const [text, setText] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | undefined>();

  const week = useStore((state) => state.weeks[weekId]);
  const addGoal = useStore((state) => state.addGoal);
  const toggleGoal = useStore((state) => state.toggleGoal);
  const removeGoal = useStore((state) => state.removeGoal);

  if (!week) return null;

  const todayLabel = DAY_INDEX_MAP[new Date().getDay()];
  const completedGoals = week.goals.filter((g) => g.completed).length;
  const totalGoals = week.goals.length;
  const allDone = totalGoals > 0 && completedGoals === totalGoals;
  const progress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      e.preventDefault();
      addGoal(weekId, text.trim(), selectedDay);
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

  const renderGoals = (goals: typeof week.goals, isToday: boolean) =>
    goals.map((goal) => (
      <div
        key={goal.id}
        className={`flex items-start gap-3 p-2 rounded-md group transition-colors ${
          isToday ? 'hover:bg-primary/5' : 'hover:bg-muted/50'
        }`}
      >
        <button
          onClick={() => toggleGoal(weekId, goal.id)}
          className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none shrink-0"
        >
          {goal.completed ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className={`w-5 h-5 ${isToday ? 'text-primary/50' : ''}`} />
          )}
        </button>
        <span
          className={`text-sm flex-1 ${
            goal.completed
              ? 'text-muted-foreground line-through'
              : isToday
              ? 'text-foreground font-medium'
              : 'text-foreground'
          }`}
        >
          {renderTextWithTags(goal.text)}
        </span>
        <button
          onClick={() => removeGoal(weekId, goal.id)}
          className="mt-0.5 text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
          title="Delete goal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ));

  return (
    <div className="flex flex-col gap-5 bg-background border border-border rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.04)]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Goals for the Week</h2>
          {totalGoals > 0 && (
            <span className="text-xs font-mono text-muted-foreground">{completedGoals}/{totalGoals}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Add items using Enter. Use #tags for inline categorization.
        </p>

        {/* Progress bar */}
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

      {/* Input & Day Selector */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
        <input
          type="text"
          placeholder="Add goal... (Press Enter)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors shadow-sm"
        />
        <div className="flex items-center gap-1.5 justify-between px-1">
          <div className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground mr-1" />
            {DAYS_OF_WEEK.map((day, idx) => {
              const isToday = day.label === todayLabel;
              const isSelected = selectedDay === day.label;
              return (
                <button
                  key={`${day.label}-${idx}`}
                  onClick={() => setSelectedDay(selectedDay === day.label ? undefined : day.label)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-colors focus:outline-none
                    ${isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isToday
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                      : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground'
                    }`}
                  title={day.label}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
          {selectedDay && (
            <span className="text-[10px] font-medium text-primary uppercase tracking-wider">{selectedDay}</span>
          )}
        </div>
      </div>

      {/* Grouped Goals */}
      <div className="flex flex-col gap-6 mt-2">
        {DAYS_OF_WEEK.map((day) => {
          const dayGoals = week.goals.filter((g) => g.daySelected === day.label);
          if (dayGoals.length === 0) return null;
          const isToday = day.label === todayLabel;
          return (
            <div
              key={day.label}
              className={`flex flex-col gap-1.5 ${isToday ? 'pl-3 border-l-2 border-primary/50' : ''}`}
            >
              <h3 className={`text-[11px] font-bold uppercase tracking-wider pl-2 mb-1 ${
                isToday ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {isToday ? `${day.label} — Today` : day.label}
              </h3>
              {renderGoals(dayGoals, isToday)}
            </div>
          );
        })}

        {/* Unscheduled goals */}
        {week.goals.filter((g) => !g.daySelected).length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-2 mb-1">
              Anytime
            </h3>
            {renderGoals(week.goals.filter((g) => !g.daySelected), false)}
          </div>
        )}

        {week.goals.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground italic border border-dashed border-border/50 rounded-lg">
            No goals set for this week.
          </div>
        )}
      </div>
    </div>
  );
}
