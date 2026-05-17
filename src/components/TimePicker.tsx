'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  value: string;        // 'HH:mm'
  onChange: (val: string) => void;
  label?: string;
  min?: string;         // e.g. '06:00'
  max?: string;         // e.g. '23:30'
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function TimePicker({ value, onChange, label, min, max }: Props) {
  const [open, setOpen] = useState(false);

  const [h, m] = value.split(':').map(Number);
  const hour = isNaN(h) ? 9 : h;
  const minute = isNaN(m) ? 0 : m;

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected hour/minute when opened
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const hourEl = hourRef.current?.querySelector(`[data-hour="${hour}"]`);
      hourEl?.scrollIntoView({ block: 'center', behavior: 'auto' });
      const minEl = minuteRef.current?.querySelector(`[data-minute="${minute}"]`);
      minEl?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 50);
  }, [open, hour, minute]);

  const setHour = (newH: number) => {
    onChange(`${pad(newH)}:${pad(minute)}`);
  };

  const setMinute = (newM: number) => {
    onChange(`${pad(hour)}:${pad(newM)}`);
  };

  const displayTime = `${formatHour(hour).replace(' ', '\u00a0')} : ${pad(minute)}`;

  // Duration hint from the value itself
  const displayCompact = `${pad(hour)}:${pad(minute)}`;

  return (
    <div className="relative">
      {label && (
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left rounded-lg border px-3 py-2 sm:py-2.5 text-sm transition-all flex items-center justify-between gap-2 ${
          open
            ? 'border-primary/50 bg-primary/5 shadow-sm'
            : 'border-border bg-muted/20 hover:border-primary/30'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-mono font-bold tracking-tighter tabular-nums text-foreground">
            {pad(hour)}:{pad(minute)}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
            {hour < 12 ? 'AM' : 'PM'}
          </span>
        </div>
        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:block"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="w-full sm:w-auto rounded-t-xl sm:rounded-xl border border-border bg-background shadow-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 overflow-hidden max-h-[70vh] sm:max-h-none">
            <div className="flex">
              {/* Hour column */}
              <div className="flex-1 border-r border-border">
                <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Hour</span>
                </div>
                <div ref={hourRef} className="h-48 overflow-y-auto scrollbar-thin">
                  {HOURS.map((hr) => {
                    const isSelected = hr === hour;
                    return (
                      <button
                        key={hr}
                        type="button"
                        data-hour={hr}
                        onClick={() => setHour(hr)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <span className="font-mono tabular-nums w-5 text-right text-xs">{pad(hr)}</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          {formatHour(hr)}
                        </span>
                        {isSelected && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minute column */}
              <div className="flex-1">
                <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Minute</span>
                </div>
                <div ref={minuteRef} className="h-48 overflow-y-auto">
                  {MINUTES.map((mn) => {
                    const isSelected = mn === minute;
                    return (
                      <button
                        key={mn}
                        type="button"
                        data-minute={mn}
                        onClick={() => setMinute(mn)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-all ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <span className="font-mono tabular-nums text-lg font-bold">{pad(mn)}</span>
                        {isSelected && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}

                  {/* Fine-grain: show all 5-min intervals */}
                  <div className="px-3 py-2 border-t border-border/50">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Fine</span>
                  </div>
                  {Array.from({ length: 12 }, (_, i) => i * 5)
                    .filter((mn) => !MINUTES.includes(mn))
                    .map((mn) => {
                      const isSelected = mn === minute;
                      return (
                        <button
                          key={mn}
                          type="button"
                          data-minute={mn}
                          onClick={() => setMinute(mn)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          }`}
                        >
                          <span className="font-mono tabular-nums">{pad(mn)}</span>
                          {isSelected && (
                            <div className="ml-auto w-1 h-1 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Preview bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
              <span className="text-xs font-mono text-muted-foreground">Selected</span>
              <span className="text-sm font-mono font-bold text-primary tabular-nums">
                {pad(hour)}:{pad(minute)}
              </span>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
