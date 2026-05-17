'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ExamPeriodSetup } from '@/components/ExamPeriodSetup';
import { ExamTimetable } from '@/components/ExamTimetable';
import { FocusTimer } from '@/components/FocusTimer';
import { StudyHeatmap } from '@/components/StudyHeatmap';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  BookOpen,
  Plus,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Pencil,
  Flame,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { ExamPeriod, TimeSlot } from '@/types';

export default function ExamPage() {
  const examPeriods = useStore((s) => s.examPeriods);
  const deleteExamPeriod = useStore((s) => s.deleteExamPeriod);

  const [showSetup, setShowSetup] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ExamPeriod | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [focusSlot, setFocusSlot] = useState<{ slot: TimeSlot; period: ExamPeriod } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const periods = Object.values(examPeriods).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const selectedPeriod = selectedId ? examPeriods[selectedId] : null;

  const handleCreated = (id: string) => {
    setShowSetup(false);
    setEditingPeriod(null);
    setSelectedId(id);
    setMobileSidebar(false);
  };

  const handleDelete = (id: string) => {
    deleteExamPeriod(id);
    if (selectedId === id) setSelectedId(null);
    setConfirmDelete(null);
  };

  const today = new Date();

  const getStatus = (p: ExamPeriod): 'active' | 'upcoming' | 'past' => {
    const start = parseISO(p.startDate);
    const end = parseISO(p.endDate);
    if (today < start) return 'upcoming';
    if (today > end) return 'past';
    return 'active';
  };

  // Mobile period selector
  const MobilePeriodBar = () => (
    <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border shrink-0 overflow-x-auto bg-background">
      <button
        onClick={() => setMobileSidebar(true)}
        className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>
      {periods.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {periods.map((p) => {
            const status = getStatus(p);
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedId(p.id); setShowHeatmap(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                  selectedId === p.id
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  status === 'active' ? 'bg-green-500' : status === 'upcoming' ? 'bg-yellow-500' : 'bg-muted-foreground/30'
                }`} />
                {p.title}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => { setEditingPeriod(null); setShowSetup(true); }}
        className="p-2 rounded-md bg-primary text-primary-foreground shrink-0"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* ── Mobile top bar ── */}
      <MobilePeriodBar />

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileSidebar(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border flex flex-col animate-in slide-in-from-left duration-200 shadow-xl">
            <div className="px-4 py-5 border-b border-border shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h1 className="text-base font-semibold tracking-tight">Exam Mode</h1>
              </div>
              <button onClick={() => setMobileSidebar(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {periods.map((p) => {
                const status = getStatus(p);
                const totalSlots = p.slots.length;
                const completedSlots = p.slots.filter((s) => s.completed).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedId(p.id); setShowHeatmap(false); setMobileSidebar(false); }}
                    className={`w-full text-left rounded-lg border p-3 mb-1 transition-all ${
                      selectedId === p.id ? 'bg-primary/8 border-primary/30' : 'border-transparent hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                        status === 'active' ? 'bg-green-500' : status === 'upcoming' ? 'bg-yellow-500' : 'bg-muted-foreground/30'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {format(parseISO(p.startDate), 'MMM d')} – {format(parseISO(p.endDate), 'MMM d')}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-1">
                          {completedSlots}/{totalSlots} sessions
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-border shrink-0 flex flex-col gap-2">
              {periods.length > 0 && (
                <button
                  onClick={() => { setShowHeatmap((h) => !h); setMobileSidebar(false); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground"
                >
                  <Flame className="w-3.5 h-3.5" /> Study Heatmap
                </button>
              )}
              <button
                onClick={() => { setEditingPeriod(null); setShowSetup(true); setMobileSidebar(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md"
              >
                <Plus className="w-4 h-4" /> New Exam Period
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border flex-col h-full">
        <div className="px-4 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 mb-1">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h1 className="text-base font-semibold tracking-tight">Exam Mode</h1>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
            Timetable-style revision planner for your exam windows.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {periods.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                No exam periods yet. Create one to start building your study timetable.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {periods.map((p) => {
                const status = getStatus(p);
                const totalSlots = p.slots.length;
                const completedSlots = p.slots.filter((s) => s.completed).length;
                const daysSpan = differenceInDays(parseISO(p.endDate), parseISO(p.startDate)) + 1;

                return (
                  <div
                    key={p.id}
                    className={`group relative rounded-lg border p-3 cursor-pointer transition-all ${
                      selectedId === p.id
                        ? 'bg-primary/8 border-primary/30 shadow-sm'
                        : 'border-transparent hover:bg-muted/40 hover:border-border'
                    }`}
                    onClick={() => { setSelectedId(p.id); setShowHeatmap(false); }}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                        status === 'active' ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : status === 'upcoming' ? 'bg-yellow-500' : 'bg-muted-foreground/30'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{p.title}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {format(parseISO(p.startDate), 'MMM d')} – {format(parseISO(p.endDate), 'MMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] text-muted-foreground font-mono">{daysSpan}d</span>
                          <span className="text-[9px] text-muted-foreground">·</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{completedSlots}/{totalSlots} sessions</span>
                        </div>
                        {totalSlots > 0 && (
                          <div className="mt-2 h-0.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full bg-primary/60 transition-all duration-300" style={{ width: `${(completedSlots / totalSlots) * 100}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground/40 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); setEditingPeriod(p); setShowSetup(true); }} title="Edit">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id); }} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {confirmDelete === p.id && (
                      <div className="absolute inset-0 rounded-lg bg-background/95 border border-red-200 flex flex-col items-center justify-center gap-2 z-10"
                        onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-foreground text-center px-2">Delete this period?</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(p.id)} className="px-2.5 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                          <button onClick={() => setConfirmDelete(null)} className="px-2.5 py-1 text-xs border border-border rounded-md text-muted-foreground">Keep</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border shrink-0 flex flex-col gap-2">
          {periods.length > 0 && (
            <button onClick={() => setShowHeatmap((h) => !h)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                showHeatmap ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              }`}>
              <Flame className="w-3.5 h-3.5" /> Study Heatmap
            </button>
          )}
          <button onClick={() => { setEditingPeriod(null); setShowSetup(true); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Exam Period
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {showHeatmap ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Study Heatmap</h2>
                  <p className="text-xs text-muted-foreground font-mono">Completed study sessions over the last 90 days</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <StudyHeatmap periods={periods} />
              </div>
            </div>
          </div>
        ) : selectedPeriod ? (
          <>
            <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0 bg-background">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{selectedPeriod.title}</h2>
                    {getStatus(selectedPeriod) === 'active' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                      </span>
                    )}
                    <button onClick={() => { setEditingPeriod(selectedPeriod); setShowSetup(true); }}
                      className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
                    {format(parseISO(selectedPeriod.startDate), 'MMM d')} – {format(parseISO(selectedPeriod.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedPeriod.subjects.map((s) => (
                    <span key={s} className="text-[9px] sm:text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-1.5 sm:px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <ExamTimetable period={selectedPeriod} onStartFocus={(slot) => setFocusSlot({ slot, period: selectedPeriod })} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 sm:gap-6 p-6 sm:p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight mb-2">Exam Mode</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Plan your exams like a timetable. Create an exam period, add your subjects, then block out study sessions, PYQ practice, revision sprints, and mock tests.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-sm">
              {[
                { icon: Calendar, label: 'Arbitrary date range', desc: 'Any start & end date' },
                { icon: BookOpen, label: 'Per-subject sessions', desc: 'Colour-coded by type' },
                { icon: CheckCircle2, label: 'Track completion', desc: 'Tick sessions done' },
                { icon: Clock3, label: 'Time blocks', desc: 'Hour-level precision' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium leading-tight">{label}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setEditingPeriod(null); setShowSetup(true); }}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Create Your First Exam Period
            </button>
          </div>
        )}
      </main>

      {showSetup && (
        <ExamPeriodSetup onClose={() => { setShowSetup(false); setEditingPeriod(null); }} onCreated={handleCreated} editPeriod={editingPeriod} />
      )}

      {focusSlot && (
        <FocusTimer slot={focusSlot.slot} period={focusSlot.period} onClose={() => setFocusSlot(null)} />
      )}
    </div>
  );
}
