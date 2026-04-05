'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Goal } from '@/types';
import { CheckCircle2, Circle, Trash2, CalendarDays, Sparkles, ChevronLeft, ChevronRight, ArrowRightToLine, ArchiveRestore, GitBranch, X, Plus } from 'lucide-react';

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

  const addConditionalGoal = useStore((state) => state.addConditionalGoal);
  const selectBranch = useStore((state) => state.selectBranch);
  const toggleNestedGoal = useStore((state) => state.toggleNestedGoal);
  const updateDayTitle = useStore((state) => state.updateDayTitle);
  const addSubGoal = useStore((state) => state.addSubGoal);

  const [isConditionalMode, setIsConditionalMode] = useState(false);
  const [branch1Label, setBranch1Label] = useState('Yes');
  const [branch2Label, setBranch2Label] = useState('No');
  const [branch1Task, setBranch1Task] = useState('');
  const [branch2Task, setBranch2Task] = useState('');

  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [dayTitleText, setDayTitleText] = useState('');

  const [addingSubGoalTo, setAddingSubGoalTo] = useState<string | null>(null);
  const [subGoalText, setSubGoalText] = useState('');

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

  const handleAddConditional = () => {
    if (!text.trim()) return;
    addConditionalGoal(weekId, text.trim(), viewDay, [
      { label: branch1Label || 'Yes', tasks: branch1Task.split('\n') },
      { label: branch2Label || 'No', tasks: branch2Task.split('\n') }
    ]);
    setText('');
    setBranch1Task('');
    setBranch2Task('');
    setIsConditionalMode(false);
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

  const handleSubGoalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, parentId: string) => {
    if (e.key === 'Enter' && subGoalText.trim()) {
      e.preventDefault();
      addSubGoal(weekId, parentId, subGoalText.trim());
      setSubGoalText('');
      setAddingSubGoalTo(null);
    } else if (e.key === 'Escape') {
      setAddingSubGoalTo(null);
      setSubGoalText('');
    }
  };

  const renderGoals = (goals: Goal[], isToday: boolean, isAnytimeList = false, depth = 0) =>
    goals.map((goal) => {
      // ── Actions common to both conditional/regular ──
      const goalActions = (
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
            onClick={() => {
              setAddingSubGoalTo(goal.id);
              setSubGoalText('');
            }}
            className="p-1 text-muted-foreground/30 hover:text-primary hover:bg-primary/10 rounded transition-colors focus:outline-none"
            title="Add sub-task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => removeGoal(weekId, goal.id)}
            className="p-1 text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors focus:outline-none"
            title="Delete goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      );

      if (goal.type === 'conditional') {
        return (
          <div key={goal.id} className={`flex flex-col gap-2 p-3 mt-1 mb-1 rounded-xl border border-border/80 shadow-sm group transition-colors ${isToday ? 'bg-primary/5 hover:bg-primary/10' : 'bg-muted/30 hover:bg-muted/60'}`} style={{ marginLeft: depth * 20 }}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-background border border-border shadow-sm p-1 shrink-0">
                <GitBranch className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm flex-1 font-medium text-foreground py-0.5">
                {renderTextWithTags(goal.text)}
              </span>
              {goalActions}
            </div>
            
            <div className="flex items-center gap-2 pl-9">
              {goal.branches?.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => selectBranch(weekId, goal.id, b.id)}
                  className={`px-3 py-1 text-[11px] rounded-full font-bold uppercase tracking-wide transition-all ${
                    goal.selectedBranchId === b.id 
                      ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                      : 'bg-background text-muted-foreground border border-border/60 hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {goal.selectedBranchId && (
              <div className="pl-6 ml-3 mt-2 flex flex-col gap-2 border-l-[1.5px] border-primary/20">
                {goal.branches?.find((b: any) => b.id === goal.selectedBranchId)?.goals.map((ng: Goal) => (
                  <div key={ng.id} className="flex items-start gap-2.5 group/nested hover:bg-background/50 p-1.5 rounded-lg -ml-1.5 transition-colors">
                    <button onClick={() => toggleNestedGoal(weekId, goal.id, goal.selectedBranchId!, ng.id)} className="mt-[1px]">
                      {ng.completed ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors" />}
                    </button>
                    <span className={`text-sm ${ng.completed ? 'text-muted-foreground line-through' : 'text-foreground/90 font-medium'}`}>
                      {renderTextWithTags(ng.text)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      // ── Regular Goal ──
      return (
        <div key={goal.id} className="flex flex-col">
          <div
            className={`flex items-start gap-3 p-2 rounded-xl group transition-colors ${isToday ? 'hover:bg-primary/5' : 'hover:bg-muted/50'}`}
            style={{ marginLeft: depth * 20 }}
          >
            <button
              onClick={() => toggleGoal(weekId, goal.id)}
              className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none shrink-0"
            >
              {goal.completed
                ? <CheckCircle2 className="w-5 h-5 text-primary" />
                : <Circle className={`w-5 h-5 ${isToday ? 'text-primary/50' : ''}`} />}
            </button>
            <span className={`text-sm flex-1 pt-[2px] ${goal.completed ? 'text-muted-foreground line-through' : isToday ? 'text-foreground font-medium' : 'text-foreground'}`}>
              {renderTextWithTags(goal.text)}
            </span>
            {goalActions}
          </div>

          {/* Inline Sub-goal Input */}
          {addingSubGoalTo === goal.id && (
            <div className="flex items-center gap-3 p-2 ml-8 -mt-1 group transition-colors" style={{ marginLeft: (depth + 1) * 20 }}>
              <div className="w-5 flex justify-center shrink-0">
                <Plus className="w-3.5 h-3.5 text-primary/40" />
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Sub-task name..."
                value={subGoalText}
                onChange={(e) => setSubGoalText(e.target.value)}
                onKeyDown={(e) => handleSubGoalKeyDown(e, goal.id)}
                onBlur={() => {
                  if (!subGoalText.trim()) setAddingSubGoalTo(null);
                }}
                className="text-sm flex-1 bg-transparent border-b border-primary/20 focus:border-primary outline-none py-0.5 placeholder:text-muted-foreground/40 transition-colors"
              />
            </div>
          )}

          {/* Recursive sub-goals */}
          {goal.subGoals && goal.subGoals.length > 0 && (
            <div className="flex flex-col">
              {renderGoals(goal.subGoals, isToday, isAnytimeList, depth + 1)}
            </div>
          )}
        </div>
      );
    });

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
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            {viewDay}{viewDay === todayLabel ? ' — Today' : ''}
          </span>
          {editingDay === viewDay ? (
            <input
              autoFocus
              value={dayTitleText}
              onChange={(e) => setDayTitleText(e.target.value)}
              onBlur={() => {
                updateDayTitle(weekId, viewDay, dayTitleText);
                setEditingDay(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateDayTitle(weekId, viewDay, dayTitleText);
                  setEditingDay(null);
                } else if (e.key === 'Escape') {
                  setEditingDay(null);
                }
              }}
              placeholder="name day..."
              className="text-xs font-medium bg-muted/60 border border-border/80 px-2 py-0.5 rounded-md outline-none focus:border-primary/50 text-foreground transition-colors"
            />
          ) : (
            <span 
              onClick={() => { setEditingDay(viewDay); setDayTitleText(week.dayTitles?.[viewDay] || ''); }}
              className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground italic px-1 py-0.5 rounded transition-colors"
              title="Click to rename this day"
            >
              {week.dayTitles?.[viewDay] ? `"${week.dayTitles[viewDay]}"` : '+ name day'}
            </span>
          )}
        </div>
        {dayGoals.length === 0 && (
          <span className="text-[10px] text-muted-foreground font-mono italic">nothing scheduled</span>
        )}
      </div>

      {/* Input — Switchable between Regular and Conditional form */}
      <div className="flex flex-col gap-2 pb-3 border-b border-border/50 transition-all duration-300">
        {!isConditionalMode ? (
          <div className="relative">
            <input
              type="text"
              placeholder={`Add to ${viewDay}… (Enter)`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-muted/30 border border-border rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
            />
            <button 
              onClick={() => setIsConditionalMode(true)}
              className="absolute right-2.5 top-2.5 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors focus:outline-none"
              title="Create branch / conditional task"
            >
              <GitBranch className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 bg-muted/20 border border-primary/30 rounded-xl flex flex-col gap-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] animate-in slide-in-from-top-2 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pointer">
              <span className="text-xs font-bold text-primary tracking-wide">CONDITIONAL GOAL</span>
              <button onClick={() => setIsConditionalMode(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <input
              autoFocus
              type="text"
              placeholder="e.g. Pilot class meeting outcome..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5 border-l-2 border-green-500/40 pl-3">
                <input
                  type="text"
                  placeholder="Branch 1 Label (Yes)"
                  value={branch1Label}
                  onChange={(e) => setBranch1Label(e.target.value)}
                  className="bg-transparent border-b border-border/50 focus:border-primary pb-1 text-xs font-semibold uppercase outline-none"
                />
                <textarea
                  placeholder="Tasks (one per line)..."
                  value={branch1Task}
                  onChange={(e) => setBranch1Task(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAddConditional()}
                  rows={3}
                  className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 focus:bg-background rounded px-1 -mx-1 py-1 resize-none leading-relaxed"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1.5 border-l-2 border-red-500/40 pl-3">
                <input
                  type="text"
                  placeholder="Branch 2 Label (No)"
                  value={branch2Label}
                  onChange={(e) => setBranch2Label(e.target.value)}
                  className="bg-transparent border-b border-border/50 focus:border-primary pb-1 text-xs font-semibold uppercase outline-none"
                />
                <textarea
                  placeholder="Tasks (one per line)..."
                  value={branch2Task}
                  onChange={(e) => setBranch2Task(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAddConditional()}
                  rows={3}
                  className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 focus:bg-background rounded px-1 -mx-1 py-1 resize-none leading-relaxed"
                />
              </div>
            </div>

            <button 
              onClick={handleAddConditional}
              disabled={!text.trim()}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-lg text-sm font-semibold hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add branching goal
            </button>
          </div>
        )}

        {/* Tiny nudge to reassign to Anytime */}
        <div className="flex items-center gap-1.5 px-2 mt-1">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
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
