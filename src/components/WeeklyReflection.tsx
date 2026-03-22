'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

const SECTIONS = [
  { key: 'wentWell' as const,   label: 'What went well?',              placeholder: 'e.g., Shipped the onboarding flow ahead of schedule.' },
  { key: 'surprised' as const,  label: 'What surprised you?',          placeholder: 'e.g., Users cared way more about speed than features.' },
  { key: 'different' as const,  label: 'What would you do differently?', placeholder: 'e.g., I\'d timebox research to 2 days max next time.' },
];

type SectionKey = 'wentWell' | 'surprised' | 'different';

export function WeeklyReflection({ weekId }: { weekId: string }) {
  const weeks = useStore((state) => state.weeks);
  const week = useStore((state) => state.weeks[weekId]);
  const updateWeekReflection = useStore((state) => state.updateWeekReflection);
  const updateReflectionSections = useStore((state) => state.updateReflectionSections);

  const [sections, setSections] = useState({ wentWell: '', surprised: '', different: '' });
  const [saved, setSaved] = useState(false);
  const [showPrev, setShowPrev] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('wentWell');
  const textareaRefs = useRef<Record<SectionKey, HTMLTextAreaElement | null>>({ wentWell: null, surprised: null, different: null });

  // Load saved sections (or migrate from legacy weekReflection string)
  useEffect(() => {
    if (week?.reflectionSections) {
      setSections(week.reflectionSections);
    } else if (week?.weekReflection) {
      // Migrate: put old reflection into wentWell
      setSections({ wentWell: week.weekReflection, surprised: '', different: '' });
    }
  }, [week?.reflectionSections, week?.weekReflection]);

  // Previous week's reflection
  const prevReflection = useMemo(() => {
    const sorted = Object.values(weeks).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const idx = sorted.findIndex(w => w.id === weekId);
    for (let i = idx - 1; i >= 0; i--) {
      const s = sorted[i].reflectionSections;
      const legacy = sorted[i].weekReflection;
      const text = s ? [s.wentWell, s.surprised, s.different].filter(Boolean).join('\n\n') : legacy;
      if (text?.trim()) return { text, startDate: sorted[i].startDate };
    }
    return null;
  }, [weeks, weekId]);

  if (!week) return null;

  const filledCount = [sections.wentWell, sections.surprised, sections.different].filter(s => s.trim()).length;

  const handleBlur = (key: SectionKey) => {
    const updated = { ...sections };
    updateReflectionSections(weekId, updated);
    // Keep legacy weekReflection in sync for timeline display
    const combined = [sections.wentWell, sections.surprised, sections.different].filter(Boolean).join('\n\n');
    updateWeekReflection(weekId, combined);
    if (updated[key].trim()) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const toggleSection = (key: SectionKey) => {
    setExpandedSection(expandedSection === key ? null : key);
    setTimeout(() => textareaRefs.current[key]?.focus(), 50);
  };

  return (
    <div className="flex flex-col gap-4 bg-muted/20 p-5 rounded-xl border border-border">
      {/* Header with completion dots */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-primary">Weekly Reflection</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Reflect on 3 things from this week.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {SECTIONS.map((s, i) => (
            <div
              key={s.key}
              title={s.label}
              className="rounded-full transition-all duration-300"
              style={{
                width: 8, height: 8,
                background: i < filledCount ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
          {saved && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-primary bg-purpleSoft px-2 py-0.5 rounded-full border border-primary/20 animate-in fade-in duration-200 ml-2">
              <Check className="w-2.5 h-2.5" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Previous week's reflection */}
      {prevReflection && (
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setShowPrev(!showPrev)}
            className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors self-start"
          >
            {showPrev ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Last week you wrote…
          </button>
          {showPrev && (
            <p className="text-xs text-muted-foreground/80 italic bg-muted/30 border border-border/50 rounded-md px-3 py-2.5 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200">
              {prevReflection.text}
            </p>
          )}
        </div>
      )}

      {/* Three accordion sections */}
      <div className="flex flex-col gap-2">
        {SECTIONS.map(({ key, label, placeholder }) => {
          const isFilled = sections[key].trim().length > 0;
          const isOpen = expandedSection === key;

          return (
            <div key={key} className={`rounded-lg border transition-colors ${isOpen ? 'border-primary/30 bg-background' : 'border-border/60 bg-background/40'}`}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left gap-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                    style={{ background: isFilled ? 'var(--primary)' : 'var(--border)' }}
                  />
                  <span className={`text-xs font-semibold ${isOpen ? 'text-primary' : isFilled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isFilled && !isOpen && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {sections[key].trim().split(/\s+/).filter(Boolean).length}w
                    </span>
                  )}
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>

              {/* Section content */}
              {isOpen && (
                <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <textarea
                    ref={el => { textareaRefs.current[key] = el; }}
                    placeholder={placeholder}
                    value={sections[key]}
                    onChange={e => setSections(prev => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => handleBlur(key)}
                    rows={3}
                    className="w-full bg-transparent border-none focus:outline-none text-sm resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/40"
                  />
                  {sections[key].trim() && (
                    <span className="text-[10px] font-mono text-muted-foreground/40">
                      {sections[key].trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
