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

type GraphNodeData = {
  label?: string;
  fullLabel?: string;
  weekId?: string;
  tag?: string;
  weekCount?: number;
  completed?: boolean;
  isSubGoal?: boolean;
  matched?: boolean;
};

const laneStyles = {
  shell: {
    backdropFilter: 'blur(18px)',
    background: 'rgba(251, 249, 246, 0.88)',
    border: '1px solid rgba(155, 138, 121, 0.16)',
    boxShadow: '0 22px 54px rgba(84, 63, 102, 0.08)',
  },
  badge: {
    background: 'rgba(107, 76, 154, 0.08)',
    color: 'var(--primary)',
  },
};

function WeekNode({ data, selected }: NodeProps) {
  const { label, matched } = data as GraphNodeData;
  return (
    <div
      style={{
        minWidth: 168,
        background: matched ? 'rgba(107, 76, 154, 0.12)' : 'rgba(251, 249, 246, 0.96)',
        border: selected
          ? '1.5px solid rgba(107, 76, 154, 0.55)'
          : matched
            ? '1.5px solid rgba(107, 76, 154, 0.32)'
            : '1.5px solid rgba(155, 138, 121, 0.22)',
        borderRadius: 18,
        padding: '12px 14px',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.02em',
        color: 'var(--foreground)',
        boxShadow: selected
          ? '0 18px 35px rgba(107, 76, 154, 0.18)'
          : '0 12px 30px rgba(84, 63, 102, 0.07)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '2px 7px',
            borderRadius: 999,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            ...laneStyles.badge,
          }}
        >
          Week
        </span>
        <span>{label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function TagNode({ data, selected }: NodeProps) {
  const { tag, weekCount, matched } = data as GraphNodeData;
  return (
    <div
      style={{
        background: matched ? 'rgba(107, 76, 154, 0.16)' : 'rgba(239, 231, 250, 0.88)',
        color: 'var(--primary)',
        border: selected
          ? '1.5px solid rgba(107, 76, 154, 0.55)'
          : matched
            ? '1.5px solid rgba(107, 76, 154, 0.42)'
            : '1px solid rgba(140, 107, 203, 0.28)',
        borderRadius: 999,
        padding: '7px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        boxShadow: matched
          ? '0 14px 28px rgba(107, 76, 154, 0.14)'
          : '0 10px 18px rgba(107, 76, 154, 0.07)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <span>#{tag}</span>{' '}
      <span style={{ opacity: 0.56, fontWeight: 600 }}>x{weekCount}</span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function ProjectNode({ data, selected }: NodeProps) {
  const { label, matched } = data as GraphNodeData;
  return (
    <div
      style={{
        minWidth: 170,
        background: matched
          ? 'linear-gradient(135deg, rgba(107, 76, 154, 0.96), rgba(140, 107, 203, 0.96))'
          : 'linear-gradient(135deg, rgba(74, 58, 95, 0.95), rgba(107, 76, 154, 0.95))',
        color: 'var(--primary-foreground)',
        border: selected
          ? '1.5px solid rgba(239, 231, 250, 0.8)'
          : '1px solid rgba(239, 231, 250, 0.2)',
        borderRadius: 20,
        padding: '14px 16px',
        fontFamily: 'var(--font-sans)',
        boxShadow: '0 22px 40px rgba(58, 41, 83, 0.24)',
      }}
    >
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '2px 7px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.14)',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Project
        </span>
        <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>{label}</span>
      </div>
    </div>
  );
}

function GoalNode({ data, selected }: NodeProps) {
  const { label, completed, isSubGoal, matched } = data as GraphNodeData;
  const truncated = label && label.length > (isSubGoal ? 28 : 34)
    ? `${label.slice(0, isSubGoal ? 26 : 32)}...`
    : label;

  return (
    <div
      title={label}
      style={{
        background: completed
          ? 'rgba(107, 76, 154, 0.92)'
          : matched
            ? 'rgba(107, 76, 154, 0.1)'
            : 'rgba(255,255,255,0.94)',
        color: completed ? 'var(--primary-foreground)' : 'var(--foreground)',
        border: selected
          ? '1.5px solid rgba(107, 76, 154, 0.5)'
          : completed
            ? '1px solid rgba(107, 76, 154, 0.9)'
            : matched
              ? '1.5px solid rgba(107, 76, 154, 0.28)'
              : '1px solid rgba(155, 138, 121, 0.22)',
        borderRadius: isSubGoal ? 14 : 16,
        padding: isSubGoal ? '7px 9px' : '9px 11px',
        fontSize: isSubGoal ? 10 : 11,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        maxWidth: isSubGoal ? 160 : 198,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textDecoration: completed ? 'line-through' : 'none',
        opacity: completed ? 0.86 : 1,
        boxShadow: completed
          ? '0 16px 28px rgba(107, 76, 154, 0.16)'
          : '0 10px 22px rgba(84, 63, 102, 0.06)',
        cursor: 'default',
      }}
    >
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {truncated}
    </div>
  );
}

function InsightNode({ data, selected }: NodeProps) {
  const { label, matched } = data as GraphNodeData;
  const truncated = label && label.length > 42 ? `${label.slice(0, 40)}...` : label;

  return (
    <div
      title={label}
      style={{
        maxWidth: 220,
        background: matched ? 'rgba(107, 76, 154, 0.12)' : 'rgba(244, 240, 255, 0.88)',
        color: '#5f36a8',
        border: selected
          ? '1.5px solid rgba(107, 76, 154, 0.46)'
          : matched
            ? '1.5px solid rgba(107, 76, 154, 0.32)'
            : '1.5px solid rgba(140, 107, 203, 0.24)',
        borderRadius: 18,
        padding: '10px 12px',
        fontSize: 11,
        lineHeight: 1.35,
        fontFamily: 'var(--font-sans)',
        fontStyle: 'italic',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        boxShadow: matched
          ? '0 16px 30px rgba(107, 76, 154, 0.14)'
          : '0 10px 22px rgba(107, 76, 154, 0.08)',
      }}
    >
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {truncated}
    </div>
  );
}

const nodeTypes = {
  weekNode: WeekNode,
  tagNode: TagNode,
  projectNode: ProjectNode,
  goalNode: GoalNode,
  insightNode: InsightNode,
};

function ForceGraph({
  weeks,
  projects,
  searchTag,
  onWeekSelect,
  toggleFullscreen,
  isFullscreen,
}: {
  weeks: AppState['weeks'];
  projects: AppState['projects'];
  searchTag: string;
  onWeekSelect: (id: string | null) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  const { fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<{ type: string; label: string; completed?: boolean } | null>(null);
  const normalizedSearch = searchTag.trim().replace(/^#/, '').toLowerCase();

  const { initialNodes, initialEdges, stats } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const weekArray = Object.values(weeks).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const projArray = Object.values(projects);

    const tagMap = new Map<string, Set<string>>();
    weekArray.forEach((week) => {
      week.learnings.forEach((learning) => {
        learning.tags.forEach((tag) => {
          if (!tagMap.has(tag)) tagMap.set(tag, new Set());
          tagMap.get(tag)!.add(week.id);
        });
      });
    });

    const topTags = Array.from(tagMap.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 12);
    const matchesSearch = (values: string[]) =>
      normalizedSearch.length > 0 && values.some((value) => value.toLowerCase().includes(normalizedSearch));

    topTags.forEach(([tag, wSet], index) => {
      const angle = (index / Math.max(topTags.length, 1)) * Math.PI * 2;
      nodes.push({
        id: `tag:${tag}`,
        type: 'tagNode',
        data: { tag, weekCount: wSet.size, matched: matchesSearch([tag]) },
        position: { x: Math.cos(angle) * 520, y: -340 + Math.sin(angle) * 70 },
      });
    });

    projArray.forEach((project, index) => {
      const projectMatched = matchesSearch([project.name, ...project.tags]);
      nodes.push({
        id: `proj:${project.id}`,
        type: 'projectNode',
        data: { label: project.name, matched: projectMatched },
        position: { x: (index - (projArray.length - 1) / 2) * 280, y: -640 },
      });

      const projectTags = new Set(project.tags);
      topTags.forEach(([tag]) => {
        if (projectTags.has(tag)) {
          edges.push({
            id: `e:proj-tag:${project.id}-${tag}`,
            source: `proj:${project.id}`,
            target: `tag:${tag}`,
            style: {
              opacity: projectMatched || tag.includes(normalizedSearch) ? 0.65 : 0.3,
              stroke: 'rgba(107, 76, 154, 0.72)',
              strokeWidth: 2.2,
            },
          });
        }
      });
    });

    const flattenGoals = (
      goals: Goal[],
      parentNodeId: string,
      week: AppState['weeks'][string],
      indexOffset: { current: number },
      depth = 0,
      branchLabel?: string
    ) => {
      goals.forEach((goal) => {
        const isMatched = matchesSearch([goal.text, ...(branchLabel ? [branchLabel] : [])]);
        const laneOffset = depth === 0 ? 210 : 250 + depth * 40;
        const xJitter = ((indexOffset.current % 5) - 2) * 110;
        indexOffset.current += 1;

        nodes.push({
          id: `goal:${goal.id}`,
          type: 'goalNode',
          data: {
            label: branchLabel ? `[${branchLabel}] ${goal.text}` : goal.text,
            completed: goal.completed,
            isSubGoal: depth > 0,
            matched: isMatched,
          },
          position: { x: (weekPositions.get(week.id) ?? 0) + xJitter, y: laneOffset },
        });

        edges.push({
          id: `e:parent-child:${parentNodeId}-${goal.id}`,
          source: parentNodeId,
          target: `goal:${goal.id}`,
          style: {
            opacity: isMatched ? 0.74 : depth > 0 ? 0.18 : 0.34,
            stroke: goal.completed ? 'rgba(107, 76, 154, 0.8)' : 'rgba(125, 125, 125, 0.42)',
            strokeWidth: depth > 0 ? 1.2 : 1.7,
          },
        });

        if (goal.subGoals) {
          flattenGoals(goal.subGoals, `goal:${goal.id}`, week, indexOffset, depth + 1);
        }

        if (goal.type === 'conditional' && goal.branches) {
          goal.branches.forEach((branch) => {
            flattenGoals(branch.goals, `goal:${goal.id}`, week, indexOffset, depth + 1, branch.label);
          });
        }
      });
    };

    const weekSpacing = 320;
    const weekPositions = new Map<string, number>();

    weekArray.forEach((week, index) => {
      const x = (index - (weekArray.length - 1) / 2) * weekSpacing;
      weekPositions.set(week.id, x);
    });

    weekArray.forEach((week, index) => {
      const parsedDate = parseISO(week.startDate);
      const label = `Week of ${format(parsedDate, 'MMM d')}`;
      const weekTags = Array.from(new Set(week.learnings.flatMap((entry) => entry.tags)));
      const weekMatched = matchesSearch(weekTags);
      const x = weekPositions.get(week.id) ?? 0;

      nodes.push({
        id: `week:${week.id}`,
        type: 'weekNode',
        data: { label, weekId: week.id, matched: weekMatched || normalizedSearch.length === 0 },
        position: { x, y: -30 },
      });

      if (index > 0) {
        edges.push({
          id: `e:chain:${weekArray[index - 1].id}-${week.id}`,
          source: `week:${weekArray[index - 1].id}`,
          target: `week:${week.id}`,
          style: {
            strokeWidth: 2.2,
            strokeDasharray: '7 6',
            opacity: 0.42,
            stroke: 'rgba(122, 116, 143, 0.7)',
          },
        });
      }

      topTags.forEach(([tag]) => {
        if (weekTags.includes(tag)) {
          const tagMatched = normalizedSearch.length > 0 && tag.includes(normalizedSearch);
          edges.push({
            id: `e:week-tag:${week.id}-${tag}`,
            source: `week:${week.id}`,
            target: `tag:${tag}`,
            style: {
              opacity: tagMatched || weekMatched ? 0.7 : 0.22,
              stroke: tagMatched ? 'rgba(107, 76, 154, 0.92)' : 'rgba(140, 107, 203, 0.44)',
              strokeWidth: tagMatched ? 2.2 : 1.4,
            },
          });
        }
      });

      const goalOffset = { current: 0 };
      flattenGoals(week.goals, `week:${week.id}`, week, goalOffset);

      week.learnings.forEach((learning, insightIndex) => {
        const insightMatched = matchesSearch([learning.text, ...learning.tags]);
        const direction = insightIndex % 2 === 0 ? -1 : 1;
        const band = Math.floor(insightIndex / 2);
        nodes.push({
          id: `insight:${learning.id}`,
          type: 'insightNode',
          data: {
            label: learning.text,
            fullLabel: learning.text,
            matched: insightMatched,
          },
          position: {
            x: x + direction * (190 + band * 36),
            y: 150 + band * 82,
          },
        });
        edges.push({
          id: `e:week-insight:${week.id}-${learning.id}`,
          source: `week:${week.id}`,
          target: `insight:${learning.id}`,
          style: {
            opacity: insightMatched ? 0.78 : 0.3,
            stroke: insightMatched ? 'rgba(107, 76, 154, 0.84)' : 'rgba(140, 107, 203, 0.45)',
            strokeWidth: insightMatched ? 2.1 : 1.45,
          },
        });
      });
    });

    return {
      initialNodes: nodes,
      initialEdges: edges,
      stats: {
        weeks: weekArray.length,
        tags: topTags.length,
        projects: projArray.length,
      },
    };
  }, [weeks, projects, normalizedSearch]);

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  useEffect(() => {
    const seededNodes = initialNodes.map((node) => {
      const { x, y } = node.position;
      return {
        ...node,
        x,
        y,
      };
    });

    const simLinks = initialEdges.map((edge) => ({ source: edge.source, target: edge.target }));

    const simulation = d3
      .forceSimulation(seededNodes as any)
      .force(
        'charge',
        d3.forceManyBody().strength((node: any) => {
          if (node.type === 'projectNode') return -340;
          if (node.type === 'weekNode') return -240;
          if (node.type === 'tagNode') return -180;
          return -85;
        })
      )
      .force(
        'link',
        d3.forceLink(simLinks).id((node: any) => node.id).distance((link: any) => {
          const source = link.source as any;
          const target = link.target as any;
          if (source.type === 'weekNode' && target.type === 'weekNode') return 240;
          if (source.type === 'weekNode' || target.type === 'weekNode') return 120;
          return 84;
        }).strength((link: any) => {
          const source = link.source as any;
          const target = link.target as any;
          return source.type === 'weekNode' && target.type === 'weekNode' ? 0.46 : 0.22;
        })
      )
      .force('x', d3.forceX((node: any) => node.position.x).strength((node: any) => (node.type === 'weekNode' ? 0.3 : 0.16)))
      .force('y', d3.forceY((node: any) => node.position.y).strength((node: any) => (node.type === 'weekNode' ? 0.32 : 0.2)))
      .force(
        'collide',
        d3
          .forceCollide()
          .radius((node: any) => {
            if (node.type === 'projectNode') return 120;
            if (node.type === 'weekNode') return 112;
            if (node.type === 'tagNode') return 74;
            if (node.type === 'insightNode') return 110;
            if (node.type === 'goalNode') return 88;
            return 72;
          })
          .iterations(2)
      )
      .alpha(0.18)
      .alphaDecay(0.08)
      .stop();

    simulation.tick(180);
    setNodes(seededNodes.map((node: any) => ({ ...node, position: { x: node.x, y: node.y } })));
    fitView({ duration: 450, padding: 0.16 });

    return () => {
      simulation.stop();
    };
  }, [initialNodes, initialEdges, fitView, setNodes]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'weekNode') {
        onWeekSelect((node.data.weekId as string) ?? null);
        return;
      }

      if (node.type === 'goalNode' || node.type === 'insightNode') {
        setSelectedNode({
          type: node.type,
          label: (node.data.fullLabel as string) || (node.data.label as string),
          completed: node.data.completed as boolean | undefined,
        });
      }
    },
    [onWeekSelect]
  );

  return (
    <>
      <div
        className="absolute left-6 right-6 top-5 z-10 hidden grid-cols-4 gap-3 xl:grid"
        style={{ pointerEvents: 'none' }}
      >
        {[
          ['Projects', 'Long-running anchors and areas of commitment'],
          ['Topics', 'Recurring tags that tie related weeks together'],
          ['Timeline', 'Weekly snapshots arranged along a calmer center rail'],
          ['Work + Notes', 'Goals below, reflections beside each week'],
        ].map(([title, subtitle]) => (
          <div
            key={title}
            className="rounded-2xl px-4 py-3"
            style={{ ...laneStyles.shell }}
          >
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{title}</p>
            <p className="mt-1 text-xs text-foreground/80">{subtitle}</p>
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-8 top-[108px] bottom-8 z-0 hidden rounded-[32px] lg:block"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(107, 76, 154, 0.04) 0%,
              rgba(107, 76, 154, 0.04) 18%,
              rgba(107, 76, 154, 0.02) 18%,
              rgba(107, 76, 154, 0.02) 41%,
              rgba(107, 76, 154, 0.06) 41%,
              rgba(107, 76, 154, 0.06) 59%,
              rgba(107, 76, 154, 0.025) 59%,
              rgba(107, 76, 154, 0.025) 100%
            )
          `,
          border: '1px solid rgba(155, 138, 121, 0.12)',
        }}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-left"
        colorMode="light"
        minZoom={0.35}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(155, 138, 121, 0.18)" gap={26} size={1.1} />
        <Controls showInteractive={false} showFitView={false} className="bg-background/90 border-border fill-foreground shadow-lg backdrop-blur">
          <ControlButton onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
              </svg>
            )}
          </ControlButton>
        </Controls>
      </ReactFlow>

      {selectedNode && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(48, 32, 67, 0.12)' }}
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-[24px] border shadow-2xl"
            style={{
              ...laneStyles.shell,
              background:
                selectedNode.type === 'insightNode'
                  ? 'linear-gradient(180deg, rgba(248, 244, 255, 0.98), rgba(251, 249, 246, 0.98))'
                  : 'rgba(251, 249, 246, 0.98)',
              borderColor:
                selectedNode.type === 'insightNode'
                  ? 'rgba(107, 76, 154, 0.24)'
                  : 'rgba(155, 138, 121, 0.16)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b px-5 pb-3 pt-5" style={{ borderColor: 'rgba(155, 138, 121, 0.16)' }}>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    background:
                      selectedNode.type === 'insightNode'
                        ? 'rgba(107, 76, 154, 0.12)'
                        : selectedNode.completed
                          ? 'rgba(107, 76, 154, 0.9)'
                          : 'rgba(107, 76, 154, 0.08)',
                    color:
                      selectedNode.type === 'insightNode'
                        ? '#5f36a8'
                        : selectedNode.completed
                          ? 'white'
                          : 'var(--primary)',
                  }}
                >
                  {selectedNode.type === 'insightNode'
                    ? 'Insight'
                    : selectedNode.completed
                      ? 'Completed Goal'
                      : 'Goal'}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                x
              </button>
            </div>
            <p
              className="px-5 py-4 text-sm leading-relaxed"
              style={{
                color: selectedNode.type === 'insightNode' ? '#53308f' : 'var(--foreground)',
                fontStyle: selectedNode.type === 'insightNode' ? 'italic' : 'normal',
                textDecoration: selectedNode.completed ? 'line-through' : 'none',
                opacity: selectedNode.completed ? 0.78 : 1,
              }}
            >
              {selectedNode.label}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-5 left-5 z-10 max-w-sm rounded-[24px] px-4 py-4" style={laneStyles.shell}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Terrain view</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Weeks sit on the center rail. Projects float above, goals stack below, and insights orbit nearby.
            </p>
          </div>
          <div className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={laneStyles.badge}>
            {stats.weeks} weeks
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">Top {stats.tags} tags</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{stats.projects} projects</span>
          {normalizedSearch ? (
            <span className="rounded-full bg-purpleSoft px-2.5 py-1 text-primary">
              Filter: #{normalizedSearch}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function InsightsGraphWrapper(props: {
  weeks: AppState['weeks'];
  projects: AppState['projects'];
  searchTag: string;
  onWeekSelect: (weekId: string | null) => void;
}) {
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
        <p className="text-sm text-muted-foreground">Not enough data to map terrain. Log some insights first.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top, rgba(239, 231, 250, 0.72), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(239, 231, 250, 0.2))',
      }}
    >
      <div className="absolute left-5 top-5 z-10 max-w-sm rounded-[26px] px-5 py-4" style={laneStyles.shell}>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={laneStyles.badge}>
            Insights Map
          </span>
          <span className="text-[11px] text-muted-foreground">Obsidian-inspired</span>
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight">A cleaner map of how your weeks connect</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Click a week to open its detail panel. Click a goal or insight to read the full text.
        </p>
      </div>

      <div className="absolute right-5 top-5 z-10 rounded-[26px] px-4 py-4" style={laneStyles.shell}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Legend</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-foreground/82">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-md bg-primary" />
            <span>Completed goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-md border border-border bg-background" />
            <span>Open goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-6 rounded-full bg-purpleSoft border border-[rgba(140,107,203,0.32)]" />
            <span>Tag cluster</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-6 rounded-xl bg-[rgba(244,240,255,0.95)] border border-[rgba(140,107,203,0.35)]" />
            <span>Insight</span>
          </div>
        </div>
      </div>

      <ReactFlowProvider>
        <ForceGraph {...props} toggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
      </ReactFlowProvider>
    </div>
  );
}
