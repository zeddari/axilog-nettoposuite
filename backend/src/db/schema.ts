import type { Generated, Insertable, Selectable, Updateable, ColumnType } from 'kysely';

// ─── Users ────────────────────────────────────────────────────────────────────
export interface UsersTable {
  id:            Generated<string>;
  email:         string;
  display_name:  string;
  password_hash: string | null;
  role:          'admin' | 'operator' | 'service_manager' | 'viewer';
  provider:      'local' | 'keycloak';
  external_id:   string | null;
  is_active:     Generated<number>;  // TINYINT(1)
  api_tokens:    ColumnType<string, string | undefined, string | undefined>; // JSON
  created_at:    Generated<Date>;
  updated_at:    Generated<Date>;
}

export type UserRow        = Selectable<UsersTable>;
export type NewUser        = Insertable<UsersTable>;
export type UpdateUser     = Updateable<UsersTable>;

// ─── Topology Definitions ─────────────────────────────────────────────────────
export interface TopologyDefinitionsTable {
  id:                  Generated<string>;
  topo_uuid:           string;
  name:                string;
  type:                'IP_MPLS' | '5G_CORE' | '5G_RAN' | 'TRANSPORT' | 'ACCESS' | 'CUSTOM';
  description:         string | null;
  connectors:          ColumnType<string, string, string>;         // JSON
  node_mapping:        ColumnType<string, string, string>;
  edge_mapping:        ColumnType<string, string, string>;
  layout_algorithm:    string;
  auto_refresh_seconds: Generated<number>;
  is_active:           Generated<number>;
  graph_hash:          string | null;
  created_by:          string | null;
  created_at:          Generated<Date>;
  updated_at:          Generated<Date>;
}

// ─── Topology Nodes ───────────────────────────────────────────────────────────
export interface TopologyNodesTable {
  id:          Generated<string>;
  node_uuid:   string;
  topology_id: string;
  label:       string;
  type:        string;
  status:      'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN' | 'MAINTENANCE';
  ip_address:  string | null;
  vendor:      string | null;
  model:       string | null;
  properties:  ColumnType<string, string, string>; // JSON
  pos_x:       number | null;
  pos_y:       number | null;
  layer:       string | null;
  custom_icon: string | null;
  discovered_at: Date | null;
  updated_at:  Generated<Date>;
}

// ─── Topology Links ───────────────────────────────────────────────────────────
export interface TopologyLinksTable {
  id:               Generated<string>;
  link_uuid:        string;
  topology_id:      string;
  source_node_id:   string;
  target_node_id:   string;
  label:            string | null;
  status:           'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
  bandwidth_mbps:   number | null;
  utilization_pct:  number | null;
  properties:       ColumnType<string, string, string>; // JSON
  updated_at:       Generated<Date>;
}

// ─── Alarms ───────────────────────────────────────────────────────────────────
export interface AlarmsTable {
  id:            Generated<string>;
  alarm_uuid:    string;
  topology_id:   string | null;
  node_id:       string | null;
  severity:      'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'CLEARED';
  title:         string;
  description:   string | null;
  source:        string;
  is_acknowledged: Generated<number>;
  acknowledged_by: string | null;
  acknowledged_at: Date | null;
  is_cleared:    Generated<number>;
  cleared_at:    Date | null;
  properties:    ColumnType<string, string | undefined, string | undefined>; // JSON
  created_at:    Generated<Date>;
}

// ─── Discovery Targets ────────────────────────────────────────────────────────
export interface DiscoveryTargetsTable {
  id:           Generated<string>;
  name:         string;
  type:         'SNMP' | 'GRPC' | 'ZABBIX' | 'NRF';
  host:         string | null;
  port:         number | null;
  topology_id:  string | null;
  credentials:  ColumnType<string, string | undefined, string | undefined>; // JSON (AES encrypted)
  config:       ColumnType<string, string | undefined, string | undefined>; // JSON
  schedule:     string | null; // cron expression
  last_run_at:  Date | null;
  last_status:  string | null;
  is_enabled:   Generated<number>;
  created_at:   Generated<Date>;
}

// ─── Catalogue Services ───────────────────────────────────────────────────────
export interface CatalogueServicesTable {
  id:            Generated<string>;
  service_uuid:  string;
  name:          string;
  category:      string | null;
  status:        'active' | 'inactive' | 'maintenance' | 'deprecated';
  health:        'healthy' | 'degraded' | 'critical' | 'unknown';
  description:   string | null;
  owner:         string | null;
  sla_target:    number | null;     // percentage e.g. 99.9
  topology_id:   string | null;     // linked topology
  meta:          ColumnType<string, string | undefined, string | undefined>; // JSON
  created_at:    Generated<Date>;
  updated_at:    Generated<Date>;
}

// ─── Service Flows ────────────────────────────────────────────────────────────
export interface ServiceFlowsTable {
  id:           Generated<string>;
  service_id:   string;
  name:         string;
  flow_data:    ColumnType<string, string, string>; // JSON (React Flow nodes+edges)
  version:      Generated<number>;
  is_published: Generated<number>;
  created_at:   Generated<Date>;
  updated_at:   Generated<Date>;
}

// ─── Node Icons ───────────────────────────────────────────────────────────────
export interface NodeIconsTable {
  id:          string;
  name:        string;
  category:    Generated<string>;
  icon_key:    string | null;
  file_path:   string | null;
  mime_type:   Generated<string>;
  uploaded_by: string | null;
  created_at:  Generated<Date>;
}

// ─── Database Interface ───────────────────────────────────────────────────────
export interface Database {
  users:                UsersTable;
  topology_definitions: TopologyDefinitionsTable;
  topology_nodes:       TopologyNodesTable;
  topology_links:       TopologyLinksTable;
  alarms:               AlarmsTable;
  discovery_targets:    DiscoveryTargetsTable;
  catalogue_services:   CatalogueServicesTable;
  service_flows:        ServiceFlowsTable;
  node_icons:           NodeIconsTable;
}
