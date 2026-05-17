import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import type { Node, Edge } from 'reactflow';

export interface NodeDelta {
  id: string; status?: string; customIcon?: string; utilizationPct?: number;
}
export interface LinkDelta {
  id: string; status?: string; utilizationPct?: number;
}

const STATUS_COLOR: Record<string, string> = {
  UP:          '#22c55e',
  DOWN:        '#ef4444',
  DEGRADED:    '#f59e0b',
  MAINTENANCE: '#3b82f6',
  UNKNOWN:     '#6b7280',
};
const STATUS_BG: Record<string, string> = {
  UP:          'rgba(34,197,94,0.12)',
  DOWN:        'rgba(239,68,68,0.15)',
  DEGRADED:    'rgba(245,158,11,0.15)',
  MAINTENANCE: 'rgba(59,130,246,0.12)',
  UNKNOWN:     'rgba(107,114,128,0.12)',
};

interface Options {
  topologyId: string;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onRebuild?: () => void;  // callback to re-fetch full graph
}

/**
 * Subscribes to the /topology namespace for a given topologyId.
 * Patches React Flow node/edge state in-place for partial updates,
 * or triggers onRebuild() for full graph refreshes.
 */
export function useTopologySocket({ topologyId, setNodes, setEdges, onRebuild }: Options) {
  const socket    = getSocket('/topology');
  const subIdRef  = useRef<string | null>(null);

  const patchNode = useCallback((delta: NodeDelta) => {
    setNodes(nodes => nodes.map(n => {
      if (n.id !== delta.id) return n;

      const updates: Partial<Node> = { data: { ...n.data } };

      if (delta.status) {
        updates.data = {
          ...updates.data,
          status: delta.status,
        };
        updates.style = {
          ...n.style,
          borderColor: STATUS_COLOR[delta.status] ?? '#6b7280',
          background:  STATUS_BG[delta.status]    ?? 'rgba(107,114,128,0.1)',
        };
      }

      if (delta.customIcon !== undefined) {
        updates.data = { ...updates.data, customIcon: delta.customIcon };
      }

      return { ...n, ...updates };
    }));
  }, [setNodes]);

  const patchEdge = useCallback((delta: LinkDelta) => {
    setEdges(edges => edges.map(e => {
      if (e.id !== delta.id) return e;

      const newData: Record<string, unknown> = { ...(e.data as object) };
      if (delta.status)         newData.status         = delta.status;
      if (delta.utilizationPct != null) newData.utilizationPct = delta.utilizationPct;

      return { ...e, data: newData };
    }));
  }, [setEdges]);

  useEffect(() => {
    if (!topologyId) return;

    const onNodeUpdate  = (delta: NodeDelta) => patchNode(delta);
    const onLinkUpdate  = (delta: LinkDelta) => patchEdge(delta);
    const onRebuildEvt  = () => onRebuild?.();
    const onSubscribed  = () => { subIdRef.current = topologyId; };

    socket.on('node:update',       onNodeUpdate);
    socket.on('link:update',       onLinkUpdate);
    socket.on('topology:rebuild',  onRebuildEvt);
    socket.on('subscribed',        onSubscribed);

    if (!socket.connected) {
      socket.connect();
      socket.once('connect', () => socket.emit('subscribe', topologyId));
    } else {
      socket.emit('subscribe', topologyId);
    }

    return () => {
      socket.emit('unsubscribe', topologyId);
      socket.off('node:update',      onNodeUpdate);
      socket.off('link:update',      onLinkUpdate);
      socket.off('topology:rebuild', onRebuildEvt);
      socket.off('subscribed',       onSubscribed);
      subIdRef.current = null;
    };
  }, [topologyId, socket, patchNode, patchEdge, onRebuild]);

  return { socket };
}
