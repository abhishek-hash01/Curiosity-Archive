'use client';

import { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Calendar, Target, ChevronRight, Pencil } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ExamPeriod } from '@/types';
import { DatePicker } from './DatePicker';

interface Props {
  onClose: () => void;
  onCreated: (periodId: string) => void;
  editPeriod?: ExamPeriod | null;
}

export function ExamPeriodSetup({ onClose, onCreated, editPeriod }: Props) {
  const createExamPeriod = useStore((s) => s.createExamPeriod);
  const updateExamPeriod = useStore((s) => s.updateExamPeriod);

  const isEditing = !!editPeriod;

  const [title, setTitle] = useState(editPeriod?.title ?? '');
  const [startDate, setStartDate] = useState(editPeriod?.startDate ?? '');
  const [endDate, setEndDate] = useState(editPeriod?.endDate ?? '');
  const [subjectInput, setSubjectInput] = useState('');
  const [subjects, setSubjects] = useState<string[]>(editPeriod?.subjects ?? []);
  const [dailyHours, setDailyHours] = useState(editPeriod?.dailyTargetHours?.toString() ?? '');
  const [error, setError] = useState('');

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    setSubjects((prev) => [...prev, trimmed]);
    setSubjectInput('');
  };

  const removeSubject = (s: string) => setSubjects((prev) => prev.filter((x) => x !== s));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubject();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Give this exam period a name.');
    if (!startDate || !endDate) return setError('Set both start and end dates.');
    if (new Date(startDate) > new Date(endDate)) return setError('Start date must be before end date.');
    if (subjects.length === 0) return setError('Add at least one subject.');

    if (isEditing && editPeriod) {
      updateExamPeriod(editPeriod.id, {
        title: title.trim(),
        startDate,
        endDate,
        subjects,
        dailyTargetHours: dailyHours ? Number(dailyHours) : undefined,
      });
      onCreated(editPeriod.id);
    } else {
      const id = createExamPeriod(
        title.trim(),
        startDate,
        endDate,
        subjects,
        dailyHours ? Number(dailyHours) : undefined
      );
      onCreated(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-border bg-background shadow-xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEditing ? <Pencil className="w-4 h-4 text-primary" /> : <BookOpen className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {isEditing ? 'Edit Exam Period' : 'New Exam Period'}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {isEditing ? 'Update your study timetable settings' : 'Set up your study timetable'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Period Name
            </label>
            <input
              type="text"
              placeholder="e.g. End Semester Exams"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              label="📅 Start Date"
            />
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              label="📅 End Date"
              minDate={startDate || undefined}
            />
          </div>

          {/* Subjects */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Subjects
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a subject…"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                type="button"
                onClick={addSubject}
                className="rounded-md border border-border px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {subjects.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-mono px-2 py-1 rounded-full border border-primary/20"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSubject(s)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Daily target (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Daily Study Target (hours) <span className="font-normal normal-case">— optional</span>
            </label>
            <input
              type="number"
              min="1"
              max="18"
              step="0.5"
              placeholder="e.g. 8"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              className="w-32 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 font-mono">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Create Period'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
