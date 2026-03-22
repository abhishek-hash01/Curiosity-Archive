'use client';

import { useStore } from '@/store/useStore';
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import dynamic from 'next/dynamic';
import { Trash2, Plus, Tag as TagIcon, X, CheckCircle2, Circle, Search } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { AppState } from '@/types';

// Dynamically import React Flow to prevent SSR issues
const InsightsGraph = dynamic<{
  weeks: AppState['weeks'];
  projects: AppState['projects'];
  searchTag: string;
  onWeekSelect: (weekId: string | null) => void;
}>(() => import('@/components/InsightsGraph'), { ssr: false });

export default function InsightsPage() {
  const weeks = useStore((state) => state.weeks);
  const projects = useStore((state) => state.projects);
  const [activeTab, setActiveTab] = useState<'graph' | 'trends' | 'projects'>('graph');
  const [searchTag, setSearchTag] = useState('');
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  const tagFrequencies = useMemo(() => {
    const freqs = new Map<string, number>();
    Object.values(weeks).forEach(week => {
      week.learnings.forEach(learning => {
        learning.tags.forEach(tag => {
          freqs.set(tag, (freqs.get(tag) || 0) + 1);
        });
      });
    });
    return Array.from(freqs.entries())
      .map(([name, count]) => ({ name: `#${name}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [weeks]);

  const weeklyActivity = useMemo(() => {
    return Object.values(weeks)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map(week => ({
        name: format(parseISO(week.startDate), 'MMM d'),
        insights: week.learnings.length,
        goals: week.goals.filter(g => g.completed).length,
      }));
  }, [weeks]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-8 py-6 border-b border-border shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insights Map</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">The Brain</p>
        </div>

        <div className="flex bg-muted/50 p-1 rounded-md border border-border">
          {(['graph', 'projects', 'trends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors capitalize ${activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab === 'graph' ? 'Terrain Graph' : tab === 'projects' ? 'Project Anchors' : 'Dashboards'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative w-full h-full">

        {/* ── Terrain Graph ── */}
        {activeTab === 'graph' && (
          <div className="flex flex-col h-full">
            {/* Search bar */}
            <div className="px-6 py-3 border-b border-border/50 shrink-0 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search by tag… e.g. ml-skills"
                value={searchTag}
                onChange={e => setSearchTag(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50 font-mono"
              />
              {searchTag && (
                <button onClick={() => setSearchTag('')} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Graph + optional preview panel */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 min-w-0">
                <InsightsGraph
                  weeks={weeks}
                  projects={projects}
                  searchTag={searchTag}
                  onWeekSelect={setSelectedWeekId}
                />
              </div>

              {/* Week preview side panel */}
              {selectedWeekId && weeks[selectedWeekId] && (
                <WeekPreviewPanel
                  weekId={selectedWeekId}
                  onClose={() => setSelectedWeekId(null)}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && <ProjectManager />}

        {activeTab === 'trends' && (
          <div className="p-8 h-full overflow-y-auto max-w-5xl mx-auto flex flex-col gap-12 pb-24">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold tracking-tight">Dominant Topics</h3>
              <p className="text-sm text-muted-foreground -mt-2 mb-4">Most frequently used tags across all weeks</p>
              <div className="h-[300px] w-full border border-border/50 rounded-xl p-6 bg-muted/10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tagFrequencies} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {tagFrequencies.map((_, index) => (
                        <Cell key={`cell-${index}`} fill="var(--primary)" opacity={0.8 - index * 0.05} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-semibold tracking-tight">Curiosity Over Time</h3>
              <p className="text-sm text-muted-foreground -mt-2 mb-4">Volume of insights recorded per week</p>
              <div className="h-[300px] w-full border border-border/50 rounded-xl p-6 bg-muted/10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                    <Bar dataKey="insights" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Week Preview Panel ─────────────────────────────────────────────────────
function WeekPreviewPanel({ weekId, onClose }: { weekId: string; onClose: () => void }) {
  const week = useStore(state => state.weeks[weekId]);
  if (!week) return null;

  const parsedDate = parseISO(week.startDate);
  const completedGoals = week.goals.filter(g => g.completed).length;

  const renderTextWithTags = (content: string) => {
    const parts = content.split(/(#[\w-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-purplePrimary font-mono bg-purpleSoft px-1 py-0.5 rounded-sm text-[10px]">
            {part.toLowerCase()}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-[300px] border-l border-border bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300 shrink-0">
      {/* Panel header */}
      <div className="p-4 border-b border-border/50 flex items-start justify-between gap-2 shrink-0">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Week of {format(parsedDate, 'MMM d, yyyy')}</h3>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {completedGoals}/{week.goals.length} goals · {week.learnings.length} insights
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Goals section */}
        {week.goals.length > 0 && (
          <div className="p-4 border-b border-border/50">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Goals</h4>
            <div className="flex flex-col gap-2">
              {week.goals.map(goal => (
                <div key={goal.id} className="flex items-start gap-2">
                  {goal.completed
                    ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    : <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />}
                  <span className={`text-xs leading-relaxed ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {goal.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights section */}
        {week.learnings.length > 0 && (
          <div className="p-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Insights</h4>
            <div className="flex flex-col gap-4">
              {week.learnings.slice().reverse().map(entry => (
                <div key={entry.id} className="flex flex-col gap-1.5 pl-3 border-l-2 border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {format(entry.timestamp, 'MMM d, h:mm a')}
                  </span>
                  <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {renderTextWithTags(entry.text)}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {entry.tags.map(t => (
                        <span key={t} className="text-[9px] font-mono bg-purpleSoft text-purplePrimary px-1 py-0.5 rounded-sm">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {week.goals.length === 0 && week.learnings.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No data recorded for this week.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Project Manager ────────────────────────────────────────────────────────
function ProjectManager() {
  const projects = useStore(state => state.projects);
  const addProject = useStore(state => state.addProject);
  const removeProject = useStore(state => state.removeProject);
  const [name, setName] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagsStr.trim()) return;
    const tags = tagsStr.split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim().toLowerCase())
      .filter(Boolean);
    if (tags.length > 0) {
      addProject(name.trim(), tags);
      setName(''); setTagsStr('');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto max-w-4xl mx-auto flex flex-col gap-8 pb-24">
      <div>
        <h3 className="font-semibold tracking-tight text-lg mt-2">Project Anchors</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Create long-living project nodes. Any week that contains the core tags of a project will automatically anchor itself to that project on the Terrain Graph.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end bg-muted/10 p-6 rounded-xl border border-border/50">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Project Name</label>
          <input type="text" required placeholder="e.g. MediKarya" value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Core Tags (comma separated)</label>
          <div className="relative">
            <TagIcon className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground/50" />
            <input type="text" required placeholder="medikarya, clinical, education" value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          <Plus className="w-4 h-4" />Create
        </button>
      </form>

      <div className="flex flex-col gap-4 mt-4">
        {Object.values(projects).length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground italic border border-border/20 rounded-xl bg-muted/5">
            No projects created yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(projects).map(project => (
              <div key={project.id} className="group relative flex flex-col justify-between items-start gap-4 p-5 rounded-xl border border-border bg-background hover:bg-muted/10 transition-colors">
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-foreground tracking-tight">{project.name}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-[4px]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => removeProject(project.id)}
                  className="absolute top-4 right-4 text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
