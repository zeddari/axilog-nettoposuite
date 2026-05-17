import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/connection.js';

export default async function alarmsRoutes(fastify: FastifyInstance) {
  const db = getDb();

  // ── GET /api/v1/alarms ───────────────────────────────────────────────────────
  fastify.get('/api/v1/alarms', { preHandler: fastify.authenticate }, async (req, reply) => {
    const { severity, topologyId } = req.query as Record<string, string>;

    let qb = db
      .selectFrom('alarms')
      .selectAll()
      .where('is_cleared', '=', 0)
      .orderBy('created_at', 'desc');

    if (severity)   qb = qb.where('severity', '=', severity as never);
    if (topologyId) qb = qb.where('topology_id', '=', topologyId);

    const alarms = await qb.limit(200).execute();
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
