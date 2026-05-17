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
import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import type { TopologyGraph, TopologyNode, TopologyLink } from '@/api/topology.api';
import { NODE_TYPES_MAP } from './nodes/nodeRegistry';
import { EDGE_TYPES } from './edges/TrafficEdge';
import { NodeDetailPanel } from './NodeDetailPanel';
import { applyElkLayout } from './layout/elkLayout';
import { useTopologySocket } from '@/hooks/useTopologySocket';
import { LayoutGrid, ZapOff, Zap, Wifi } from 'lucide-react';

// ── Node builder ──────────────────────────────────────────────────────────────
function toRfNode(n: TopologyNode, onNodeClick: (node: TopologyNode) => void): Node {
  return {
    id:       n.id,
    type:     n.type in NODE_TYPES_MAP ? n.type : 'ROUTER',
    position: { x: n.posX ?? 0, y: n.posY ?? 0 },
    data: {
      label:      n.label,
      status:     n.status,
      ipAddress:  n.ipAddress,
      vendor:     n.vendor,
      type:       n.type,
      properties: n.properties,
      customIcon: n.customIcon,
      onClick:    () => onNodeClick(n),
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

// Stable reference for React Flow nodeTypes prop
const NODE_TYPE_MAP = { ...NODE_TYPES_MAP };

interface Props {
  graph:            TopologyGraph;
  layoutAlgorithm?: string;
  onRebuild?:       () => void;
}

export function UniversalTopologyCanvas({ graph, layoutAlgorithm = 'ELK_LAYERED', onRebuild }: Props) {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [autoRefresh,  setAutoRefresh]  = useState(true);
  const [isLaying,     setIsLaying]     = useState(false);
  const rfInstance = useRef<{ fitView: () => void } | null>(null);
  const [liveUpdates, setLiveUpdates]   = useState(0); // counter for the "live" badge

  const handleNodeClick = useCallback((node: TopologyNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  // Build initial RF nodes/edges from the graph prop
  const [nodes, setNodes, onNodesChange] = useNodesState(
    useMemo(() => graph.nodes.map(n => toRfNode(n, handleNodeClick)), [graph, handleNodeClick])
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    useMemo(() => graph.links.map(toRfEdge), [graph])
  );

  // Sync when graph data changes (auto-refresh push)
  useEffect(() => {
    const rfNodes = graph.nodes.map(n => toRfNode(n, handleNodeClick));
    const rfEdges = graph.links.map(toRfEdge);
    setNodes(rfNodes);
    setEdges(rfEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // ── Socket.IO real-time patching ─────────────────────────────────────────────
  const { socket } = useTopologySocket({
    topologyId: graph.topologyId,
    setNodes,
    setEdges,
    onRebuild,
  });

  // Flash the "Live" badge on every socket event
  useEffect(() => {
    const bump = () => setLiveUpdates(n => n + 1);
    socket.on('node:update', bump);
    socket.on('link:update', bump);
    return () => { socket.off('node:update', bump); socket.off('link:update', bump); };
  }, [socket]);

  // ── ELK auto-layout ─────────────────────────────────────────────────────────
  const runLayout = useCallback(async () => {
    setIsLaying(true);
    try {
      const laid = await applyElkLayout(nodes, edges, layoutAlgorithm);
      setNodes(laid);
      // Give React Flow a tick to render before fitting
      setTimeout(() => rfInstance.current?.fitView(), 50);
    } finally {
      setIsLaying(false);
    }
  }, [nodes, edges, layoutAlgorithm, setNodes]);

  // Run ELK once on first mount / topology change
  const layoutRan = useRef(false);
  useEffect(() => {
    layoutRan.current = false;
  }, [graph.topologyId]);

  useEffect(() => {
    if (!layoutRan.current && nodes.length > 0) {
      layoutRan.current = true;
      void runLayout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, graph.topologyId]);

  // Handle icon change from the detail panel (update node data in place)
  const handleIconChanged = useCallback((nodeId: string, iconKey: string) => {
    setNodes(ns => ns.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, customIcon: iconKey } } : n
    ));
  }, [setNodes]);

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
        onInit={inst => { rfInstance.current = inst as never; }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1e2533" gap={24} size={1} />
        <Controls className="react-flow__controls" />
        <MiniMap
          nodeColor={() => '#334155'}
          style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8 }}
          maskColor="rgba(13,17,23,0.75)"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Canvas toolbar (top-left overlay) */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        {/* Re-layout button */}
        <button
          onClick={runLayout}
          disabled={isLaying}
          title="Re-run auto-layout"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                     bg-[#21262d] border border-[#30363d] text-[#8b949e]
                     hover:bg-[#30363d] hover:text-[#e6edf3] transition-colors
                     disabled:opacity-40 disabled:cursor-wait"
        >
          {isLaying
            ? <div className="w-3.5 h-3.5 border border-axilog-primary border-t-transparent rounded-full animate-spin" />
            : <LayoutGrid className="w-3.5 h-3.5" />
          }
          {isLaying ? 'Laying out…' : 'Auto-layout'}
        </button>

        {/* Traffic animation toggle */}
        <button
          onClick={() => setAutoRefresh(v => !v)}
          title={autoRefresh ? 'Pause traffic animation' : 'Resume traffic animation'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                      border transition-colors ${
                        autoRefresh
                          ? 'bg-axilog-secondary/20 border-axilog-secondary/50 text-axilog-secondary'
                          : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]'
                      }`}
        >
          {autoRefresh ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
          {autoRefresh ? 'Live' : 'Paused'}
        </button>

        {/* Socket live badge */}
        {socket.connected && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg
                          bg-[#21262d] border border-[#30363d] text-[10px] text-[#8b949e]">
            <Wifi className="w-3 h-3 text-green-400" />
            <span className="text-green-400 font-semibold">
              {liveUpdates > 0 ? `${liveUpdates} updates` : 'Socket connected'}
            </span>
          </div>
        )}
      </div>

      {/* Node detail side panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onIconChanged={handleIconChanged}
        />
      )}
    </div>
  );
}
