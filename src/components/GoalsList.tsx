'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

export function GoalsList({ weekId }: { weekId: string }) {
  const [text, setText] = useState('');
  const week = useStore((state) => state.weeks[weekId]);
  const addGoal = useStore((state) => state.addGoal);
  const toggleGoal = useStore((state) => state.toggleGoal);
  const removeGoal = useStore((state) => state.removeGoal);

  if (!week) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      e.preventDefault();
      addGoal(weekId, text.trim());
      setText('');
    }
  };

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
    <div className="flex flex-col gap-5 bg-background border border-border rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.02)]">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Goals for the Week</h2>
        <p className="text-xs text-muted-foreground mt-1">Add items using Enter. Use #tags for inline categorization.</p>
      </div>
      
      <div className="flex flex-col gap-1.5 mt-2">
        {week.goals.map((goal) => (
          <div 
            key={goal.id} 
            className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 group transition-colors"
          >
            <button 
              onClick={() => toggleGoal(weekId, goal.id)}
              className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none shrink-0"
            >
              {goal.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <span className={`text-sm flex-1 ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {renderTextWithTags(goal.text)}
            </span>
            <button
              onClick={() => removeGoal(weekId, goal.id)}
              className="mt-0.5 text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
              title="Delete goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Add goal... (Press Enter)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="mt-2 w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors shadow-sm"
      />
    </div>
  );
}
