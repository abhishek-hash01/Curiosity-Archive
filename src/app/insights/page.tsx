'use client';

import { useStore } from '@/store/useStore';
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import dynamic from 'next/dynamic';
import { Trash2, Plus, Tag as TagIcon } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { AppState } from '@/types';

// Dynamically import React Flow to prevent SSR issues
const InsightsGraph = dynamic<{ weeks: AppState['weeks'], projects: AppState['projects'] }>(() => import('@/components/InsightsGraph'), {
  ssr: false,
});

export default function InsightsPage() {
  const weeks = useStore((state) => state.weeks);
  const projects = useStore((state) => state.projects);
  const [activeTab, setActiveTab] = useState<'graph' | 'trends' | 'projects'>('graph');

  // Compute tag frequencies
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
      .slice(0, 10); // top 10
  }, [weeks]);

  // Compute weeks with insights for activity chart
  const weeklyActivity = useMemo(() => {
    return Object.values(weeks)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map(week => ({
        name: format(parseISO(week.startDate), "MMM d"),
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
          <button 
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${activeTab === 'graph' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Terrain Graph
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${activeTab === 'projects' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Project Anchors
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${activeTab === 'trends' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Dashboards
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative w-full h-full">
        {activeTab === 'graph' && <InsightsGraph weeks={weeks} projects={projects} />}
        
        {activeTab === 'projects' && <ProjectManager />}

        {activeTab === 'trends' && (
          <div className="p-8 h-full overflow-y-auto max-w-5xl mx-auto flex flex-col gap-12 pb-24">
            
            {/* Top Tags Bar Chart */}
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
                      {tagFrequencies.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="var(--primary)" opacity={0.8 - (index * 0.05)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Activity Line/Bar */}
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

function ProjectManager() {
  const projects = useStore((state) => state.projects);
  const addProject = useStore((state) => state.addProject);
  const removeProject = useStore((state) => state.removeProject);
  
  const [name, setName] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagsStr.trim()) return;
    
    // Extract tags like "#ai, #medikarya" or just "ai medikarya"
    const tags = tagsStr.split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim().toLowerCase())
      .filter(Boolean);
      
    if (tags.length > 0) {
      addProject(name.trim(), tags);
      setName('');
      setTagsStr('');
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
          <input
            type="text"
            required
            placeholder="e.g. MediKarya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Core Tags (comma separated)</label>
          <div className="relative">
            <TagIcon className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground/50" />
            <input
              type="text"
              required
              placeholder="medikarya, clinical, education"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          <Plus className="w-4 h-4" />
          Create
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
