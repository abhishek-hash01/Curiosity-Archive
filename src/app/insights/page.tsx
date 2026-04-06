'use client';

import { useStore } from '@/store/useStore';
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import dynamic from 'next/dynamic';
import { Trash2, Plus, Tag as TagIcon, X, CheckCircle2, Circle, Search } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { AppState } from '@/types';

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
    Object.values(weeks).forEach((week) => {
      week.learnings.forEach((learning) => {
        learning.tags.forEach((tag) => {
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
      .map((week) => ({
        name: format(parseISO(week.startDate), 'MMM d'),
        insights: week.learnings.length,
        goals: week.goals.filter((goal) => goal.completed).length,
      }));
  }, [weeks]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border bg-background/70 px-8 py-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Terrain Graph
              <span className="h-1 w-1 rounded-full bg-primary/60" />
              Obsidian-inspired
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Insights Map</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              A calmer view of your weeks, projects, goals, and recurring ideas. Explore the graph, then open a week to inspect the notes behind it.
            </p>
          </div>

          <div className="flex self-start rounded-md border border-border bg-muted/50 p-1 lg:self-auto">
            {(['graph', 'projects', 'trends'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-sm px-3 py-1.5 text-xs font-medium capitalize transition-colors ${activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'graph' ? 'Terrain Graph' : tab === 'projects' ? 'Project Anchors' : 'Dashboards'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative h-full w-full flex-1 overflow-hidden">
        {activeTab === 'graph' && (
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-border/50 bg-background/55 px-6 py-4 backdrop-blur-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex max-w-xl items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter by tag, like deep-work or ml-skills"
                    value={searchTag}
                    onChange={(event) => setSearchTag(event.target.value)}
                    className="flex-1 bg-transparent text-sm font-mono focus:outline-none placeholder:text-muted-foreground/50"
                  />
                  {searchTag && (
                    <button
                      onClick={() => setSearchTag('')}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">Click week to inspect</span>
                  <span className="rounded-full bg-muted px-3 py-1">Click goal or insight to expand</span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="min-w-0 flex-1">
                <InsightsGraph
                  weeks={weeks}
                  projects={projects}
                  searchTag={searchTag}
                  onWeekSelect={setSelectedWeekId}
                />
              </div>

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
          <div className="mx-auto flex h-full max-w-5xl flex-col gap-12 overflow-y-auto p-8 pb-24">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold tracking-tight">Dominant Topics</h3>
              <p className="-mt-2 mb-4 text-sm text-muted-foreground">Most frequently used tags across all weeks</p>
              <div className="h-[300px] w-full rounded-xl border border-border/50 bg-muted/10 p-6">
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
              <p className="-mt-2 mb-4 text-sm text-muted-foreground">Volume of insights recorded per week</p>
              <div className="h-[300px] w-full rounded-xl border border-border/50 bg-muted/10 p-6">
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

function WeekPreviewPanel({ weekId, onClose }: { weekId: string; onClose: () => void }) {
  const week = useStore((state) => state.weeks[weekId]);
  if (!week) return null;

  const parsedDate = parseISO(week.startDate);
  const completedGoals = week.goals.filter((goal) => goal.completed).length;

  const renderTextWithTags = (content: string) => {
    const parts = content.split(/(#[\w-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="rounded-sm bg-purpleSoft px-1 py-0.5 font-mono text-[10px] text-purplePrimary">
            {part.toLowerCase()}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-border bg-background animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between gap-2 border-b border-border/50 p-4 shrink-0">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Week of {format(parsedDate, 'MMM d, yyyy')}</h3>
          <p className="mt-0.5 text-xs font-mono text-muted-foreground">
            {completedGoals}/{week.goals.length} goals · {week.learnings.length} insights
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {week.goals.length > 0 && (
          <div className="border-b border-border/50 p-4">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Goals</h4>
            <div className="flex flex-col gap-2">
              {week.goals.map((goal) => (
                <div key={goal.id} className="flex items-start gap-2">
                  {goal.completed
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />}
                  <span className={`text-xs leading-relaxed ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {goal.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {week.learnings.length > 0 && (
          <div className="p-4">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Insights</h4>
            <div className="flex flex-col gap-4">
              {week.learnings.slice().reverse().map((entry) => (
                <div key={entry.id} className="flex flex-col gap-1.5 border-l-2 border-border/50 pl-3">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {format(entry.timestamp, 'MMM d, h:mm a')}
                  </span>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
                    {renderTextWithTags(entry.text)}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="rounded-sm bg-purpleSoft px-1 py-0.5 font-mono text-[9px] text-purplePrimary">
                          #{tag}
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
          <div className="p-8 text-center text-xs italic text-muted-foreground">
            No data recorded for this week.
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectManager() {
  const projects = useStore((state) => state.projects);
  const addProject = useStore((state) => state.addProject);
  const removeProject = useStore((state) => state.removeProject);
  const [name, setName] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !tagsStr.trim()) return;
    const tags = tagsStr
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#/, '').trim().toLowerCase())
      .filter(Boolean);

    if (tags.length > 0) {
      addProject(name.trim(), tags);
      setName('');
      setTagsStr('');
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-8 overflow-y-auto p-8 pb-24">
      <div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight">Project Anchors</h3>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Create long-living project nodes. Any week that contains the core tags of a project will automatically anchor itself to that project on the Terrain Graph.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col items-end gap-4 rounded-xl border border-border/50 bg-muted/10 p-6 md:flex-row">
        <div className="w-full flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Project Name</label>
          <input
            type="text"
            required
            placeholder="e.g. MediKarya"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="w-full flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Core Tags (comma separated)</label>
          <div className="relative">
            <TagIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              required
              placeholder="medikarya, clinical, education"
              value={tagsStr}
              onChange={(event) => setTagsStr(event.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:mt-0 md:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-4">
        {Object.values(projects).length === 0 ? (
          <div className="rounded-xl border border-border/20 bg-muted/5 py-8 text-center text-sm italic text-muted-foreground">
            No projects created yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.values(projects).map((project) => (
              <div key={project.id} className="group relative flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:bg-muted/10">
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold tracking-tight text-foreground">{project.name}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span key={tag} className="rounded-[4px] bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => removeProject(project.id)}
                  className="absolute right-4 top-4 text-muted-foreground/30 opacity-0 transition-all hover:text-red-400 focus:outline-none group-hover:opacity-100"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
