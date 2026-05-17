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
import { useMemo, useEffect, useState, useCallback } from 'react';
import type { TopologyGraph, TopologyNode, TopologyLink } from '@/api/topology.api';
import { NODE_TYPES_MAP } from './nodes/nodeRegistry';
import { EDGE_TYPES } from './edges/TrafficEdge';
import { NodeDetailPanel } from './NodeDetailPanel';

// ── Node builder ──────────────────────────────────────────────────────────────
function toRfNode(n: TopologyNode, onNodeClick: (data: TopologyNode) => void): Node {
  return {
    id:       n.id,
    type:     n.type in NODE_TYPES_MAP ? n.type : 'ROUTER',
    position: { x: n.posX ?? Math.random() * 700, y: n.posY ?? Math.random() * 450 },
    data: {
      label:          n.label,
      status:         n.status,
      ipAddress:      n.ipAddress,
      vendor:         n.vendor,
      type:           n.type,
      properties:     n.properties,
      onClick:        () => onNodeClick(n),
    },
  };
}

// ── Edge builder ──────────────────────────────────────────────────────────────
function toRfEdge(l: TopologyLink): Edge {
  return {
    id:     l.id,
    source: l.sourceNodeId,
    target: l.targetNodeId,
    type:   'traffic',
    data: {
      status:         l.status,
      utilizationPct: l.utilizationPct ?? 0,
      bandwidthMbps:  l.bandwidthMbps,
    },
  };
}

// Stable reference — built once outside the component to avoid React Flow re-render loops
const NODE_TYPE_MAP = { ...NODE_TYPES_MAP };

interface Props { graph: TopologyGraph }

export function UniversalTopologyCanvas({ graph }: Props) {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  const handleNodeClick = useCallback((node: TopologyNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const initialNodes = useMemo(
    () => graph.nodes.map(n => toRfNode(n, handleNodeClick)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph]
  );
  const initialEdges = useMemo(() => graph.links.map(toRfEdge), [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(graph.nodes.map(n => toRfNode(n, handleNodeClick)));
    setEdges(graph.links.map(toRfEdge));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  return (
    <div className="topology-canvas-wrapper relative w-full h-full" style={{ minHeight: 480 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPE_MAP}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        onPaneClick={() => setSelectedNode(null)}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#1e2533"
          gap={24}
          size={1}
        />
        <Controls className="react-flow__controls" />
        <MiniMap
          nodeColor={() => '#334155'}
          style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8 }}
          maskColor="rgba(13,17,23,0.75)"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Node detail side panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
