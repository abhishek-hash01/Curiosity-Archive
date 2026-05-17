'use client';

import { useState } from 'react';
import { X, CheckCircle2, Clock, BookOpen, Trash2, FileText } from 'lucide-react';
import { ActivityType, ExamPeriod, TimeSlot } from '@/types';
import { useStore } from '@/store/useStore';

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
      <div className="relative w-full max-w-md mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">
              {isEditing ? 'Edit Time Slot' : 'Add Time Slot'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={handleDelete}
                className="text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete slot"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</label>
            <input
              type="date"
              value={date}
              min={period.startDate}
              max={period.endDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            >
              {period.subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Activity type */}
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

          {/* Note */}
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEditing ? 'Save Changes' : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
