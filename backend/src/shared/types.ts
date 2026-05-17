export type Role = 'admin' | 'operator' | 'service_manager' | 'viewer';
export type AuthProvider = 'local' | 'keycloak';

export interface JwtPayload {
  sub: string;       // user UUID
  role: Role;
  email: string;
  provider: AuthProvider;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  provider: AuthProvider;
  externalId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Topology types ───────────────────────────────────────────────────────────

export type TopologyType = 'IP_MPLS' | '5G_CORE' | '5G_RAN' | 'TRANSPORT' | 'ACCESS' | 'CUSTOM';
export type NodeStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN' | 'MAINTENANCE';
export type LinkStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';

export interface TopologyDefinition {
  id: string;
  topoUuid: string;
  name: string;
  type: TopologyType;
  description?: string;
  connectors: TopologyConnector[];
  nodeMapping: Record<string, unknown>;
  edgeMapping: Record<string, unknown>;
  layoutAlgorithm: 'ELK_LAYERED' | 'FORCE_DIRECTED' | 'RADIAL' | 'MANUAL';
  autoRefreshSeconds: number;
  isActive: boolean;
}

export interface TopologyConnector {
  id: string;
  type: 'SNMP' | 'GRPC' | 'ZABBIX' | 'NRF' | 'MANUAL';
  config: Record<string, unknown>;
  priority: number;
  isEnabled: boolean;
}

export interface TopologyNode {
  id: string;
  nodeUuid: string;
  topologyId: string;
  label: string;
  type: string;
  status: NodeStatus;
  ipAddress?: string;
  vendor?: string;
  model?: string;
  properties: Record<string, unknown>;
  posX?: number;
  posY?: number;
}

export interface TopologyLink {
  id: string;
  linkUuid: string;
  topologyId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  status: LinkStatus;
  bandwidthMbps?: number;
  utilizationPct?: number;
  properties: Record<string, unknown>;
}

export interface TopologyGraph {
  topologyId: string;
  version: number;
  nodes: TopologyNode[];
  links: TopologyLink[];
  generatedAt: Date;
}
