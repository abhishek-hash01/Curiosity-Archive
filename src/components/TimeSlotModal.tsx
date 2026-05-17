'use client';

import { useState, useMemo } from 'react';
import { X, CheckCircle2, Clock, BookOpen, Trash2, FileText } from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isToday as isTodayFn } from 'date-fns';
import { ActivityType, ExamPeriod, TimeSlot } from '@/types';
import { useStore } from '@/store/useStore';
import { TimePicker } from './TimePicker';

interface Props {
  period: ExamPeriod;
  editSlot?: TimeSlot | null;
  defaultDate?: string;
  onClose: () => void;
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  study: 'Deep Study',
  pyq: 'PYQ / Past Papers',
  revision: 'Quick Revision',
  mock: 'Mock Test',
  break: 'Break / Rest',
};

const ACTIVITY_COLORS: Record<ActivityType, { bg: string; border: string; dot: string }> = {
  study:    { bg: 'bg-[#efe7fa]', border: 'border-[#6b4c9a]/30', dot: 'bg-[#6b4c9a]' },
  pyq:      { bg: 'bg-[#faeee7]', border: 'border-[#c0622c]/30', dot: 'bg-[#c0622c]' },
  revision: { bg: 'bg-[#e7f5ef]', border: 'border-[#2d7d5a]/30', dot: 'bg-[#2d7d5a]' },
  mock:     { bg: 'bg-[#e7f0fa]', border: 'border-[#1a6fa8]/30', dot: 'bg-[#1a6fa8]' },
  break:    { bg: 'bg-[#f0f0ec]', border: 'border-[#7a7a7a]/30', dot: 'bg-[#7a7a7a]' },
};

// Duration presets for quick selection
const DURATION_PRESETS = [
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '1.5h', mins: 90 },
  { label: '2h', mins: 120 },
  { label: '3h', mins: 180 },
];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

export function TimeSlotModal({ period, editSlot, defaultDate, onClose }: Props) {
  const addTimeSlot = useStore((s) => s.addTimeSlot);
  const updateTimeSlot = useStore((s) => s.updateTimeSlot);
  const deleteTimeSlot = useStore((s) => s.deleteTimeSlot);

  const isEditing = !!editSlot;

  const [date, setDate] = useState(editSlot?.date ?? defaultDate ?? period.startDate);
  const [startTime, setStartTime] = useState(editSlot?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(editSlot?.endTime ?? '11:00');
  const [subject, setSubject] = useState(editSlot?.subject ?? (period.subjects[0] ?? ''));
  const [activity, setActivity] = useState<ActivityType>(editSlot?.activity ?? 'study');
  const [note, setNote] = useState(editSlot?.note ?? '');
  const [error, setError] = useState('');

  // All days within the exam period for the day-pill selector
  const periodDays = useMemo(() => {
    return eachDayOfInterval({
      start: parseISO(period.startDate),
      end: parseISO(period.endDate),
    });
  }, [period.startDate, period.endDate]);

  // Compute duration display
  const durationMins = (() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();

  const handleDurationPreset = (mins: number) => {
    setEndTime(addMinutes(startTime, mins));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return setError('Pick a date.');
    if (!subject) return setError('Select a subject.');
    if (startTime >= endTime) return setError('End time must be after start time.');
    if (isEditing && editSlot) {
      updateTimeSlot(period.id, editSlot.id, { date, startTime, endTime, subject, activity, note: note.trim() || undefined });
    } else {
      addTimeSlot(period.id, { date, startTime, endTime, subject, activity, note: note.trim() || undefined, completed: false });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editSlot) return;
    deleteTimeSlot(period.id, editSlot.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">
              {isEditing ? 'Edit Time Slot' : 'Add Time Slot'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button onClick={handleDelete} className="text-muted-foreground hover:text-red-500 transition-colors" title="Delete slot">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* ── Date: Day pills ── */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {periodDays.map((day) => {
                const ds = format(day, 'yyyy-MM-dd');
                const isSelected = ds === date;
                const today = isTodayFn(day);

                return (
                  <button
                    key={ds}
                    type="button"
                    onClick={() => setDate(ds)}
                    className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-center transition-all min-w-[44px] shrink-0 ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={`text-sm font-bold font-mono leading-none mt-0.5 ${
                      isSelected ? 'text-primary' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {today && (
                      <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Time range with custom pickers ── */}
          <div className="grid grid-cols-2 gap-3">
            <TimePicker value={startTime} onChange={setStartTime} label="Start" />
            <TimePicker value={endTime} onChange={setEndTime} label="End" />
          </div>

          {/* Duration presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Duration:</span>
            {DURATION_PRESETS.map(({ label, mins }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleDurationPreset(mins)}
                className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-all ${
                  durationMins === mins
                    ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
            {durationMins > 0 && (
              <span className="text-[10px] font-mono text-primary font-semibold ml-auto">
                {Math.floor(durationMins / 60) > 0 ? `${Math.floor(durationMins / 60)}h ` : ''}
                {durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}
              </span>
            )}
          </div>

          {/* ── Subject pills (not a dropdown) ── */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Subject
            </label>
            <div className="flex flex-wrap gap-1.5">
              {period.subjects.map((s) => {
                const isSelected = s === subject;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-primary/15 border-primary/40 text-primary font-semibold shadow-sm'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Activity type ── */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Activity Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((act) => {
                const c = ACTIVITY_COLORS[act];
                const active = activity === act;
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActivity(act)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs font-medium transition-all ${
                      active
                        ? `${c.bg} ${c.border} text-foreground shadow-sm`
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                    {ACTIVITY_LABELS[act]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Note ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Note <span className="font-normal normal-case">— optional</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Focus on thermodynamics chapter…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEditing ? 'Save Changes' : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
