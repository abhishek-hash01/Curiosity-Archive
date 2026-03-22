'use client';

import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Background,
  Controls,
  Node,
  NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AppState } from '@/types';
import { format, parseISO } from 'date-fns';

// ── Goals Ring ─────────────────────────────────────────────────────────────
function GoalsRing({ total, completed }: { total: number; completed: number }) {
  const R = 9;
  const CIRC = 2 * Math.PI * R;
  const dash = total > 0 ? (completed / total) * CIRC : 0;
  return (
    <svg
      width="24"
      height="24"
      style={{ position: 'absolute', top: 8, right: 8, flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r={R} fill="none" stroke="var(--border)" strokeWidth="2.5" />
      <circle
        cx="12" cy="12" r={R}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeDasharray={`${dash} ${CIRC}`}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

// ── Week Node ──────────────────────────────────────────────────────────────
function WeekNode({ data }: NodeProps) {
  const {
    label, insightCount, topTags, intensity, isGhost,
    goalsTotal, goalsCompleted, highlighted, searchActive,
  } = data as {
    label: string; insightCount: number; topTags: string[];
    intensity: number; isGhost: boolean;
    goalsTotal: number; goalsCompleted: number;
    highlighted: boolean; searchActive: boolean;
  };

  const borderColor =
    isGhost ? 'var(--border)'
    : intensity > 0.7 ? 'var(--primary)'
    : intensity > 0.4 ? 'var(--purple-secondary)'
    : 'var(--border)';

  const borderStyle = isGhost ? '1.5px dashed var(--border)' : `${intensity > 0.6 ? '2px' : '1px'} solid ${borderColor}`;
  const bg = isGhost ? 'transparent' : intensity > 0.5 ? '#f5f0fb' : 'var(--background)';
  const dimmed = searchActive && !highlighted;

  return (
    <div style={{
      background: bg,
      border: borderStyle,
      borderRadius: '12px',
      padding: `12px ${goalsTotal > 0 ? '36px' : '14px'} 12px 14px`,
      width: 168,
      fontFamily: 'var(--font-sans)',
      boxShadow: isGhost ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.07)',
      opacity: dimmed ? 0.25 : isGhost ? 0.5 : 1,
      transition: 'opacity 0.25s ease',
      position: 'relative',
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      {goalsTotal > 0 && <GoalsRing total={goalsTotal} completed={goalsCompleted} />}

      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '3px', letterSpacing: '-0.01em' }}>
        {label}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', marginBottom: topTags.length > 0 ? '7px' : 0 }}>
        {insightCount} insight{insightCount !== 1 ? 's' : ''}
      </div>
      {topTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {topTags.map(tag => (
            <span key={tag} style={{ fontSize: '9px', background: 'var(--purple-soft)', color: 'var(--primary)', fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '4px', lineHeight: '1.6' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

// ── Tag Cluster Node ───────────────────────────────────────────────────────
function TagNode({ data }: NodeProps) {
  const { tag, weekCount, highlighted, searchActive } = data as {
    tag: string; weekCount: number; highlighted: boolean; searchActive: boolean;
  };
  const dimmed = searchActive && !highlighted;
  const active = searchActive && highlighted;

  return (
    <div style={{
      background: active ? 'var(--primary)' : 'var(--purple-soft)',
      color: active ? 'var(--primary-foreground)' : 'var(--primary)',
      border: `1px solid ${active ? 'var(--primary)' : 'var(--purple-secondary)'}`,
      borderRadius: '20px',
      padding: '4px 10px',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      fontWeight: 600,
      whiteSpace: 'nowrap' as const,
      boxShadow: active ? '0 0 0 3px rgba(107,76,154,0.2)' : 'none',
      opacity: dimmed ? 0.2 : 1,
      transition: 'opacity 0.25s ease, background 0.25s ease',
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      #{tag}
      <span style={{ opacity: 0.55, fontSize: '9px', marginLeft: '4px' }}>×{weekCount}</span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

// ── Project Node ───────────────────────────────────────────────────────────
function ProjectNode({ data }: NodeProps) {
  const { label, tags } = data as { label: string; tags: string[] };
  return (
    <div style={{
      background: 'var(--primary)', color: 'var(--primary-foreground)',
      border: '1px solid var(--purple-secondary)', borderRadius: '16px',
      padding: '14px 20px', width: 200,
      fontFamily: 'var(--font-sans)', textAlign: 'center',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px rgba(107,76,154,0.35)',
    }}>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: tags.length > 0 ? '8px' : 0, letterSpacing: '-0.01em' }}>{label}</div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center' }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { weekNode: WeekNode, tagNode: TagNode, projectNode: ProjectNode };

// ── Main ───────────────────────────────────────────────────────────────────
export default function InsightsGraph({
  weeks, projects, searchTag, onWeekSelect,
}: {
  weeks: AppState['weeks'];
  projects: AppState['projects'];
  searchTag: string;
  onWeekSelect: (weekId: string | null) => void;
}) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const weekArray = Object.values(weeks).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const projectArray = Object.values(projects);
    const maxInsights = Math.max(...weekArray.map(w => w.learnings.length), 1);

    const WEEK_X = 220;
    const PROJ_X = 260;
    const TAG_X = 130;

    const totalWeekW = Math.max(0, (weekArray.length - 1) * WEEK_X);
    const totalProjW = Math.max(0, (projectArray.length - 1) * PROJ_X);

    // Top 8 tags globally, keyed by tag → set of weekIds
    const tagMap = new Map<string, Set<string>>();
    weekArray.forEach(week => {
      const seen = new Set(week.learnings.flatMap(l => l.tags));
      seen.forEach(tag => {
        if (!tagMap.has(tag)) tagMap.set(tag, new Set());
        tagMap.get(tag)!.add(week.id);
      });
    });
    const topTags = Array.from(tagMap.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 8);
    const totalTagW = Math.max(0, (topTags.length - 1) * TAG_X);

    const hasProjects = projectArray.length > 0;
    const hasTags = topTags.length > 0;
    const projY = 0;
    const tagY = hasProjects ? 180 : 0;
    const weekY = hasTags ? tagY + 170 : hasProjects ? 200 : 80;

    // Project nodes
    projectArray.forEach((proj, i) => {
      nodes.push({
        id: `proj:${proj.id}`, type: 'projectNode',
        position: { x: i * PROJ_X - totalProjW / 2, y: projY },
        data: { label: proj.name, tags: proj.tags },
      });
    });

    // Tag cluster nodes
    topTags.forEach(([tag, weekSet], i) => {
      nodes.push({
        id: `tag:${tag}`, type: 'tagNode',
        position: { x: i * TAG_X - totalTagW / 2, y: tagY },
        data: { tag, weekCount: weekSet.size, highlighted: false, searchActive: false },
      });
    });

    // Week nodes + edges
    weekArray.forEach((week, i) => {
      const parsedDate = parseISO(week.startDate);
      const label = `Week of ${format(parsedDate, 'MMM d')}`;
      const x = i * WEEK_X - totalWeekW / 2;
      const intensity = week.learnings.length / maxInsights;
      const isGhost = week.learnings.length === 0;

      const tagFreq = new Map<string, number>();
      week.learnings.forEach(l => l.tags.forEach(t => tagFreq.set(t, (tagFreq.get(t) || 0) + 1)));
      const weekTopTags = Array.from(tagFreq.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
      const allTags = Array.from(new Set(week.learnings.flatMap(l => l.tags)));

      nodes.push({
        id: `week:${week.id}`, type: 'weekNode',
        position: { x, y: weekY },
        data: {
          weekId: week.id, label, insightCount: week.learnings.length,
          topTags: weekTopTags, allTags,
          intensity, isGhost,
          goalsTotal: week.goals.length,
          goalsCompleted: week.goals.filter(g => g.completed).length,
          highlighted: false, searchActive: false,
        },
      });

      // Dashed chronological chain
      if (i > 0) {
        const prev = weekArray[i - 1];
        edges.push({
          id: `edge:chain:${prev.id}-${week.id}`,
          source: `week:${prev.id}`, target: `week:${week.id}`,
          type: 'straight',
          style: { stroke: 'var(--border)', opacity: 0.6, strokeWidth: 1.5, strokeDasharray: '5 5' },
        });
      }

      // Tag node → week edges
      topTags.forEach(([tag, weekSet]) => {
        if (weekSet.has(week.id)) {
          edges.push({
            id: `edge:tag-week:${tag}-${week.id}`,
            source: `tag:${tag}`, target: `week:${week.id}`,
            type: 'smoothstep',
            animated: weekSet.size > 1,
            style: { stroke: 'var(--purple-secondary)', opacity: 0.35, strokeWidth: 1.5 },
          });
        }
      });
    });

    // Project → week edges
    projectArray.forEach(proj => {
      const projTags = new Set(proj.tags);
      weekArray.forEach(week => {
        const weekTags = new Set(week.learnings.flatMap(l => l.tags));
        let shared = false;
        for (const pt of projTags) { if (weekTags.has(pt)) { shared = true; break; } }
        if (shared) {
          edges.push({
            id: `edge:proj-week:${proj.id}-${week.id}`,
            source: `proj:${proj.id}`, target: `week:${week.id}`,
            type: 'smoothstep',
            style: { stroke: 'var(--primary)', opacity: 0.55, strokeWidth: 2 },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [weeks, projects]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  // Sync highlight state when searchTag changes
  useEffect(() => {
    const st = searchTag.trim().toLowerCase();
    setNodes(nds => nds.map(node => {
      if (node.type === 'weekNode') {
        const allTags = (node.data.allTags as string[]) ?? [];
        const highlighted = st === '' || allTags.some(t => t.includes(st));
        return { ...node, data: { ...node.data, highlighted, searchActive: st !== '' } };
      }
      if (node.type === 'tagNode') {
        const tag = node.data.tag as string;
        const highlighted = st === '' || tag.includes(st);
        return { ...node, data: { ...node.data, highlighted, searchActive: st !== '' } };
      }
      return node;
    }));
  }, [searchTag, setNodes]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'weekNode') onWeekSelect(node.data.weekId as string);
  }, [onWeekSelect]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-muted/10">
        <p className="text-muted-foreground text-sm">Not enough data to map terrain. Log some insights first!</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-muted/5">
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.3 }}
        attributionPosition="bottom-left" colorMode="light"
      >
        <Background color="var(--border)" gap={24} size={1} />
        <Controls showInteractive={false} className="bg-background border-border fill-foreground" />
      </ReactFlow>
    </div>
  );
}
