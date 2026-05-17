import { http } from './http';

export interface TopologyDefinition {
  id: string; name: string; type: string; description?: string;
  autoRefreshSeconds: number; isActive: boolean;
}

export interface TopologyGraph {
  topologyId: string; version: number;
  nodes: TopologyNode[]; links: TopologyLink[]; generatedAt: string;
}

export interface TopologyNode {
  id: string; label: string; type: string; status: string;
  ipAddress?: string; vendor?: string; model?: string;
  posX?: number; posY?: number; properties: Record<string, unknown>;
}

export interface TopologyLink {
  id: string; sourceNodeId: string; targetNodeId: string;
  label?: string; status: string; bandwidthMbps?: number; utilizationPct?: number;
}

export const topologyApi = {
  listDefinitions: async (): Promise<TopologyDefinition[]> => {
    const { data } = await http.get<{ data: TopologyDefinition[] }>('/api/v1/topologies');
    return data.data;
  },

  getGraph: async (id: string): Promise<TopologyGraph> => {
    const { data } = await http.get<TopologyGraph>(`/api/v1/topologies/${id}/graph`);
    return data;
  },

  listNodes: async (topologyId?: string): Promise<TopologyNode[]> => {
    const { data } = await http.get<{ data: TopologyNode[] }>('/api/v1/topology/nodes', {
      params: topologyId ? { topologyId } : {},
    });
    return data.data;
  },
};
