import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo, useEffect } from 'react';
import type { TopologyGraph, TopologyNode, TopologyLink } from '@/api/topology.api';

// Status → node ring colour
const STATUS_COLORS: Record<string, string> = {
  UP:          '#22c55e',
  DOWN:        '#ef4444',
  DEGRADED:    '#f59e0b',
  MAINTENANCE: '#3b82f6',
  UNKNOWN:     '#6b7280',
};

// Map topology node → React Flow node
function toRfNode(n: TopologyNode): Node {
  return {
    id:       n.id,
    type:     'default',
    position: { x: n.posX ?? Math.random() * 600, y: n.posY ?? Math.random() * 400 },
    data: {
      label: (
        <div className="flex flex-col items-center gap-1 px-2 py-1">
          <span className="text-[11px] font-semibold text-white leading-none">{n.label}</span>
          {n.ipAddress && (
            <span className="text-[9px] text-gray-400 font-mono leading-none">{n.ipAddress}</span>
          )}
        </div>
      ),
    },
    style: {
      background:   '#21262d',
      border:       `2px solid ${STATUS_COLORS[n.status] ?? '#6b7280'}`,
      borderRadius: 8,
      color:        '#e6edf3',
      minWidth:     80,
      fontSize:     11,
    },
  };
}

// Map topology link → React Flow edge
function toRfEdge(l: TopologyLink): Edge {
  const isActive   = l.status === 'UP';
  const utilPct    = l.utilizationPct ?? 0;
  const edgeColor  = l.status === 'DOWN' ? '#ef4444'
    : utilPct > 80 ? '#f97316'
    : utilPct > 50 ? '#f59e0b'
    : '#22c55e';

  return {
    id:     l.id,
    source: l.sourceNodeId,
    target: l.targetNodeId,
    label:  l.utilizationPct != null ? `${l.utilizationPct.toFixed(0)}%` : undefined,
    type:   'smoothstep',
    animated: isActive && utilPct > 10,  // animate when traffic flows
    style: {
      stroke:          edgeColor,
      strokeWidth:     utilPct > 50 ? 3 : 2,
      strokeDasharray: l.status === 'DOWN' ? '6 3' : undefined,
    },
    labelStyle: { fill: '#8b949e', fontSize: 10, fontFamily: 'Inter, sans-serif' },
    labelBgStyle: { fill: '#21262d', fillOpacity: 0.8 },
  };
}

interface Props { graph: TopologyGraph; }

export function UniversalTopologyCanvas({ graph }: Props) {
  const initialNodes = useMemo(() => graph.nodes.map(toRfNode), [graph]);
  const initialEdges = useMemo(() => graph.links.map(toRfEdge), [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when graph data changes (auto-refresh)
  useEffect(() => {
    setNodes(graph.nodes.map(toRfNode));
    setEdges(graph.links.map(toRfEdge));
  }, [graph, setNodes, setEdges]);

  return (
    <div className="topology-canvas-wrapper w-full h-full" style={{ minHeight: 400 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#1c2333"
          gap={20}
          size={1}
        />
        <Controls className="react-flow__controls" />
        <MiniMap
          nodeColor={node => {
            const border = (node.style?.border as string | undefined) ?? '';
            const match = border.match(/#[0-9a-fA-F]{6}/);
            return match ? match[0] : '#6b7280';
          }}
          style={{ background: '#161b22', border: '1px solid #30363d' }}
          maskColor="rgba(13,17,23,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
