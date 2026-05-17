import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { getDb } from '../../db/connection.js';
import { buildGraph } from './engine.service.js';

export default async function engineRoutes(fastify: FastifyInstance) {
  const db = getDb();

  // ── GET /api/v1/topologies ───────────────────────────────────────────────────
  fastify.get('/api/v1/topologies', { preHandler: fastify.authenticate }, async (_req, reply) => {
    const rows = await db
      .selectFrom('topology_definitions')
      .selectAll()
      .where('is_active', '=', 1)
      .orderBy('name', 'asc')
      .execute();

    const topologies = rows.map(r => ({
      id:                 r.id,
      name:               r.name,
      type:               r.type,
      description:        r.description ?? undefined,
      layoutAlgorithm:    r.layout_algorithm,
      autoRefreshSeconds: r.auto_refresh_seconds,
      isActive:           Boolean(r.is_active),
      createdAt:          r.created_at,
    }));
    return reply.send({ data: topologies });
  });

  // ── GET /api/v1/topologies/:id ───────────────────────────────────────────────
  fastify.get('/api/v1/topologies/:id', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const topo = await db
      .selectFrom('topology_definitions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!topo) return reply.status(404).send({ error: 'Topology not found' });
    return reply.send(topo);
  });

  // ── GET /api/v1/topologies/:id/graph ────────────────────────────────────────
  fastify.get('/api/v1/topologies/:id/graph', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const graph = await buildGraph(id);
    if (!graph) return reply.status(404).send({ error: 'Topology not found' });
    return reply.send(graph);
  });

  // ── POST /api/v1/topologies ──────────────────────────────────────────────────
  fastify.post('/api/v1/topologies', { preHandler: fastify.requireRole('admin') }, async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const id = randomUUID();

    await db.insertInto('topology_definitions').values({
      id,
      topo_uuid:            randomUUID(),
      name:                 body.name as string,
      type:                 (body.type as never) ?? 'CUSTOM',
      description:          (body.description as string) ?? null,
      connectors:           JSON.stringify(body.connectors ?? []),
      node_mapping:         JSON.stringify(body.nodeMapping ?? {}),
      edge_mapping:         JSON.stringify(body.edgeMapping ?? {}),
      layout_algorithm:     (body.layoutAlgorithm as string) ?? 'ELK_LAYERED',
      auto_refresh_seconds: (body.autoRefreshSeconds as number) ?? 30,
      created_by:           (body.createdBy as string) ?? null,
    }).execute();

    const created = await db.selectFrom('topology_definitions').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
    return reply.status(201).send(created);
  });

  // ── PUT /api/v1/topologies/:id ───────────────────────────────────────────────
  fastify.put('/api/v1/topologies/:id', { preHandler: fastify.requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;

    await db.updateTable('topology_definitions')
      .set({ ...body, updated_at: new Date() } as never)
      .where('id', '=', id)
      .execute();

    const updated = await db.selectFrom('topology_definitions').selectAll().where('id', '=', id).executeTakeFirst();
    if (!updated) return reply.status(404).send({ error: 'Topology not found' });
    return reply.send(updated);
  });

  // ── DELETE /api/v1/topologies/:id ───────────────────────────────────────────
  fastify.delete('/api/v1/topologies/:id', { preHandler: fastify.requireRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.updateTable('topology_definitions').set({ is_active: 0 }).where('id', '=', id).execute();
    return reply.status(204).send();
  });
}
