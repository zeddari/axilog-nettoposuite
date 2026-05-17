import { getDb } from '../../db/connection.js';
import type { TopologyGraph } from '../../shared/types.js';

/**
 * Core dynamic topology engine.
 * Loads the topology definition, fetches all nodes + links for that topology,
 * applies the node/edge mapping config, and returns a normalised graph.
 */
export async function buildGraph(topologyId: string): Promise<TopologyGraph | null> {
  const db = getDb();

  const definition = await db
    .selectFrom('topology_definitions')
    .selectAll()
    .where('id', '=', topologyId)
    .where('is_active', '=', 1)
    .executeTakeFirst();

  if (!definition) return null;

  const [rawNodes, rawLinks] = await Promise.all([
    db.selectFrom('topology_nodes').selectAll().where('topology_id', '=', topologyId).execute(),
    db.selectFrom('topology_links').selectAll().where('topology_id', '=', topologyId).execute(),
  ]);

  const parseJsonField = (val: unknown): Record<string, unknown> => {
    if (!val) return {};
    if (typeof val === 'string') return JSON.parse(val);
    return val as Record<string, unknown>;
  };
  const nodeMapping = parseJsonField(definition.node_mapping);
  const edgeMapping = parseJsonField(definition.edge_mapping);

  const nodes = rawNodes.map(n => ({
    id:         n.id,
    nodeUuid:   n.node_uuid,
    topologyId: n.topology_id,
    label:      applyMapping(n.label,  nodeMapping['label'])  ?? n.label,
    type:       applyMapping(n.type,   nodeMapping['type'])   ?? n.type,
    status:     n.status,
    ipAddress:  n.ip_address ?? undefined,
    vendor:     n.vendor     ?? undefined,
    model:      n.model      ?? undefined,
    properties:  parseJsonField(n.properties),
    posX:        n.pos_x       ?? undefined,
    posY:        n.pos_y       ?? undefined,
    customIcon:  n.custom_icon ?? undefined,
  }));

  const links = rawLinks.map(l => ({
    id:            l.id,
    linkUuid:      l.link_uuid,
    topologyId:    l.topology_id,
    sourceNodeId:  l.source_node_id,
    targetNodeId:  l.target_node_id,
    label:         applyMapping(l.label ?? '', edgeMapping['label']) ?? l.label ?? undefined,
    status:        l.status,
    bandwidthMbps: l.bandwidth_mbps  ?? undefined,
    utilizationPct: l.utilization_pct ?? undefined,
    properties:    parseJsonField(l.properties),
  }));

  return {
    topologyId,
    version:     1,
    nodes,
    links,
    generatedAt: new Date(),
  };
}

/**
 * Minimal mapping resolver — supports static overrides and field-path lookups.
 * Extend this to support JSONPath, Lua transforms, etc.
 */
function applyMapping(value: string, mapping: unknown): string | undefined {
  if (!mapping) return undefined;
  if (typeof mapping === 'string') return mapping; // static override
  return undefined; // TODO: implement JSONPath / template expression support
}
