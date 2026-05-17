'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Pause, Play, RotateCcw, CheckCircle2, Timer, Zap } from 'lucide-react';
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

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const CIRCUMFERENCE = 2 * Math.PI * 54;

// Pomodoro defaults
const POMO_WORK = 25 * 60;   // 25 min
const POMO_BREAK = 5 * 60;   // 5 min

// ── Audio alert ──────────────────────────────────────────────────
function playCompletionSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

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

    // Also try browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Complete! ✓', {
        body: 'Time to take a break or mark it done.',
        icon: '🎓',
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch {
    // Audio not available, silent fallback
  }
}

export function FocusTimer({ slot, period, onClose }: Props) {
  const toggleTimeSlot = useStore((s) => s.toggleTimeSlot);
  const cfg = ACTIVITY_CONFIG[slot.activity];

  const fullSlotSeconds = (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)) * 60;

  // ── Pomodoro state ──
  const [pomodoroMode, setPomodoroMode] = useState(false);
  const [pomoPhase, setPomoPhase] = useState<'work' | 'break'>('work');
  const [pomoCycles, setPomoCycles] = useState(0);

  const activeDuration = pomodoroMode ? (pomoPhase === 'work' ? POMO_WORK : POMO_BREAK) : fullSlotSeconds;

  const [secondsLeft, setSecondsLeft] = useState(activeDuration);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer when switching modes
  useEffect(() => {
    setSecondsLeft(pomodoroMode ? POMO_WORK : fullSlotSeconds);
    setRunning(false);
    setFinished(false);
    setPomoPhase('work');
    setPomoCycles(0);
  }, [pomodoroMode, fullSlotSeconds]);

  const handleTimerEnd = useCallback(() => {
    setRunning(false);
    playCompletionSound();

    if (pomodoroMode) {
      if (pomoPhase === 'work') {
        setPomoCycles((c) => c + 1);
        setPomoPhase('break');
        setSecondsLeft(POMO_BREAK);
        // Auto-start break after short delay
        setTimeout(() => setRunning(true), 1000);
      } else {
        // Break is over → ready for next work cycle
        setPomoPhase('work');
        setSecondsLeft(POMO_WORK);
        setFinished(false);
      }
    } else {
      setFinished(true);
    }
  }, [pomodoroMode, pomoPhase]);

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        handleTimerEnd();
        return 0;
      }
      return prev - 1;
    });
  }, [handleTimerEnd]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = activeDuration > 0 ? 1 - secondsLeft / activeDuration : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const handleMarkDone = () => {
    if (!slot.completed) toggleTimeSlot(period.id, slot.id);
    onClose();
  };

  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(activeDuration);
    setFinished(false);
  };

  // Ring color changes for pomodoro break phase
  const ringColor = pomodoroMode && pomoPhase === 'break' ? '#16a34a' : cfg.color;

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
          <span
            className={`w-2 h-2 rounded-full ${running ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: ringColor }}
          />
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: cfg.color }}>
            {pomodoroMode
              ? `Pomo ${pomoPhase === 'work' ? `#${pomoCycles + 1}` : 'Break'}`
              : cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Pomodoro toggle */}
          <button
            onClick={() => setPomodoroMode((m) => !m)}
            title={pomodoroMode ? 'Switch to normal timer' : 'Switch to Pomodoro (25/5)'}
            className={`p-1 rounded-md transition-all ${
              pomodoroMode
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="w-3 h-3" />
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subject + note */}
      <div className="px-4 pt-3 pb-1 text-center">
        <p className="text-sm font-semibold tracking-tight" style={{ color: cfg.textColor }}>
          {slot.subject}
        </p>
        {slot.note && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{slot.note}</p>
        )}
        {pomodoroMode && (
          <p className="text-[9px] text-muted-foreground mt-1 font-mono">
            {pomoPhase === 'work' ? '25 min focus' : '5 min break'} · {pomoCycles} cycles done
          </p>
        )}
      </div>

      {/* Circular progress timer */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke={ringColor + '20'} strokeWidth="7" />
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
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-mono font-bold tracking-tight tabular-nums"
              style={{ color: cfg.textColor }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground mt-1 tracking-widest uppercase">
              {finished ? '✓ Done!' : running ? 'Focus on' : pomodoroMode && pomoPhase === 'break' ? 'Break time' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-4 px-4">
        <button
          onClick={handleReset}
          title="Reset timer"
          className="w-9 h-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          style={{ borderColor: cfg.color + '35' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          title={running ? 'Pause' : 'Start'}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: ringColor,
            boxShadow: running ? `0 0 24px ${cfg.glow}` : undefined,
          }}
        >
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
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
        <span>{slot.startTime}</span>
        <span>{slot.endTime}</span>
      </div>

      {/* Finish prompt */}
      {finished && (
        <div className="px-4 pb-4 animate-in fade-in duration-300">
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
