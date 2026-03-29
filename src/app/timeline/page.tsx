'use client';

import { useStore } from '@/store/useStore';
import { getCurrentWeekId, getCurrentWeekStartDate } from '@/utils/helpers';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, ChevronDown, ChevronRight, ChevronsRight, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TimelinePage() {
  const weeks = useStore((state) => state.weeks);
  const initializeWeek = useStore((state) => state.initializeWeek);
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);

  useEffect(() => {
    const id = getCurrentWeekId();
    const startDate = getCurrentWeekStartDate();
    initializeWeek(id, startDate);
    setCurrentWeekId(id);
  }, [initializeWeek]);

  const sortedWeeks = Object.values(weeks).sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  if (sortedWeeks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Your archive is empty. Start by logging this week.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-8 py-6 border-b border-border shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">The Archive</p>
      </header>

      <div className="flex-1 overflow-y-auto w-full px-8 py-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-12 pb-[30vh]">
          {sortedWeeks.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              isCurrentWeek={week.id === currentWeekId}
              currentWeekId={currentWeekId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekCard({
  week,
  isCurrentWeek,
  currentWeekId,
}: {
  week: ReturnType<typeof useStore.getState>['weeks'][string];
  isCurrentWeek: boolean;
  currentWeekId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmMove, setConfirmMove] = useState(false);
  const [moved, setMoved] = useState(false);
  const mergeWeekInto = useStore((state) => state.mergeWeekInto);

  const completedGoals = week.goals.filter((g) => g.completed).length;
  const totalGoals = week.goals.length;
  const insightCount = week.learnings.length;

  const parsedDate = parseISO(week.startDate);

  const handleMoveToThisWeek = () => {
    if (!currentWeekId) return;
    mergeWeekInto(week.id, currentWeekId);
    setMoved(true);
    setConfirmMove(false);
  };

  const renderTextWithTags = (content: string) => {
    const parts = content.split(/(#[\w-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-purplePrimary font-mono bg-purpleSoft px-1 py-0.5 rounded-sm inline-block">
            {part.toLowerCase()}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex gap-6 relative">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary/20 border-2 border-primary mt-1.5 shrink-0 z-10" />
        <div className="w-px h-full bg-border/50 absolute top-4 left-[5px] -z-0" />
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-lg font-medium tracking-tight">
                Week of {format(parsedDate, 'MMM d, yyyy')}
                {isCurrentWeek && (
                  <span className="ml-2 text-xs font-mono text-purplePrimary bg-purpleSoft px-1.5 py-0.5 rounded-sm">
                    current
                  </span>
                )}
              </h3>
              {week.weekTitle && (
                <span className="text-sm font-semibold text-primary bg-primary/15 px-3 py-1 rounded-full border border-primary/30 shadow-sm transition-all hover:bg-primary/20">
                  {week.weekTitle}
                </span>
              )}
            </div>
            <div className="flex gap-4 mt-1 text-xs font-mono text-muted-foreground">
              <span>{insightCount} insights</span>
              <span>·</span>
              <span className={completedGoals === totalGoals && totalGoals > 0 ? 'text-primary/80' : ''}>
                {completedGoals}/{totalGoals} goals
              </span>
              <span>·</span>
              <span>ID: {week.id}</span>
            </div>
          </div>

          {/* Move to This Week button — only on past weeks */}
          {!isCurrentWeek && currentWeekId && (totalGoals > 0 || insightCount > 0) && (
            <div className="flex items-center gap-2 shrink-0">
              {moved ? (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-mono">
                  <Check className="w-3.5 h-3.5" />
                  Moved to this week
                </span>
              ) : confirmMove ? (
                <>
                  <span className="text-xs text-muted-foreground">Move everything?</span>
                  <button
                    onClick={handleMoveToThisWeek}
                    className="text-xs px-2.5 py-1 rounded-md bg-purplePrimary text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Yes, move
                  </button>
                  <button
                    onClick={() => setConfirmMove(false)}
                    className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmMove(true)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-purplePrimary/50 transition-all"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                  Move to This Week
                </button>
              )}
            </div>
          )}
        </div>

        {week.weekReflection && (
          <div className="p-4 bg-muted/30 rounded-md border border-border/50 text-sm leading-relaxed">
            <span className="font-semibold text-primary/80 block mb-1">Reflection</span>
            {week.weekReflection}
          </div>
        )}

        {/* Sneak peek of top 2 insights if not expanded */}
        {!expanded && insightCount > 0 && (
          <div className="flex flex-col gap-2 opacity-80 pl-2 border-l border-border mt-2">
            {week.learnings.slice(0, 2).map((l) => (
              <p key={l.id} className="text-sm truncate">{l.text}</p>
            ))}
          </div>
        )}

        {(insightCount > 2 || week.goals.length > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start mt-1"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Collapse' : 'Show all'}
          </button>
        )}

        {expanded && (
          <div className="flex flex-col gap-6 mt-2 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
            {week.goals.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Goals</h4>
                <div className="flex flex-col gap-1">
                  {week.goals.map((g) => (
                    <div key={g.id} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 shrink-0 ${g.completed ? 'text-primary' : 'text-muted-foreground/30'}`}
                      />
                      <span className={`text-sm ${g.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {renderTextWithTags(g.text)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insightCount > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Insights</h4>
                <div className="flex flex-col gap-4">
                  {week.learnings.map((l) => (
                    <div key={l.id} className="flex flex-col gap-1 pl-3 border-l-2 border-primary/20">
                      <p className="text-sm leading-relaxed">{l.text}</p>
                      {l.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {l.tags.map((t) => (
                            <span key={t} className="text-[10px] font-mono bg-purpleSoft text-purplePrimary px-1 py-0.5 rounded-sm">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
