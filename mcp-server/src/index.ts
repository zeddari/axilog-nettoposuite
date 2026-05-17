/**
 * Axilog NetTopoSuite — MCP Server
 *
 * Exposes network topology, alarm, and catalogue data as MCP tools and resources,
 * enabling AI clients (Claude Desktop, Cursor, embedded chat) to query and act
 * on the network via natural language.
 *
 * Transport: SSE (for embedded chat / Cursor) or stdio (for Claude Desktop).
 */
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';

const API_URL   = process.env.VITE_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';
const API_TOKEN = process.env.MCP_API_TOKEN ?? '';

const api = axios.create({
  baseURL: API_URL,
  headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
  timeout: 10_000,
});

const server = new McpServer({
  name:    'axilog-nettoposuite',
  version: '1.0.0',
});

// ── Tool: list-topologies ─────────────────────────────────────────────────────
server.tool(
  'list-topologies',
  'List all configured network topology definitions',
  {},
  async () => {
    const { data } = await api.get('/api/v1/topologies');
    const topologies = data.data as { id: string; name: string; type: string; description?: string }[];
    return {
      content: [{
        type: 'text',
        text: topologies.length === 0
          ? 'No topologies configured.'
          : topologies.map(t => `• ${t.name} (${t.type}) — ID: ${t.id}`).join('\n'),
      }],
    };
  }
);

// ── Tool: get-topology-graph ─────────────────────────────────────────────────
server.tool(
  'get-topology-graph',
  'Fetch the current node/link graph for a specific topology',
  { topologyId: z.string().describe('Topology definition ID') },
  async ({ topologyId }) => {
    const { data } = await api.get(`/api/v1/topologies/${topologyId}/graph`);
    const { nodes, links } = data;
    const nodeLines = (nodes as { label: string; status: string; ipAddress?: string }[])
      .map(n => `  ${n.label} [${n.status}]${n.ipAddress ? ` @ ${n.ipAddress}` : ''}`)
      .join('\n');
    const downNodes = (nodes as { label: string; status: string }[])
      .filter(n => n.status === 'DOWN' || n.status === 'DEGRADED')
      .map(n => n.label);
    return {
      content: [{
        type: 'text',
        text: [
          `Topology graph — ${nodes.length} nodes, ${links.length} links`,
          downNodes.length ? `\n⚠️ Degraded/Down nodes: ${downNodes.join(', ')}` : '',
          '\nNodes:\n' + nodeLines,
        ].join(''),
      }],
    };
  }
);

// ── Tool: get-active-alarms ───────────────────────────────────────────────────
server.tool(
  'get-active-alarms',
  'Get current active (uncleared) alarms, optionally filtered by severity',
  {
    severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING']).optional()
      .describe('Filter by severity level'),
  },
  async ({ severity }) => {
    const { data } = await api.get('/api/v1/alarms', { params: severity ? { severity } : {} });
    const alarms = data.data as { severity: string; title: string; source: string; created_at: string }[];
    return {
      content: [{
        type: 'text',
        text: alarms.length === 0
          ? 'No active alarms.'
          : alarms.map(a => `[${a.severity}] ${a.title} (source: ${a.source}) — ${new Date(a.created_at).toLocaleString()}`).join('\n'),
      }],
    };
  }
);

// ── Tool: query-nodes ────────────────────────────────────────────────────────
server.tool(
  'query-nodes',
  'Search topology nodes by topology ID, status, or type',
  {
    topologyId: z.string().optional().describe('Filter by topology'),
    status:     z.enum(['UP', 'DOWN', 'DEGRADED', 'UNKNOWN', 'MAINTENANCE']).optional(),
    type:       z.string().optional().describe('Node type e.g. ROUTER, SWITCH, GNB'),
  },
  async (params) => {
    const { data } = await api.get('/api/v1/topology/nodes', { params });
    const nodes = data.data as { label: string; type: string; status: string; ipAddress?: string }[];
    return {
      content: [{
        type: 'text',
        text: nodes.length === 0
          ? 'No nodes match the query.'
          : `Found ${nodes.length} node(s):\n` +
            nodes.map(n => `  ${n.label} — type: ${n.type}, status: ${n.status}${n.ipAddress ? `, ip: ${n.ipAddress}` : ''}`).join('\n'),
      }],
    };
  }
);

// ── Tool: list-catalogue-services ────────────────────────────────────────────
server.tool(
  'list-catalogue-services',
  'List services in the service catalogue',
  {
    status: z.enum(['active', 'inactive', 'maintenance', 'deprecated']).optional(),
    health: z.enum(['healthy', 'degraded', 'critical', 'unknown']).optional(),
  },
  async (params) => {
    const { data } = await api.get('/api/v1/catalogue/services', { params });
    const services = data.data as { name: string; status: string; health: string; category?: string }[];
    return {
      content: [{
        type: 'text',
        text: services.length === 0
          ? 'No services found.'
          : services.map(s => `• ${s.name} — ${s.status} / ${s.health}${s.category ? ` [${s.category}]` : ''}`).join('\n'),
      }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Axilog MCP server running (stdio transport)');
