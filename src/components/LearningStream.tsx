'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { extractTags } from '@/utils/helpers';
import { format } from 'date-fns';
import { Trash2, X } from 'lucide-react';

export function LearningStream({ weekId }: { weekId: string }) {
  const [text, setText] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const week = useStore((state) => state.weeks[weekId]);
  const addLearning = useStore((state) => state.addLearning);
  const removeLearning = useStore((state) => state.removeLearning);

  if (!week) return null;

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tags = extractTags(trimmed);
    addLearning(weekId, trimmed, tags);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      if (text.endsWith('\n')) {
        e.preventDefault();
        setText(text.slice(0, -1));
        handleSave();
      }
    }
  };

  // All unique tags across this week's learnings
  const allTags = Array.from(new Set(week.learnings.flatMap((l) => l.tags))).sort();

  const filteredLearnings = activeTag
    ? week.learnings.filter((l) => l.tags.includes(activeTag))
    : week.learnings;

  const renderTextWithTags = (content: string) => {
    const parts = content.split(/(#[\w-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-purplePrimary font-mono bg-purpleSoft px-1 py-0.5 rounded-sm">
            {part.toLowerCase()}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

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
        <p className="text-xs text-muted-foreground mt-1">
          Drop quick learning notes, ideas, or observations here.
        </p>
      </div>

      {/* Input area */}
      <div className="p-6 border-b border-border/50 bg-muted/5 relative group">
        <textarea
          placeholder="What did you figure out? Use #tags... (Press Enter twice to save)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[100px] bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed shadow-sm"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] font-mono text-muted-foreground/50">
            {text.length > 0 ? `${text.length} chars` : ''}
          </span>
          <div className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border border-border opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-sm">
            Enter twice / ⌘↵ to save
          </div>
        </div>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border/50 overflow-x-auto shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0">Filter:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full transition-colors shrink-0 ${
                activeTag === tag
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-purpleSoft text-purplePrimary hover:bg-primary/20'
              }`}
            >
              #{tag}
              {activeTag === tag && <X className="w-2.5 h-2.5 ml-0.5" />}
            </button>
          ))}
        </div>
      )}

      {/* Insights list */}
      <div className="flex flex-col px-6 py-6 pb-24 overflow-y-auto h-full space-y-8">
        {filteredLearnings.slice().reverse().map((entry) => (
          <div
            key={entry.id}
            className="group relative flex flex-col gap-2 pl-4 border-l-2 border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                {format(entry.timestamp, 'MMM d, h:mm a')}
              </span>
              <button
                onClick={() => removeLearning(weekId, entry.id)}
                className="text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none shrink-0"
                title="Delete insight"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {renderTextWithTags(entry.text)}
            </p>
            {entry.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {entry.tags.map((t) => (
                  <span key={t} className="text-[10px] font-mono bg-purpleSoft text-purplePrimary px-1 py-0.5 rounded-sm">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {week.learnings.length === 0 && (
          <div className="text-sm text-muted-foreground italic text-center py-8">
            No insights archived yet this week.
          </div>
        )}
        {activeTag && filteredLearnings.length === 0 && week.learnings.length > 0 && (
          <div className="text-sm text-muted-foreground italic text-center py-8">
            No insights tagged #{activeTag} yet.
          </div>
        )}
      </div>
    </div>
  );
}
