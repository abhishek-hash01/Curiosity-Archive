'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function WeeklyReflection({ weekId }: { weekId: string }) {
  const week = useStore((state) => state.weeks[weekId]);
  const updateWeekReflection = useStore((state) => state.updateWeekReflection);
  
  // Use local state for the input to avoid constant store updates while typing
  const [reflection, setReflection] = useState('');

  // Sync local state when week loads
  useEffect(() => {
    if (week?.weekReflection) {
      setReflection(week.weekReflection);
    }
  }, [week?.weekReflection]);

  if (!week) return null;

  const handleSave = () => {
    updateWeekReflection(weekId, reflection.trim());
  };

  return (
    <div className="flex flex-col gap-4 bg-muted/20 p-5 rounded-xl border border-border">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-primary">Weekly Reflection</h2>
        <p className="text-xs text-muted-foreground mt-1">
          What changed in your thinking this week? Synthesize your top observation.
        </p>
      </div>
      
      <div className="relative group">
        <textarea
          placeholder="e.g., Realized MediKarya must simulate uncertainty instead of simply presenting static cases."
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onBlur={handleSave}
          className="w-full min-h-[100px] bg-background border border-border rounded-md px-3 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed shadow-sm"
        />
        <div className="absolute -bottom-6 right-1 text-xs text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
          Saves automatically on blur
        </div>
      </div>
    </div>
  );
}
