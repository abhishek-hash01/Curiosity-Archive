'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, isSameDay } from 'date-fns';
import { Play, CheckCircle2, Circle, ChevronLeft, ChevronRight, Copy, X, Check } from 'lucide-react';
import { ActivityType, ExamPeriod, TimeSlot } from '@/types';
import { useStore } from '@/store/useStore';
import { TimeSlotModal } from './TimeSlotModal';

interface Props {
  period: ExamPeriod;
  onStartFocus?: (slot: TimeSlot) => void;
}

// ── Constants ──────────────────────────────────────────────────────
const HOUR_START = 6;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const CELL_HEIGHT = 56;

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  study: 'Study', pyq: 'PYQ', revision: 'Revision', mock: 'Mock Test', break: 'Break',
};

const ACTIVITY_STYLE: Record<ActivityType, { bg: string; border: string; text: string; dot: string }> = {
  study:    { bg: '#efe7fa', border: '#6b4c9a', text: '#3d2260', dot: '#6b4c9a' },
  pyq:      { bg: '#faeee7', border: '#c0622c', text: '#7a3a18', dot: '#c0622c' },
  revision: { bg: '#e7f5ef', border: '#2d7d5a', text: '#1a4f38', dot: '#2d7d5a' },
  mock:     { bg: '#e7f0fa', border: '#1a6fa8', text: '#0f3e63', dot: '#1a6fa8' },
  break:    { bg: '#f0f0ec', border: '#9a9a9a', text: '#4a4a4a', dot: '#9a9a9a' },
};

// ── Helpers ────────────────────────────────────────────────────────
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToPx(minutes: number): number {
  return (minutes / 60) * CELL_HEIGHT;
}
function slotTop(startTime: string): number {
  return minutesToPx(Math.max(0, timeToMinutes(startTime) - HOUR_START * 60));
}
function slotHeight(startTime: string, endTime: string): number {
  return minutesToPx(Math.max(timeToMinutes(endTime) - timeToMinutes(startTime), 30));
}

// ── Component ──────────────────────────────────────────────────────
export function ExamTimetable({ period, onStartFocus }: Props) {
  const toggleTimeSlot = useStore((s) => s.toggleTimeSlot);
  const addTimeSlot = useStore((s) => s.addTimeSlot);

  const [addingSlot, setAddingSlot] = useState<{ date: string } | null>(null);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [copySource, setCopySource] = useState<string | null>(null);
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── All days in the period ──
  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: parseISO(period.startDate), end: parseISO(period.endDate) });
  }, [period.startDate, period.endDate]);

  // ── Week pagination ──
  const weekStarts = useMemo(() => {
    const starts: Date[] = [];
    let cursor = startOfWeek(parseISO(period.startDate), { weekStartsOn: 1 });
    const last = parseISO(period.endDate);
    while (cursor <= last) {
      starts.push(cursor);
      cursor = addWeeks(cursor, 1);
    }
    return starts;
  }, [period.startDate, period.endDate]);

  const [weekIndex, setWeekIndex] = useState(() => {
    const today = new Date();
    const idx = weekStarts.findIndex((ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      return today >= ws && today <= we;
    });
    return idx >= 0 ? idx : 0;
  });

  const currentWeekStart = weekStarts[weekIndex];
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Filter days to only this week, clamped to the period range
  const visibleDays = useMemo(() => {
    return allDays.filter((d) => d >= currentWeekStart && d <= currentWeekEnd);
  }, [allDays, currentWeekStart, currentWeekEnd]);

  // ── Group slots by date ──
  const slotsByDate = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    for (const slot of period.slots) {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot);
    }
    return map;
  }, [period.slots]);

  // ── Per-subject breakdown (uses actual time when available) ──
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const slot of period.slots) {
      if (slot.activity === 'break') continue;
      const mins = slot.actualMinutesSpent != null
        ? slot.actualMinutesSpent
        : (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime));
      map[slot.subject] = (map[slot.subject] || 0) + mins;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([subject, mins]) => ({ subject, hours: Math.floor(mins / 60), mins: mins % 60 }));
  }, [period.slots]);

  // ── Summary stats (actual time when tracked) ──
  const totalSlots = period.slots.length;
  const completedSlots = period.slots.filter((s) => s.completed).length;
  const totalStudyMins = period.slots
    .filter((s) => s.activity !== 'break')
    .reduce((acc, s) => {
      const mins = s.actualMinutesSpent != null
        ? s.actualMinutesSpent
        : (timeToMinutes(s.endTime) - timeToMinutes(s.startTime));
      return acc + mins;
    }, 0);

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);

  // ── Auto-scroll to current time ──
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= HOUR_START && currentHour < HOUR_END) {
      const scrollTarget = (currentHour - HOUR_START - 1) * CELL_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollTarget);
    }
  }, [weekIndex]);

  // ── Copy day handler ──
  const handleCopyConfirm = () => {
    if (!copySource) return;
    const sourceSlots = slotsByDate[copySource] ?? [];
    copyTargets.forEach((targetDate) => {
      sourceSlots.forEach((s) => {
        addTimeSlot(period.id, {
          date: targetDate,
          startTime: s.startTime,
          endTime: s.endTime,
          subject: s.subject,
          activity: s.activity,
          note: s.note,
          completed: false,
        });
      });
    });
    setCopySource(null);
    setCopyTargets(new Set());
  };

  const toggleCopyTarget = (dateStr: string) => {
    setCopyTargets((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Stats bar + subject breakdown ── */}
      <div className="flex items-center gap-3 sm:gap-6 px-3 sm:px-6 py-2 sm:py-3 border-b border-border/50 bg-muted/20 shrink-0 flex-wrap gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sessions</span>
          <span className="text-sm font-mono font-semibold text-foreground">{completedSlots}/{totalSlots}</span>
        </div>
        <div className="w-px h-4 bg-border hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total</span>
          <span className="text-sm font-mono font-semibold text-foreground">
            {Math.floor(totalStudyMins / 60)}h{totalStudyMins % 60 > 0 ? ` ${totalStudyMins % 60}m` : ''}
          </span>
        </div>
        {period.dailyTargetHours && (
          <>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target</span>
              <span className="text-sm font-mono font-semibold text-foreground">{period.dailyTargetHours}h/day</span>
            </div>
          </>
        )}
        {/* Per-subject breakdown */}
        {subjectBreakdown.length > 0 && (
          <>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 flex-wrap">
              {subjectBreakdown.map(({ subject, hours, mins }) => (
                <span key={subject} className="text-[10px] text-muted-foreground font-mono">
                  <span className="font-semibold text-foreground">{subject}</span>{' '}
                  {hours}h{mins > 0 ? `${mins}m` : ''}
                </span>
              ))}
            </div>
          </>
        )}
        {/* Legend (pushed right, hidden on small screens) */}
        <div className="ml-auto hidden sm:flex items-center gap-3 flex-wrap">
          {(Object.keys(ACTIVITY_STYLE) as ActivityType[]).map((act) => (
            <span key={act} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ACTIVITY_STYLE[act].dot }} />
              {ACTIVITY_LABELS[act]}
            </span>
          ))}
        </div>
      </div>

      {/* ── Week navigation ── */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 border-b border-border/40 bg-background shrink-0">
        <button
          onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
          disabled={weekIndex === 0}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {weekStarts.map((ws, i) => (
            <button
              key={i}
              onClick={() => setWeekIndex(i)}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-mono transition-all whitespace-nowrap shrink-0 ${
                i === weekIndex
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              W{i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => setWeekIndex((i) => Math.min(weekStarts.length - 1, i + 1))}
          disabled={weekIndex === weekStarts.length - 1}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Copy Day modal ── */}
      {copySource && (
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Copy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Copy {format(parseISO(copySource), 'EEE MMM d')}'s slots to:
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto">
            {allDays
              .filter((d) => format(d, 'yyyy-MM-dd') !== copySource)
              .map((d) => {
                const ds = format(d, 'yyyy-MM-dd');
                const selected = copyTargets.has(ds);
                return (
                  <button
                    key={ds}
                    onClick={() => toggleCopyTarget(ds)}
                    className={`text-[10px] px-2 py-1 rounded-md border font-mono transition-all ${
                      selected
                        ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {format(d, 'EEE d')}
                  </button>
                );
              })}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopyConfirm}
              disabled={copyTargets.size === 0}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Check className="w-3 h-3" />
              Copy ({copyTargets.size})
            </button>
            <button
              onClick={() => { setCopySource(null); setCopyTargets(new Set()); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Timetable grid ── */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="min-w-max">
          {/* Day headers */}
          <div className="flex sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="w-10 sm:w-14 shrink-0" />
            {visibleDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
              const daySlots = slotsByDate[dateStr] ?? [];
              const dayCompleted = daySlots.filter((s) => s.completed).length;
              return (
                <div
                  key={dateStr}
                  className={`w-28 sm:w-36 shrink-0 px-1.5 sm:px-2 py-2 sm:py-3 border-r border-border text-center relative group ${
                    isToday ? 'bg-primary/5' : ''
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-semibold leading-none mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{format(day, 'MMM')}</p>
                  {daySlots.length > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="text-[9px] text-muted-foreground">{dayCompleted}/{daySlots.length}</span>
                      {/* Copy day button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopySource(dateStr);
                          setCopyTargets(new Set());
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy this day's slots"
                      >
                        <Copy className="w-2.5 h-2.5 text-muted-foreground hover:text-primary transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex">
            {/* Time axis */}
            <div className="w-10 sm:w-14 shrink-0 relative" style={{ height: CELL_HEIGHT * TOTAL_HOURS }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute w-full flex items-center justify-end pr-2"
                  style={{ top: (h - HOUR_START) * CELL_HEIGHT - 6, height: CELL_HEIGHT }}
                >
                  <span className="text-[9px] font-mono text-muted-foreground/70">
                    {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                  </span>
                </div>
              ))}
              {/* Current time indicator line */}
              {(() => {
                const now = new Date();
                const currentMin = now.getHours() * 60 + now.getMinutes();
                if (currentMin >= HOUR_START * 60 && currentMin < HOUR_END * 60) {
                  const top = minutesToPx(currentMin - HOUR_START * 60);
                  return (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ top }}
                    >
                      <div className="h-0.5 bg-red-400/60 w-full" />
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Day columns */}
            {visibleDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
              const daySlots = slotsByDate[dateStr] ?? [];

              return (
                <div
                  key={dateStr}
                  className="w-28 sm:w-36 shrink-0 relative border-r border-border cursor-pointer group"
                  style={{ height: CELL_HEIGHT * TOTAL_HOURS }}
                  onClick={() => setAddingSlot({ date: dateStr })}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-border/30"
                      style={{ top: (h - HOUR_START) * CELL_HEIGHT }}
                    />
                  ))}
                  {isToday && <div className="absolute inset-0 bg-primary/3 pointer-events-none" />}

                  {/* Current time line across day columns */}
                  {isToday && (() => {
                    const now = new Date();
                    const currentMin = now.getHours() * 60 + now.getMinutes();
                    if (currentMin >= HOUR_START * 60 && currentMin < HOUR_END * 60) {
                      const top = minutesToPx(currentMin - HOUR_START * 60);
                      return (
                        <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top }}>
                          <div className="h-0.5 bg-red-400/60 w-full" />
                          <div className="absolute -top-[3px] -left-[3px] w-2 h-2 rounded-full bg-red-400" />
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-start justify-center pt-2">
                    <span className="text-[10px] text-primary/50 font-mono">+ add slot</span>
                  </div>

                  {/* Slots */}
                  {daySlots.map((slot) => {
                    const style = ACTIVITY_STYLE[slot.activity];
                    const top = slotTop(slot.startTime);
                    const height = slotHeight(slot.startTime, slot.endTime);

                    return (
                      <div
                        key={slot.id}
                        className="absolute left-1 right-1 rounded-md border px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all group/slot"
                        style={{
                          top, height,
                          backgroundColor: style.bg,
                          borderColor: style.border,
                          opacity: slot.completed ? 0.55 : 1,
                        }}
                        onClick={(e) => { e.stopPropagation(); setEditingSlot(slot); }}
                      >
                        {slot.completed && (
                          <div
                            className="absolute inset-0 rounded-md"
                            style={{
                              background: `repeating-linear-gradient(45deg, transparent, transparent 3px, ${style.border}22 3px, ${style.border}22 6px)`,
                            }}
                          />
                        )}
                        <div className="flex items-start justify-between gap-1 relative z-10">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold leading-tight truncate"
                              style={{ color: style.text, textDecoration: slot.completed ? 'line-through' : 'none' }}>
                              {slot.subject}
                            </p>
                            {height > 40 && (
                              <p className="text-[9px] font-mono leading-tight mt-0.5" style={{ color: style.dot }}>
                                {ACTIVITY_LABELS[slot.activity]}
                              </p>
                            )}
                            {height > 60 && (
                              <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{slot.startTime}–{slot.endTime}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 items-center shrink-0 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                            {!slot.completed && onStartFocus && (
                              <button className="mt-0.5" onClick={(e) => { e.stopPropagation(); onStartFocus(slot); }} title="Start focus session">
                                <Play className="w-3 h-3" style={{ color: style.dot }} />
                              </button>
                            )}
                            <button className="mt-0.5" onClick={(e) => { e.stopPropagation(); toggleTimeSlot(period.id, slot.id); }}
                              title={slot.completed ? 'Mark incomplete' : 'Mark complete'}>
                              {slot.completed
                                ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: style.dot }} />
                                : <Circle className="w-3.5 h-3.5" style={{ color: style.dot }} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {addingSlot && <TimeSlotModal period={period} defaultDate={addingSlot.date} onClose={() => setAddingSlot(null)} />}
      {editingSlot && <TimeSlotModal period={period} editSlot={editingSlot} onClose={() => setEditingSlot(null)} />}
    </div>
  );
}
