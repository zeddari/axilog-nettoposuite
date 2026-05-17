import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { getDb } from '../../db/connection.js';
import { trackTopologySubscription, startChangeDetector } from './change-detector.js';

let io: SocketIOServer | null = null;

export function getIo(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}

// ── Typed emit helpers (called from routes / change-detector) ─────────────────

export function emitNodeUpdate(topologyId: string, delta: {
  id: string; status?: string; customIcon?: string; utilizationPct?: number;
}) {
  getIo().of('/topology').to(`topo:${topologyId}`).emit('node:update', delta);
}

export function emitLinkUpdate(topologyId: string, delta: {
  id: string; status?: string; utilizationPct?: number;
}) {
  getIo().of('/topology').to(`topo:${topologyId}`).emit('link:update', delta);
}

export function emitTopologyRebuild(topologyId: string) {
  getIo().of('/topology').to(`topo:${topologyId}`).emit('topology:rebuild', { topologyId });
}

export function emitAlarmEvent(event: 'alarm:new' | 'alarm:cleared', payload: unknown) {
  getIo().of('/alarms').to('alarms:all').emit(event, payload);
}

export function emitAlarmCounts(counts: Record<string, number>) {
  getIo().of('/alarms').to('alarms:all').emit('alarm:counts', counts);
}

// ── JWT middleware factory ────────────────────────────────────────────────────
function makeAuthMiddleware(fastify: FastifyInstance) {
  return async (socket: Parameters<Parameters<SocketIOServer['use']>[0]>[0], next: (err?: Error) => void) => {
    try {
      // Try bearer token first (explicit auth), then fall back to cookie
      const authHeader = socket.handshake.auth?.token as string | undefined;
      const cookieToken = socket.handshake.headers.cookie
        ?.split(';')
        .find((c: string) => c.trim().startsWith('auth_token='))
        ?.split('=')[1];

      const token = authHeader ?? cookieToken;
      if (!token) return next(new Error('AUTH_REQUIRED'));

      const payload = fastify.jwt.verify(token) as { sub: string; role: string };
      socket.data.userId = payload.sub;
      socket.data.role   = payload.role;
      next();
    } catch {
      next(new Error('AUTH_INVALID'));
    }
  };
}

// ── Gateway init ──────────────────────────────────────────────────────────────
export async function initWebSocket(fastify: FastifyInstance) {
  io = new SocketIOServer(fastify.server, {
    cors: {
      origin:      process.env.APP_URL ?? 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout:  20_000,
    pingInterval: 10_000,
  });

  const authMiddleware = makeAuthMiddleware(fastify);

  // ── /topology namespace ───────────────────────────────────────────────────
  const topologyNs = io.of('/topology');
  topologyNs.use(authMiddleware as never);

  topologyNs.on('connection', socket => {
    // Subscribe to a topology room
    socket.on('subscribe', (topologyId: string) => {
      socket.join(`topo:${topologyId}`);
      trackTopologySubscription(topologyId, true);
      socket.emit('subscribed', { topologyId });
    });

    socket.on('unsubscribe', (topologyId: string) => {
      socket.leave(`topo:${topologyId}`);
      // Only untrack if no remaining subscribers
      const room = topologyNs.adapter.rooms?.get(`topo:${topologyId}`);
      if (!room || room.size === 0) trackTopologySubscription(topologyId, false);
    });

    socket.on('disconnect', () => {
      // Rooms are auto-left on disconnect; nothing extra needed
    });
  });

  // ── /alarms namespace ─────────────────────────────────────────────────────
  const alarmsNs = io.of('/alarms');
  alarmsNs.use(authMiddleware as never);

  alarmsNs.on('connection', socket => {
    socket.join('alarms:all');

    // Send fresh counts immediately on connect
    void (async () => {
      try {
        const db   = getDb();
        const rows = await db
          .selectFrom('alarms')
          .select(['severity', db.fn.count<number>('id').as('count')])
          .where('is_cleared', '=', 0)
          .groupBy('severity')
          .execute();

        const counts = { CRITICAL: 0, MAJOR: 0, MINOR: 0, WARNING: 0 };
        rows.forEach(r => { counts[r.severity as keyof typeof counts] = Number(r.count); });
        socket.emit('alarm:counts', counts);

        // Also send the 5 most recent uncleared alarms
        const recent = await db
          .selectFrom('alarms')
          .selectAll()
          .where('is_cleared', '=', 0)
          .orderBy('created_at', 'desc')
          .limit(5)
          .execute();

        socket.emit('alarm:recent', recent.map(a => ({
          id:         a.id,
          severity:   a.severity,
          title:      a.title,
          source:     a.source,
          topologyId: a.topology_id,
          nodeId:     a.node_id,
          createdAt:  a.created_at,
        })));
      } catch { /* DB not ready */ }
    })();
  });

  // ── /traffic namespace ────────────────────────────────────────────────────
  const trafficNs = io.of('/traffic');
  trafficNs.use(authMiddleware as never);
  trafficNs.on('connection', socket => {
    socket.on('subscribe', (topologyId: string) => socket.join(`traffic:${topologyId}`));
    socket.on('unsubscribe', (topologyId: string) => socket.leave(`traffic:${topologyId}`));
  });

  // ── Start the dirty-flag change detector ─────────────────────────────────
  startChangeDetector();

  fastify.log.info('Socket.IO initialised');
}
