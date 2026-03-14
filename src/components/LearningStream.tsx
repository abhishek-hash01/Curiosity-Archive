'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { extractTags } from '@/utils/helpers';
import { format } from 'date-fns';

export function LearningStream({ weekId }: { weekId: string }) {
  const [text, setText] = useState('');
  const week = useStore((state) => state.weeks[weekId]);
  const addLearning = useStore((state) => state.addLearning);

  if (!week) return null;

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    const tags = extractTags(trimmed);
    addLearning(weekId, trimmed, tags);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
      return;
    }
    
    // Save on double enter (if the text already ends with a newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      if (text.endsWith('\n')) {
        e.preventDefault();
        // Remove the extra newline at the end before saving
        setText(text.slice(0, -1));
        handleSave();
      }
    }
  };

  // Helper to highlight tags in the display
  const renderTextWithTags = (content: string) => {
    const parts = content.split(/(#[\w-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded-sm">
            {part.toLowerCase()}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="p-6 pb-4 border-b border-border/50 bg-muted/10">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Archived Insights</h2>
        <p className="text-xs text-muted-foreground mt-1">Drop quick learning notes, ideas, or observations here.</p>
      </div>

      <div className="p-6 border-b border-border/50 bg-muted/5 relative group">
          <textarea
            placeholder="What did you figure out? Use #tags... (Press Enter twice to save)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[100px] bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed shadow-sm"
          />
          <div className="absolute bottom-9 right-9 text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border border-border opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-sm">
            Enter twice / ⌘↵ to save
          </div>
      </div>

      <div className="flex flex-col px-6 py-6 pb-24 overflow-y-auto h-full space-y-8">
        {week.learnings.slice().reverse().map((entry) => (
          <div key={entry.id} className="group relative flex flex-col gap-2 pl-4 border-l-2 border-border/50 hover:border-primary/50 transition-colors">
            <span className="text-xs text-muted-foreground font-mono">
              {format(entry.timestamp, "MMM d, h:mm a")}
            </span>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {renderTextWithTags(entry.text)}
            </p>
          </div>
        ))}
        {week.learnings.length === 0 && (
          <div className="text-sm text-muted-foreground italic text-center py-8">
            No insights archived yet this week.
          </div>
        )}
      </div>
    </div>
  );
}
