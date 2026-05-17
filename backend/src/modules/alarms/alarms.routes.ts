import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/connection.js';

export default async function alarmsRoutes(fastify: FastifyInstance) {
  const db = getDb();

  // ── GET /api/v1/alarms ───────────────────────────────────────────────────────
  fastify.get('/api/v1/alarms', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { severity, topologyId, limit } = req.query as Record<string, string>;
    const rowLimit = Math.min(Number(limit) || 200, 500);

    let qb = db
      .selectFrom('alarms')
      .selectAll()
      .where('is_cleared', '=', 0)
      .orderBy('created_at', 'desc');

    if (severity)   qb = qb.where('severity', '=', severity as never);
    if (topologyId) qb = qb.where('topology_id', '=', topologyId);

    const rows = await qb.limit(rowLimit).execute();
    const alarms = rows.map(r => ({
      id:         r.id,
      severity:   r.severity,
      title:      r.title,
      source:     r.source,
      topologyId: r.topology_id,
      nodeId:     r.node_id,
      createdAt:  r.created_at,
    }));
    return reply.send({ data: alarms });
  });

  // ── GET /api/v1/alarms/counts ────────────────────────────────────────────────
  fastify.get('/api/v1/alarms/counts', { preHandler: fastify.authenticate }, async (_req, reply) => {
    const rows = await db
      .selectFrom('alarms')
      .select(['severity', db.fn.count<number>('id').as('count')])
      .where('is_cleared', '=', 0)
      .groupBy('severity')
      .execute();

    const counts = { CRITICAL: 0, MAJOR: 0, MINOR: 0, WARNING: 0 };
    rows.forEach(r => { counts[r.severity as keyof typeof counts] = Number(r.count); });
    return reply.send(counts);
  });

  // ── PUT /api/v1/alarms/:id/ack ───────────────────────────────────────────────
  fastify.put('/api/v1/alarms/:id/ack', { preHandler: fastify.requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.updateTable('alarms')
      .set({ is_acknowledged: 1, acknowledged_by: req.user.sub, acknowledged_at: new Date() })
      .where('id', '=', id)
      .execute();
    return reply.send({ ok: true });
  });

  // ── PUT /api/v1/alarms/:id/clear ─────────────────────────────────────────────
  fastify.put('/api/v1/alarms/:id/clear', { preHandler: fastify.requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.updateTable('alarms')
      .set({ is_cleared: 1, cleared_at: new Date() })
      .where('id', '=', id)
      .execute();
    return reply.send({ ok: true });
  });
}
