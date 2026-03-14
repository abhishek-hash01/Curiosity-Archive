'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CheckCircle2, Circle, Trash2, CalendarDays } from 'lucide-react';

const DAYS_OF_WEEK = [
  { label: 'Monday', short: 'M' },
  { label: 'Tuesday', short: 'T' },
  { label: 'Wednesday', short: 'W' },
  { label: 'Thursday', short: 'T' },
  { label: 'Friday', short: 'F' },
  { label: 'Saturday', short: 'S' },
  { label: 'Sunday', short: 'S' },
];

export function GoalsList({ weekId }: { weekId: string }) {
  const [text, setText] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | undefined>();
  
  const week = useStore((state) => state.weeks[weekId]);
  const addGoal = useStore((state) => state.addGoal);
  const toggleGoal = useStore((state) => state.toggleGoal);
  const removeGoal = useStore((state) => state.removeGoal);

  if (!week) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      e.preventDefault();
      addGoal(weekId, text.trim(), selectedDay);
      setText('');
      // Optionally keep the day selected so they can queue multiple tasks for that day
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

  return (
    <div className="flex flex-col gap-5 bg-background border border-border rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.02)]">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Goals for the Week</h2>
        <p className="text-xs text-muted-foreground mt-1">Add items using Enter. Use #tags for inline categorization.</p>
      </div>

      {/* Input & Day Selector Area */}
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
            {DAYS_OF_WEEK.map((day, idx) => (
              <button
                key={`${day.label}-${idx}`}
                onClick={() => setSelectedDay(selectedDay === day.label ? undefined : day.label)}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-colors focus:outline-none 
                  ${selectedDay === day.label 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground'
                  }`}
                title={day.label}
              >
                {day.short}
              </button>
            ))}
          </div>
          {selectedDay && (
             <span className="text-[10px] font-medium text-primary uppercase tracking-wider">{selectedDay}</span>
          )}
        </div>
      </div>
      
      {/* Grouped Rendering */}
      <div className="flex flex-col gap-6 mt-2">
        {/* Render Scheduled Goals */}
        {DAYS_OF_WEEK.map((day) => {
          const dayGoals = week.goals.filter(g => g.daySelected === day.label);
          if (dayGoals.length === 0) return null;
          
          return (
            <div key={day.label} className="flex flex-col gap-1.5">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-2 mb-1">
                {day.label}
              </h3>
              {dayGoals.map((goal) => (
                <div 
                  key={goal.id} 
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 group transition-colors"
                >
                  <button 
                    onClick={() => toggleGoal(weekId, goal.id)}
                    className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none shrink-0"
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
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
              ))}
            </div>
          );
        })}

        {/* Render Unscheduled Goals */}
        {week.goals.filter(g => !g.daySelected).length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-2 mb-1">
              Anytime
            </h3>
            {week.goals.filter(g => !g.daySelected).map((goal) => (
              <div 
                key={goal.id} 
                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 group transition-colors"
              >
                <button 
                  onClick={() => toggleGoal(weekId, goal.id)}
                  className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none shrink-0"
                >
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <span className={`text-sm flex-1 ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
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
            ))}
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
