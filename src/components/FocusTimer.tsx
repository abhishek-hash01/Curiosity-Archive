'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Pause, Play, RotateCcw, CheckCircle2, Zap, Timer, ArrowUp, Maximize2, Minimize2 } from 'lucide-react';
import { ActivityType, ExamPeriod, TimeSlot } from '@/types';
import { useStore } from '@/store/useStore';

interface Props {
  slot: TimeSlot;
  period: ExamPeriod;
  onClose: () => void;
}

const ACTIVITY_CONFIG: Record<ActivityType, {
  label: string;
  color: string;
  glow: string;
  bg: string;
  textColor: string;
}> = {
  study:    { label: 'Deep Study',     color: '#6b4c9a', glow: 'rgba(107,76,154,0.35)', bg: '#efe7fa', textColor: '#3d2260' },
  pyq:      { label: 'PYQ Session',    color: '#c0622c', glow: 'rgba(192,98,44,0.35)',  bg: '#faeee7', textColor: '#7a3a18' },
  revision: { label: 'Quick Revision', color: '#2d7d5a', glow: 'rgba(45,125,90,0.35)',  bg: '#e7f5ef', textColor: '#1a4f38' },
  mock:     { label: 'Mock Test',      color: '#1a6fa8', glow: 'rgba(26,111,168,0.35)', bg: '#e7f0fa', textColor: '#0f3e63' },
  break:    { label: 'Break',          color: '#7a7a7a', glow: 'rgba(122,122,122,0.3)', bg: '#f0f0ec', textColor: '#4a4a4a' },
};

const CIRCUMFERENCE = 2 * Math.PI * 54;

// ── Duration presets ────────────────────────────────────────────
const DURATION_PRESETS = [
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '1h',  seconds: 60 * 60 },
  { label: '1.5h', seconds: 90 * 60 },
  { label: '2h',  seconds: 120 * 60 },
  { label: '3h',  seconds: 180 * 60 },
];

// Pomodoro defaults
const POMO_WORK = 25 * 60;
const POMO_BREAK = 5 * 60;

// ── Audio alert ──────────────────────────────────────────────────
function playCompletionSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Complete! ✓', {
        body: 'Time to take a break or mark it done.',
        icon: '🎓',
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch {
    // Audio not available
  }
}

type TimerMode = 'countdown' | 'stopwatch' | 'pomodoro';

export function FocusTimer({ slot, period, onClose }: Props) {
  const toggleTimeSlot = useStore((s) => s.toggleTimeSlot);
  const addActualTime = useStore((s) => s.addActualTime);
  const cfg = ACTIVITY_CONFIG[slot.activity];

  // ── Phase: 'setup' → pick duration | 'running' → timer active ──
  const [phase, setPhase] = useState<'setup' | 'running'>('setup');
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [totalSeconds, setTotalSeconds] = useState(60 * 60); // default 1h

  // ── Timer state ──
  // Wall-clock based: immune to background tab throttling
  const [elapsed, setElapsed] = useState(0);       // total seconds elapsed across pauses
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Pomodoro state
  const [pomoPhase, setPomoPhase] = useState<'work' | 'break'>('work');
  const [pomoCycles, setPomoCycles] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);      // Date.now() when last resumed
  const accumulatedRef = useRef<number>(0);     // seconds accumulated before last pause

  // ── Custom duration input ──
  const [customH, setCustomH] = useState('1');
  const [customM, setCustomM] = useState('0');

  const activeDuration = mode === 'pomodoro'
    ? (pomoPhase === 'work' ? POMO_WORK : POMO_BREAK)
    : totalSeconds;

  // Compute secondsLeft from elapsed (derived, not state)
  const secondsLeft = Math.max(0, activeDuration - elapsed);

  // ── Start session ──
  const handleStart = (dur: number, selectedMode: TimerMode) => {
    setMode(selectedMode);
    setTotalSeconds(dur);
    setElapsed(0);
    accumulatedRef.current = 0;
    setFinished(false);
    setPhase('running');
    setRunning(true);
    startedAtRef.current = Date.now();
  };

  const handleStartCustom = () => {
    const secs = (parseInt(customH) || 0) * 3600 + (parseInt(customM) || 0) * 60;
    if (secs <= 0) return;
    handleStart(secs, 'countdown');
  };

  // ── Log actual time ──
  const logTime = useCallback(() => {
    const mins = Math.round(elapsed / 60);
    if (mins > 0) {
      addActualTime(period.id, slot.id, mins);
    }
  }, [elapsed, addActualTime, period.id, slot.id]);

  // ── Timer end ──
  const handleTimerEnd = useCallback(() => {
    setRunning(false);
    playCompletionSound();

    if (mode === 'pomodoro') {
      if (pomoPhase === 'work') {
        setPomoCycles((c) => c + 1);
        setPomoPhase('break');
        setElapsed(0);
        accumulatedRef.current = 0;
        setTimeout(() => {
          startedAtRef.current = Date.now();
          setRunning(true);
        }, 1000);
      } else {
        setPomoPhase('work');
        setElapsed(0);
        accumulatedRef.current = 0;
      }
    } else {
      setFinished(true);
    }
  }, [mode, pomoPhase]);

  // ── Tick: compute elapsed from wall clock ──
  const tick = useCallback(() => {
    const now = Date.now();
    const currentElapsed = accumulatedRef.current + Math.floor((now - startedAtRef.current) / 1000);
    setElapsed(currentElapsed);

    // Check if countdown is done (not for stopwatch)
    if (mode !== 'stopwatch') {
      const currentDuration = mode === 'pomodoro'
        ? (pomoPhase === 'work' ? POMO_WORK : POMO_BREAK)
        : totalSeconds;
      if (currentElapsed >= currentDuration) {
        handleTimerEnd();
      }
    }
  }, [mode, pomoPhase, totalSeconds, handleTimerEnd]);

  // Start/stop interval
  useEffect(() => {
    if (running) {
      startedAtRef.current = Date.now();
      intervalRef.current = setInterval(tick, 500); // 500ms for snappier UI updates
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Save accumulated time when pausing
      if (startedAtRef.current > 0) {
        accumulatedRef.current = elapsed;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  // Catch up immediately when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && running) {
        tick(); // immediately sync with wall clock
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [running, tick]);

  // ── Display values ──
  const displaySeconds = mode === 'stopwatch' ? elapsed : secondsLeft;
  const displayMin = Math.floor(displaySeconds / 60);
  const displaySec = displaySeconds % 60;

  const currentActiveDuration = mode === 'pomodoro'
    ? (pomoPhase === 'work' ? POMO_WORK : POMO_BREAK)
    : totalSeconds;

  const progress = mode === 'stopwatch'
    ? 0 // no progress ring for stopwatch
    : currentActiveDuration > 0
    ? 1 - secondsLeft / currentActiveDuration
    : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const handleMarkDone = () => {
    logTime();
    if (!slot.completed) toggleTimeSlot(period.id, slot.id);
    onClose();
  };

  const handleClose = () => {
    if (elapsed > 30) logTime(); // log if studied > 30 seconds
    onClose();
  };

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    accumulatedRef.current = 0;
    setFinished(false);
  };

  const handleStopStopwatch = () => {
    setRunning(false);
    setFinished(true);
    playCompletionSound();
  };

  const ringColor = mode === 'pomodoro' && pomoPhase === 'break' ? '#16a34a' : cfg.color;

  // ── SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <div
        className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-[100] max-w-xs mx-auto sm:mx-0 sm:w-80 sm:max-w-none rounded-2xl border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.color + '50', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: cfg.color + '25' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: cfg.textColor }}>{slot.subject}</p>
              <p className="text-[9px] font-mono text-muted-foreground">{cfg.label} · {slot.startTime}–{slot.endTime}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Duration picker */}
        <div className="px-4 py-4 flex flex-col gap-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">How long?</p>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-1.5">
            {DURATION_PRESETS.map(({ label, seconds }) => (
              <button
                key={label}
                onClick={() => handleStart(seconds, 'countdown')}
                className="px-3 py-2.5 rounded-lg border text-sm font-mono font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
                style={{ borderColor: cfg.color + '25' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1">
              <input
                type="number"
                min="0"
                max="12"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="w-14 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-mono text-center focus:outline-none focus:border-primary/50"
              />
              <span className="text-[10px] text-muted-foreground font-mono">h</span>
              <input
                type="number"
                min="0"
                max="59"
                step="5"
                value={customM}
                onChange={(e) => setCustomM(e.target.value)}
                className="w-14 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-mono text-center focus:outline-none focus:border-primary/50"
              />
              <span className="text-[10px] text-muted-foreground font-mono">m</span>
            </div>
            <button
              onClick={handleStartCustom}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: cfg.color }}
            >
              Start
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[9px] font-mono text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Mode buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStart(POMO_WORK, 'pomodoro')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
              style={{ borderColor: cfg.color + '25' }}
            >
              <Zap className="w-3 h-3" />
              Pomodoro 25/5
            </button>
            <button
              onClick={() => handleStart(0, 'stopwatch')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
              style={{ borderColor: cfg.color + '25' }}
            >
              <ArrowUp className="w-3 h-3" />
              Stopwatch
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAXIMIZED VIEW ──
  if (maximized) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${cfg.bg} 0%, ${cfg.color}08 50%, ${cfg.bg} 100%)`,
        }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${running ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: ringColor }}
            />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: cfg.color }}>
              {mode === 'pomodoro'
                ? `Pomodoro ${pomoPhase === 'work' ? `#${pomoCycles + 1}` : 'Break'}`
                : mode === 'stopwatch'
                ? 'Stopwatch'
                : cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMaximized(false)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center gap-6">
          {/* Subject */}
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: cfg.textColor }}>
              {slot.subject}
            </p>
            {mode === 'pomodoro' && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {pomoPhase === 'work' ? '25 min focus' : '5 min break'} · {pomoCycles} cycles done
              </p>
            )}
            {mode === 'stopwatch' && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Counting up — stop when you're done
              </p>
            )}
            {slot.note && (
              <p className="text-sm text-muted-foreground/70 mt-2 max-w-xs">{slot.note}</p>
            )}
          </div>

          {/* Large ring */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke={ringColor + '15'} strokeWidth="5" />
              {mode !== 'stopwatch' && (
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000 ease-linear"
                  style={{ filter: running ? `drop-shadow(0 0 16px ${ringColor}80)` : 'none' }}
                />
              )}
              {mode === 'stopwatch' && running && (
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="8 12"
                  className="animate-spin"
                  style={{ animationDuration: '8s', filter: `drop-shadow(0 0 16px ${ringColor}80)` }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-5xl sm:text-6xl font-mono font-bold tracking-tight tabular-nums"
                style={{ color: cfg.textColor }}
              >
                {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
              </span>
              <span className="text-xs font-mono text-muted-foreground mt-2 tracking-widest uppercase">
                {finished ? '✓ Done!' : running ? (mode === 'stopwatch' ? 'Studying' : 'Focus on') : 'Paused'}
              </span>
            </div>
          </div>

          {/* Elapsed (for countdown modes) */}
          {mode !== 'stopwatch' && elapsed > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              Studied: {Math.floor(elapsed / 60)}m {elapsed % 60}s
            </span>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            {mode !== 'stopwatch' && (
              <button
                onClick={handleReset}
                title="Reset"
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-110"
                style={{ borderColor: cfg.color + '30' }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {mode === 'stopwatch' && running ? (
              <button
                onClick={handleStopStopwatch}
                title="Stop"
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold shadow-xl transition-all hover:scale-105 active:scale-95 bg-red-500"
              >
                <Pause className="w-7 h-7" />
              </button>
            ) : (
              <button
                onClick={() => setRunning((r) => !r)}
                title={running ? 'Pause' : 'Start'}
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: ringColor,
                  boxShadow: running ? `0 0 40px ${cfg.glow}` : `0 4px 20px ${cfg.color}30`,
                }}
              >
                {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>
            )}

            <button
              onClick={handleMarkDone}
              title="Mark done & close"
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110"
              style={{
                borderColor: cfg.color + '30',
                color: slot.completed ? '#16a34a' : cfg.color,
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>

          {/* Finish prompt */}
          {finished && (
            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <span className="text-sm font-mono text-muted-foreground">
                Studied for {Math.floor(elapsed / 60)} min {elapsed % 60}s
              </span>
              <button
                onClick={handleMarkDone}
                className="px-8 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 flex items-center gap-2 shadow-lg"
                style={{ backgroundColor: cfg.color }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete &amp; Close
              </button>
            </div>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-6 flex items-center gap-4 text-xs font-mono text-muted-foreground/60">
          <span>{slot.startTime}–{slot.endTime}</span>
          <span>·</span>
          <span>{slot.activity}</span>
          {mode === 'pomodoro' && <><span>·</span><span>{pomoCycles} cycles</span></>}
        </div>
      </div>
    );
  }

  // ── MINIMIZED (FLOATING) VIEW ──
  return (
    <div
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-[100] max-w-xs mx-auto sm:mx-0 sm:w-72 sm:max-w-none rounded-2xl border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.color + '50',
        boxShadow: running
          ? `0 8px 40px ${cfg.glow}, 0 2px 8px rgba(0,0,0,0.1)`
          : '0 4px 24px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: cfg.color + '25' }}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${running ? 'animate-pulse' : ''}`} style={{ backgroundColor: ringColor }} />
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: cfg.color }}>
            {mode === 'pomodoro'
              ? `Pomo ${pomoPhase === 'work' ? `#${pomoCycles + 1}` : 'Break'}`
              : mode === 'stopwatch'
              ? 'Stopwatch'
              : cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMaximized(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subject */}
      <div className="px-4 pt-3 pb-1 text-center">
        <p className="text-sm font-semibold tracking-tight" style={{ color: cfg.textColor }}>{slot.subject}</p>
        {mode === 'pomodoro' && (
          <p className="text-[9px] text-muted-foreground mt-1 font-mono">
            {pomoPhase === 'work' ? '25 min focus' : '5 min break'} · {pomoCycles} cycles
          </p>
        )}
        {mode === 'stopwatch' && (
          <p className="text-[9px] text-muted-foreground mt-1 font-mono">
            Counting up — stop when you're done
          </p>
        )}
      </div>

      {/* Timer ring */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke={ringColor + '20'} strokeWidth="7" />
            {mode !== 'stopwatch' && (
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={ringColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-linear"
                style={{ filter: running ? `drop-shadow(0 0 8px ${ringColor}90)` : 'none' }}
              />
            )}
            {mode === 'stopwatch' && running && (
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={ringColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="8 12"
                className="animate-spin"
                style={{ animationDuration: '8s', filter: `drop-shadow(0 0 8px ${ringColor}90)` }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold tracking-tight tabular-nums" style={{ color: cfg.textColor }}>
              {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground mt-1 tracking-widest uppercase">
              {finished ? '✓ Done!' : running ? (mode === 'stopwatch' ? 'Studying' : 'Focus on') : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Elapsed time (for countdown modes) */}
      {mode !== 'stopwatch' && elapsed > 0 && (
        <div className="text-center pb-2">
          <span className="text-[9px] font-mono text-muted-foreground">
            Studied: {Math.floor(elapsed / 60)}m {elapsed % 60}s
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-4 px-4">
        {mode !== 'stopwatch' && (
          <button
            onClick={handleReset}
            title="Reset timer"
            className="w-9 h-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            style={{ borderColor: cfg.color + '35' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {mode === 'stopwatch' && running ? (
          <button
            onClick={handleStopStopwatch}
            title="Stop"
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all hover:scale-105 active:scale-95 bg-red-500"
          >
            <Pause className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setRunning((r) => !r)}
            title={running ? 'Pause' : 'Resume'}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: ringColor,
              boxShadow: running ? `0 0 24px ${cfg.glow}` : undefined,
            }}
          >
            {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        )}

        <button
          onClick={handleMarkDone}
          title="Mark session done & close"
          className="w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-105"
          style={{
            borderColor: cfg.color + '35',
            color: slot.completed ? '#16a34a' : cfg.color,
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Time labels */}
      <div className="flex justify-between px-5 pb-3 text-[9px] font-mono text-muted-foreground">
        <span>{slot.startTime}–{slot.endTime}</span>
        {mode === 'pomodoro' && <span>{pomoCycles} cycles</span>}
        {mode === 'stopwatch' && <span>elapsed</span>}
      </div>

      {/* Finish prompt */}
      {finished && (
        <div className="px-4 pb-4 animate-in fade-in duration-300">
          <div className="text-center mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              Studied for {Math.floor(elapsed / 60)} min {elapsed % 60}s
            </span>
          </div>
          <button
            onClick={handleMarkDone}
            className="w-full py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: cfg.color }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Complete &amp; Close
          </button>
        </div>
      )}
    </div>
  );
}

