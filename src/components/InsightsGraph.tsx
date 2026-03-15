'use client';

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Background,
  Controls,
  MiniMap,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AppState } from '@/types';
import { format, parseISO } from 'date-fns';

export default function InsightsGraph({ 
  weeks,
  projects 
}: { 
  weeks: AppState['weeks'],
  projects: AppState['projects']
}) {
  // Generate nodes and edges from weeks and projects
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const weekArray = Object.values(weeks).sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Grid spiral / simple layout variables
    const cols = Math.ceil(Math.sqrt(weekArray.length));
    
    weekArray.forEach((week, index) => {
      // Create a nice human label
      const parsedDate = parseISO(week.startDate);
      const label = `Week of ${format(parsedDate, "MMM d")}\n${week.learnings.length} insights`;
      
      // Calculate a rough grid position
      const row = Math.floor(index / cols);
      const col = index % cols;

      nodes.push({
        id: `week:${week.id}`,
        position: { x: col * 250, y: row * 150 },
        data: { label },
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px',
          width: 180,
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)', // Skeuomorphic extrusion
        }
      });

      // Compare this week with all PREVIOUS weeks to create edges
      // Rule: Connect if they share >= 2 tags
      const currentTags = new Set(week.learnings.flatMap(l => l.tags));
      
      for (let i = 0; i < index; i++) {
        const prevWeek = weekArray[i];
        const prevTags = new Set(prevWeek.learnings.flatMap(l => l.tags));
        
        // Count intersection
        let sharedCount = 0;
        currentTags.forEach(t => {
          if (prevTags.has(t)) sharedCount++;
        });

        if (sharedCount >= 2) {
          edges.push({
            id: `edge:week:${prevWeek.id}-week:${week.id}`,
            source: `week:${prevWeek.id}`,
            target: `week:${week.id}`,
            animated: true,
            style: { stroke: 'var(--muted-foreground)', opacity: 0.3, strokeWidth: 1 }
          });
        }
      }
    });

    // NOW ADD PROJECT NODES
    const projectArray = Object.values(projects);
    const projCols = Math.ceil(Math.sqrt(projectArray.length));
    
    projectArray.forEach((proj, index) => {
      // Put project nodes above/away from the grid
      const row = Math.floor(index / projCols);
      const col = index % projCols;
      
      nodes.push({
        id: `proj:${proj.id}`,
        position: { x: col * 350, y: -200 - (row * 150) },
        data: { label: proj.name },
        style: {
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          border: '1px solid var(--purple-secondary)', // Use the secondary line graph color
          borderRadius: '12px',
          padding: '16px',
          width: 220,
          fontWeight: 'bold',
          fontSize: '16px',
          fontFamily: 'var(--font-sans)',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)', // embossed text
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 6px -1px var(--purple-secondary), 0 2px 4px -2px var(--purple-secondary)',
          textAlign: 'center',
        }
      });

      // Connect weeks to this project if the week contains ANY project tag
      const projTags = new Set(proj.tags);
      weekArray.forEach(week => {
        const weekTags = new Set(week.learnings.flatMap(l => l.tags));
        let hasProjTag = false;
        
        for (const pt of projTags) {
          if (weekTags.has(pt)) {
            hasProjTag = true;
            break;
          }
        }

        if (hasProjTag) {
          edges.push({
            id: `edge:proj:${proj.id}-week:${week.id}`,
            source: `proj:${proj.id}`,
            target: `week:${week.id}`,
            animated: false,
            style: { stroke: 'var(--purple-secondary)', opacity: 0.8, strokeWidth: 2 }
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [weeks, projects]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
        colorMode="light"
      >
        <Background color="var(--border)" gap={24} />
        <Controls showInteractive={false} className="bg-background border-border fill-foreground" />
      </ReactFlow>
    </div>
  );
}
