'use client';

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Edge,
  Background,
  Controls,
  ControlButton,
  Node,
  NodeProps,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AppState, Goal } from '@/types';
import * as d3 from 'd3-force';
import { format, parseISO } from 'date-fns';

// ── Custom Nodes ───────────────────────────────────────────────────────────

function WeekNode({ data }: NodeProps) {
  const { label } = data as { label: string };
  return (
    <div style={{
      background: 'var(--background)',
      border: '2px solid var(--border)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 'bold',
      fontFamily: 'var(--font-sans)',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function TagNode({ data }: NodeProps) {
  const { tag, weekCount } = data as { tag: string; weekCount: number };
  return (
    <div style={{
      background: 'var(--purple-soft)',
      color: 'var(--primary)',
      border: '1px solid var(--purple-secondary)',
      borderRadius: '20px',
      padding: '4px 10px',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      fontWeight: 600,
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      #{tag} <span style={{ opacity: 0.6 }}>×{weekCount}</span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function ProjectNode({ data }: NodeProps) {
  const { label } = data as { label: string };
  return (
    <div style={{
      background: 'var(--primary)',
      color: 'var(--primary-foreground)',
      border: '1px solid var(--purple-secondary)',
      borderRadius: '16px',
      padding: '10px 16px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'bold',
    }}>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      {label}
    </div>
  );
}

// Readable pill nodes with visible inline text
function GoalNode({ data }: NodeProps) {
  const { label, completed, isSubGoal } = data as any;
  const truncated = label?.length > (isSubGoal ? 24 : 32) ? label.slice(0, isSubGoal ? 22 : 30) + '…' : label;
  return (
    <div
      title={label}
      style={{
        background: completed ? 'var(--primary)' : 'var(--background)',
        color: completed ? 'var(--primary-foreground)' : 'var(--foreground)',
        border: completed ? '1px solid var(--primary)' : '1px solid var(--border)',
        borderRadius: '6px',
        padding: isSubGoal ? '3px 6px' : '5px 10px',
        fontSize: isSubGoal ? '9.5px' : '11px',
        fontFamily: 'var(--font-sans)',
        maxWidth: isSubGoal ? '120px' : '160px',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textDecoration: completed ? 'line-through' : 'none',
        opacity: completed ? 0.75 : 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        cursor: 'default',
      }}
    >
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {truncated}
    </div>
  );
}

function InsightNode({ data }: NodeProps) {
  const { label } = data as any;
  const truncated = label?.length > 38 ? label.slice(0, 36) + '…' : label;
  return (
    <div
      title={label}
      style={{
        background: 'rgba(139,92,246,0.10)',
        color: '#6d28d9',
        border: '1.5px solid rgba(139,92,246,0.4)',
        borderRadius: '8px',
        padding: '5px 10px',
        fontSize: '11px',
        fontFamily: 'var(--font-sans)',
        maxWidth: '200px',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        fontStyle: 'italic',
        boxShadow: '0 1px 4px rgba(139,92,246,0.12)',
        cursor: label?.length > 38 ? 'pointer' : 'default',
      }}
    >
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {truncated}
    </div>
  );
}

const nodeTypes = { weekNode: WeekNode, tagNode: TagNode, projectNode: ProjectNode, goalNode: GoalNode, insightNode: InsightNode };

// ── Force Directed Logic ───────────────────────────────────────────────────

function ForceGraph({ weeks, projects, searchTag, onWeekSelect, toggleFullscreen, isFullscreen }: { weeks: AppState['weeks']; projects: AppState['projects']; searchTag: string; onWeekSelect: (id: string | null) => void; toggleFullscreen: () => void; isFullscreen: boolean }) {
  const { fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<{ type: string; label: string; completed?: boolean } | null>(null);
  
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const weekArray = Object.values(weeks);
    const projArray = Object.values(projects);
    
    // Tag frequency
    const tagMap = new Map<string, Set<string>>();
    weekArray.forEach(w => w.learnings.forEach(l => l.tags.forEach(t => {
      if (!tagMap.has(t)) tagMap.set(t, new Set());
      tagMap.get(t)!.add(w.id);
    })));
    const topTags = Array.from(tagMap.entries()).sort((a,b) => b[1].size - a[1].size).slice(0, 10);

    // 1. Tags
    topTags.forEach(([tag, wSet]) => {
      nodes.push({ id: `tag:${tag}`, type: 'tagNode', data: { tag, weekCount: wSet.size }, position: { x: 0, y: 0 } });
    });

    // 2. Projects
    projArray.forEach(proj => {
      nodes.push({ id: `proj:${proj.id}`, type: 'projectNode', data: { label: proj.name }, position: { x: 0, y: 0 } });
      const pTags = new Set(proj.tags);
      // Link proj to Tags
      topTags.forEach(([tag]) => {
      if (pTags.has(tag)) edges.push({ id: `e:proj-tag:${proj.id}-${tag}`, source: `proj:${proj.id}`, target: `tag:${tag}`, style: { opacity: 0.55, stroke: 'var(--primary)', strokeWidth: 2 } });
      });
    });

    // 3. Weeks + Goals + Insights
    weekArray.forEach((week, i) => {
      const parsedDate = parseISO(week.startDate);
      const label = `Week of ${format(parsedDate, 'MMM d')}`;
      nodes.push({ id: `week:${week.id}`, type: 'weekNode', data: { weekId: week.id, label }, position: { x: 0, y: 0 } });

      // Link week to previous week
      if (i > 0) {
        edges.push({ id: `e:chain:${weekArray[i-1].id}-${week.id}`, source: `week:${weekArray[i-1].id}`, target: `week:${week.id}`, style: { strokeWidth: 2.5, strokeDasharray: '6,4', opacity: 0.55, stroke: '#94a3b8' } });
      }

      // Link week to Tags
      const wTags = new Set(week.learnings.flatMap(l=>l.tags));
      topTags.forEach(([tag]) => {
        if (wTags.has(tag)) edges.push({ id: `e:week-tag:${week.id}-${tag}`, source: `week:${week.id}`, target: `tag:${tag}`, style: { opacity: 0.55, stroke: 'var(--primary)', strokeWidth: 1.5 } });
      });

      // Goals
      const flattenGoals = (goals: Goal[], parentNodeId: string, depth = 0, branchLabel?: string) => {
        goals.forEach(g => {
          const nodeId = `goal:${g.id}`;
          nodes.push({ 
            id: nodeId, 
            type: 'goalNode', 
            data: { 
              label: branchLabel ? `[${branchLabel}] ${g.text}` : g.text, 
              completed: g.completed,
              isSubGoal: depth > 0 
            }, 
            position: { x: 0, y: 0 } 
          });
          
          edges.push({ 
            id: `e:parent-child:${parentNodeId}-${g.id}`, 
            source: parentNodeId, 
            target: nodeId, 
            style: { 
              opacity: depth > 0 ? 0.25 : 0.5, 
              stroke: g.completed ? 'var(--primary)' : '#9ca3af', 
              strokeWidth: depth > 0 ? 1 : 1.5 
            } 
          });

          if (g.subGoals) {
            flattenGoals(g.subGoals, nodeId, depth + 1);
          }
          
          if (g.type === 'conditional' && g.branches) {
             g.branches.forEach(b => flattenGoals(b.goals, nodeId, depth + 1, b.label));
          }
        });
      };
      flattenGoals(week.goals, `week:${week.id}`);

      // Insights
      week.learnings.forEach(l => {
        nodes.push({ id: `insight:${l.id}`, type: 'insightNode', data: { label: l.text }, position: { x: 0, y: 0 } });
        edges.push({ id: `e:week-insight:${week.id}-${l.id}`, source: `week:${week.id}`, target: `insight:${l.id}`, style: { opacity: 0.55, stroke: '#8b5cf6', strokeWidth: 1.5 } });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [weeks, projects]);

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Physics Simulation
  useEffect(() => {
    // Spread nodes randomly to avoid initial stack at origin
    const simNodes = initialNodes.map(n => ({
      ...n,
      x: (Math.random() - 0.5) * 2400,
      y: (Math.random() - 0.5) * 1600,
    }));
    const simLinks = initialEdges.map(e => ({ source: e.source, target: e.target }));

    const simulation = d3.forceSimulation(simNodes as any)
      .force('charge', d3.forceManyBody().strength((d: any) => {
        if (d.type === 'projectNode') return -1400;
        if (d.type === 'weekNode') return -1000;
        if (d.type === 'tagNode') return -1000;
        return -300;
      }))
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance((l: any) => {
        const s = l.source as any;
        const t = l.target as any;
        if (s.type === 'weekNode' && t.type === 'weekNode') return 260;
        if (s.type === 'weekNode' || t.type === 'weekNode') return 150;
        return 90;
      }))
      .force('center', d3.forceCenter(0, 0))
      .force('collide', d3.forceCollide().radius((d: any) => {
        // Match half the actual rendered node width + padding
        if (d.type === 'projectNode') return 110;
        if (d.type === 'weekNode') return 100;
        if (d.type === 'tagNode') return 65;
        if (d.type === 'insightNode') return 110; // maxWidth 200px / 2 + buffer
        if (d.type === 'goalNode') return 90;     // maxWidth 160px / 2 + buffer
        return 70;
      }).iterations(5))
      .stop(); // Stop auto-ticking — we drive it manually

    // ── Pre-run synchronously so nodes are never invisible on first paint ──
    simulation.tick(300);
    setNodes([...simNodes.map((n: any) => ({ ...n, position: { x: n.x, y: n.y } }))]);

    // ── Short settling animation ──
    let animationFrameId: number;
    simulation.alpha(0.08).restart();

    const tick = () => {
      simulation.tick();
      setNodes([...simNodes.map((n: any) => ({ ...n, position: { x: n.x, y: n.y } }))]);
      if (simulation.alpha() > simulation.alphaMin()) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        simulation.stop();
        fitView({ duration: 600, padding: 0.2 });
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animationFrameId); simulation.stop(); };
  }, [initialNodes, initialEdges, setNodes, fitView]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'goalNode' || node.type === 'insightNode') {
      setSelectedNode({ type: node.type, label: node.data.label as string, completed: node.data.completed as boolean | undefined });
    }
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes} edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-left" colorMode="light"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={24} size={1} />
        <Controls showInteractive={false} showFitView={false} className="bg-background border-border fill-foreground">
          <ControlButton
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/>
                <path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
              </svg>
            )}
          </ControlButton>
        </Controls>
      </ReactFlow>

      {/* Full-text popup */}
      {selectedNode && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.15)' }}
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="max-w-sm w-full mx-4 rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 fade-in duration-200"
            style={{
              background: selectedNode.type === 'insightNode' ? 'rgba(245,242,255,0.98)' : 'var(--background)',
              borderColor: selectedNode.type === 'insightNode' ? 'rgba(139,92,246,0.4)' : 'var(--border)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    background: selectedNode.type === 'insightNode' ? 'rgba(139,92,246,0.15)' : selectedNode.completed ? 'var(--primary)' : 'var(--muted)',
                    color: selectedNode.type === 'insightNode' ? '#6d28d9' : selectedNode.completed ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {selectedNode.type === 'insightNode' ? '✦ Insight' : selectedNode.completed ? '✓ Completed Goal' : '○ Goal'}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none mt-[-2px]"
              >×</button>
            </div>
            <p
              className="px-5 py-4 text-sm leading-relaxed"
              style={{
                color: selectedNode.type === 'insightNode' ? '#5b21b6' : 'var(--foreground)',
                fontStyle: selectedNode.type === 'insightNode' ? 'italic' : 'normal',
                textDecoration: selectedNode.completed ? 'line-through' : 'none',
                opacity: selectedNode.completed ? 0.75 : 1,
              }}
            >
              {selectedNode.label}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function InsightsGraphWrapper(props: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (Object.keys(props.weeks).length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-muted/10">
        <p className="text-muted-foreground text-sm">Not enough data to map terrain. Log some insights first!</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-muted/5 relative overflow-hidden">
      {/* Title overlay - top left */}
      <div className="absolute top-4 left-4 z-10 p-3 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-sm">
        <h3 className="text-sm font-semibold tracking-tight">The Constellation</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Click any node to read full text</p>
      </div>

      {/* Legend - top right */}
      <div className="absolute top-4 right-4 z-10 p-3.5 bg-background/90 backdrop-blur-sm border border-border rounded-xl shadow-md flex flex-col gap-2.5">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Legend</p>
        <div className="flex items-center gap-2">
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary)', border: '1.5px solid var(--primary)', flexShrink: 0 }} />
          <span className="text-[11px] text-foreground/80">Completed goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--background)', border: '1.5px solid var(--border)', flexShrink: 0 }} />
          <span className="text-[11px] text-foreground/80">Pending goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--background)', border: '1px solid var(--border)', flexShrink: 0, marginLeft: 2 }} />
          <span className="text-[11px] text-foreground/80 italic">Sub-goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 14, height: 14, borderRadius: 6, background: 'rgba(139,92,246,0.12)', border: '1.5px solid rgba(139,92,246,0.45)', flexShrink: 0 }} />
          <span className="text-[11px]" style={{ color: '#6d28d9' }}>Insight</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 14, height: 14, borderRadius: 14, background: 'var(--purple-soft)', border: '1px solid var(--purple-secondary)', flexShrink: 0 }} />
          <span className="text-[11px] text-foreground/80">#tag cluster</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary)', border: '1.5px solid var(--primary)', flexShrink: 0, opacity: 0.9 }} />
          <span className="text-[11px] text-foreground/80">Project anchor</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 22, height: 12, borderRadius: 4, background: 'var(--background)', border: '2px solid var(--border)', flexShrink: 0 }} />
          <span className="text-[11px] text-foreground/80">Week</span>
        </div>
      </div>

      <ReactFlowProvider>
        <ForceGraph {...props} toggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
      </ReactFlowProvider>
    </div>
  );
}
