'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { extractTags } from '@/utils/helpers';
import { format } from 'date-fns';
import { Trash2, X, Sparkles, Pencil, Check } from 'lucide-react';

const MILESTONES = [10, 25, 50, 100, 200, 500];
function checkMilestone(before: number, after: number): number | null {
  for (const m of MILESTONES) { if (before < m && after >= m) return m; }
  return null;
}

function isToday(timestamp: number) {
  const d = new Date(timestamp), n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export function LearningStream({ weekId }: { weekId: string }) {
  const [text, setText] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null); // null = All
  const [milestone, setMilestone] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const weeks = useStore((state) => state.weeks);
  const week = useStore((state) => state.weeks[weekId]);
  const addLearning = useStore((state) => state.addLearning);
  const removeLearning = useStore((state) => state.removeLearning);
  const updateLearning = useStore((state) => state.updateLearning);

  if (!week) return null;

  const lifetimeCount = Object.values(weeks).reduce((sum, w) => sum + w.learnings.length, 0);

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tags = extractTags(trimmed);
    const hit = checkMilestone(lifetimeCount, lifetimeCount + 1);
    addLearning(weekId, trimmed, tags);
    setText('');
    if (hit) { setMilestone(hit); setTimeout(() => setMilestone(null), 3500); }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSave(); return; }
    if (e.key === 'Enter' && !e.shiftKey && text.endsWith('\n')) { e.preventDefault(); setText(text.slice(0, -1)); handleSave(); }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (id: string, t: string) => { setEditingId(id); setEditText(t); };
  const commitEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (trimmed) updateLearning(weekId, editingId, trimmed, extractTags(trimmed));
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') cancelEdit();
  };

  // ── Tag navigator data ────────────────────────────────────────────────────
  // All unique tags with counts
  const tagCounts = new Map<string, number>();
  week.learnings.forEach(l => l.tags.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
  const allTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));

  // Filtered list
  const filtered = activeTag
    ? week.learnings.filter(l => l.tags.includes(activeTag))
    : week.learnings;
  const sorted = filtered.slice().reverse();

  const todayEntries = sorted.filter(e => isToday(e.timestamp));
  const earlierEntries = sorted.filter(e => !isToday(e.timestamp));

  const renderTextWithTags = (content: string) =>
    content.split(/(#[\w-]+)/g).map((part, i) =>
      part.startsWith('#')
        ? <span key={i} className="text-purplePrimary font-mono bg-purpleSoft px-1 py-0.5 rounded-sm">{part.toLowerCase()}</span>
        : <span key={i}>{part}</span>
    );

  const renderEntry = (entry: (typeof week.learnings)[0]) => (
    <div key={entry.id} className="group relative flex flex-col gap-2 pl-4 border-l-2 border-border/50 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-mono">{format(entry.timestamp, 'h:mm a')}</span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
          {editingId !== entry.id && (
            <button onClick={() => startEdit(entry.id, entry.text)} className="text-muted-foreground/50 hover:text-primary transition-colors focus:outline-none" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => removeLearning(weekId, entry.id)} className="text-muted-foreground/30 hover:text-red-400 transition-colors focus:outline-none" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editingId === entry.id ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown} onBlur={commitEdit}
            className="w-full bg-background border border-primary/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none leading-relaxed shadow-sm min-h-[60px]"
          />
          <div className="flex items-center gap-2">
            <button onMouseDown={e => { e.preventDefault(); commitEdit(); }} className="flex items-center gap-1 text-[11px] font-mono text-primary hover:text-primary/80">
              <Check className="w-3 h-3" /> Save (⌘↵)
            </button>
            <span className="text-muted-foreground text-[10px]">·</span>
            <button onMouseDown={e => { e.preventDefault(); cancelEdit(); }} className="text-[11px] font-mono text-muted-foreground hover:text-foreground">Esc to cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed cursor-text" onDoubleClick={() => startEdit(entry.id, entry.text)}>
          {renderTextWithTags(entry.text)}
        </p>
      )}

      {editingId !== entry.id && entry.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-0.5">
          {entry.tags.map(t => (
            <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)} className={`text-[10px] font-mono px-1 py-0.5 rounded-sm transition-colors ${activeTag === t ? 'bg-primary text-primary-foreground' : 'bg-purpleSoft text-purplePrimary hover:bg-primary/20'}`}>
              #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">

      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/50 bg-muted/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Archived Insights</h2>
          {week.learnings.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              {week.learnings.length} insight{week.learnings.length !== 1 ? 's' : ''} this week
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Drop quick learning notes. Double-click any entry to edit.</p>
      </div>

      {/* Input area */}
      <div className="p-6 border-b border-border/50 bg-muted/5 relative group">
        <textarea
          placeholder="What did you figure out? Use #tags... (Enter twice to save)"
          value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
          className="w-full min-h-[90px] bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed shadow-sm"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] font-mono text-muted-foreground/50">{text.length > 0 ? `${text.length} chars` : ''}</span>
          <div className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border border-border opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-sm">
            Enter twice / ⌘↵ to save
          </div>
        </div>
      </div>

      {/* Milestone toast */}
      {milestone && (
        <div className="mx-6 mt-3 flex items-center gap-2.5 bg-purpleSoft border border-primary/25 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs text-primary font-medium">Insight #{milestone} — milestone unlocked! 🎉</p>
        </div>
      )}

      {/* ── Tag navigator ── */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 overflow-x-auto shrink-0">
          {/* All pill */}
          <button
            onClick={() => setActiveTag(null)}
            className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full transition-colors shrink-0 font-semibold ${
              activeTag === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All <span className="opacity-60">{week.learnings.length}</span>
          </button>

          <div className="w-px h-4 bg-border/60 shrink-0" />

          {allTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full transition-colors shrink-0 ${
                activeTag === tag ? 'bg-primary text-primary-foreground' : 'bg-purpleSoft text-purplePrimary hover:bg-primary/20'
              }`}
            >
              #{tag} <span className="opacity-60">{count}</span>
              {activeTag === tag && <X className="w-2.5 h-2.5 ml-0.5" />}
            </button>
          ))}
        </div>
      )}

      {/* Insights list */}
      <div className="flex flex-col px-6 py-6 pb-24 overflow-y-auto h-full space-y-6">
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground italic text-center py-8">
            {week.learnings.length === 0 ? 'No insights archived yet this week.' : `No insights tagged #${activeTag} yet.`}
          </div>
        )}

        {/* Today section */}
        {todayEntries.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Today</span>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
            {todayEntries.map(renderEntry)}
          </div>
        )}

        {/* Earlier section */}
        {earlierEntries.length > 0 && (
          <div className="flex flex-col gap-5">
            {todayEntries.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Earlier this week</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
            )}
            {earlierEntries.map(renderEntry)}
          </div>
        )}
      </div>
    </div>
  );
}
