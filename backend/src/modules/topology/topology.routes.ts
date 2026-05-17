import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getDb } from '../../db/connection.js';

const CreateNodeSchema = z.object({
  label:     z.string().min(1),
  type:      z.string().min(1),
  topologyId: z.string().uuid(),
  ipAddress: z.string().optional(),
  vendor:    z.string().optional(),
  model:     z.string().optional(),
  posX:      z.number().optional(),
  posY:      z.number().optional(),
  properties: z.record(z.unknown()).optional(),
});

export default async function topologyRoutes(fastify: FastifyInstance) {
  const db = getDb();

  // ── GET /api/v1/topology/nodes ───────────────────────────────────────────────
  fastify.get('/api/v1/topology/nodes', { preHandler: fastify.authenticate }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const { topologyId, status, type, q, page = '1', limit = '50' } = query;

    let qb = db.selectFrom('topology_nodes').selectAll();

    if (topologyId) qb = qb.where('topology_id', '=', topologyId);
    if (status)     qb = qb.where('status', '=', status as never);
    if (type)       qb = qb.where('type', '=', type);

    const offset = (Number(page) - 1) * Number(limit);
    const nodes = await qb.limit(Number(limit)).offset(offset).execute();

    return reply.send({ data: nodes, page: Number(page), pageSize: Number(limit) });
  });

  // ── GET /api/v1/topology/nodes/:id ──────────────────────────────────────────
  fastify.get('/api/v1/topology/nodes/:id', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const node = await db.selectFrom('topology_nodes').selectAll().where('id', '=', id).executeTakeFirst();
    if (!node) return reply.status(404).send({ error: 'Node not found' });
    return reply.send(node);
  });

  // ── POST /api/v1/topology/nodes ──────────────────────────────────────────────
  fastify.post('/api/v1/topology/nodes', { preHandler: fastify.requireRole('admin', 'operator') }, async (req, reply) => {
    const body = CreateNodeSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Validation error', details: body.error.flatten() });

    const id = randomUUID();
    await db.insertInto('topology_nodes').values({
      id,
      node_uuid:   randomUUID(),
      topology_id: body.data.topologyId,
      label:       body.data.label,
      type:        body.data.type,
      status:      'UNKNOWN',
      ip_address:  body.data.ipAddress ?? null,
      vendor:      body.data.vendor    ?? null,
      model:       body.data.model     ?? null,
      properties:  JSON.stringify(body.data.properties ?? {}),
      pos_x:       body.data.posX      ?? null,
      pos_y:       body.data.posY      ?? null,
    }).execute();

    const node = await db.selectFrom('topology_nodes').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
    return reply.status(201).send(node);
  });

  // ── PUT /api/v1/topology/nodes/:id ──────────────────────────────────────────
  fastify.put('/api/v1/topology/nodes/:id', { preHandler: fastify.requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;

    await db.updateTable('topology_nodes')
      .set({ ...body, updated_at: new Date() } as never)
      .where('id', '=', id)
      .execute();

    const updated = await db.selectFrom('topology_nodes').selectAll().where('id', '=', id).executeTakeFirst();
    if (!updated) return reply.status(404).send({ error: 'Node not found' });
    return reply.send(updated);
  });

  // ── DELETE /api/v1/topology/nodes/:id ───────────────────────────────────────
  fastify.delete('/api/v1/topology/nodes/:id', { preHandler: fastify.requireRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.deleteFrom('topology_nodes').where('id', '=', id).execute();
    return reply.status(204).send();
  });

  // ── GET /api/v1/topology/links ───────────────────────────────────────────────
  fastify.get('/api/v1/topology/links', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { topologyId } = req.query as Record<string, string>;
    let qb = db.selectFrom('topology_links').selectAll();
    if (topologyId) qb = qb.where('topology_id', '=', topologyId);
    const links = await qb.execute();
    return reply.send({ data: links });
  });

  // ── POST /api/v1/topology/links ──────────────────────────────────────────────
  fastify.post('/api/v1/topology/links', { preHandler: fastify.requireRole('admin', 'operator') }, async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const id = randomUUID();

    await db.insertInto('topology_links').values({
      id,
      link_uuid:       randomUUID(),
      topology_id:     body.topologyId as string,
      source_node_id:  body.sourceNodeId as string,
      target_node_id:  body.targetNodeId as string,
      label:           (body.label as string) ?? null,
      status:          'UNKNOWN',
      bandwidth_mbps:  (body.bandwidthMbps as number) ?? null,
      utilization_pct: null,
      properties:      JSON.stringify(body.properties ?? {}),
    }).execute();

    const link = await db.selectFrom('topology_links').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
    return reply.status(201).send(link);
  });
}
