'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  value: string;          // 'yyyy-MM-dd' or ''
  onChange: (val: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
}

export function DatePicker({ value, onChange, label, minDate, maxDate }: Props) {
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const [open, setOpen] = useState(false);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Padding for the first week (Monday = 0)
  const firstDow = getDay(monthStart);
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1;

  const min = minDate ? new Date(minDate + 'T00:00:00') : null;
  const max = maxDate ? new Date(maxDate + 'T00:00:00') : null;

  const isDisabled = (d: Date) => {
    if (min && d < min) return true;
    if (max && d > max) return true;
    return false;
  };

  const handleSelect = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const displayText = selected ? format(selected, 'EEE, MMM d, yyyy') : 'Select a date';

  return (
    <div className="relative">
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left rounded-lg border px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-mono transition-all flex items-center justify-between gap-2 ${
          open
            ? 'border-primary/50 bg-primary/5 shadow-sm'
            : 'border-border bg-muted/20 hover:border-primary/30'
        } ${!selected ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        <span className="truncate">{displayText}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="fixed inset-0 z-50 flex items-center justify-center sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:block p-4 sm:p-0"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="w-full max-w-xs sm:w-72 rounded-xl border border-border bg-background shadow-xl animate-in fade-in zoom-in-95 duration-150 p-3">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate((d) => subMonths(d, 1))}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold tracking-tight">
                {format(viewDate, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setViewDate((d) => addMonths(d, 1))}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <div key={d} className="text-center text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {/* Leading blanks */}
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="w-full aspect-square" />
              ))}

              {days.map((day) => {
                const isSelected = selected && isSameDay(day, selected);
                const disabled = isDisabled(day);
                const today = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleSelect(day)}
                    disabled={disabled}
                    className={`w-full aspect-square rounded-lg text-xs font-mono flex items-center justify-center transition-all relative ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                        : disabled
                        ? 'text-muted-foreground/25 cursor-not-allowed'
                        : 'text-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {format(day, 'd')}
                    {today && !isSelected && (
                      <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className="text-[10px] font-mono text-primary hover:underline"
              >
                Today
              </button>
              {selected && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {format(selected, 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
