import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { getDb } from '../../db/connection.js';

let io: SocketIOServer | null = null;

export function getIo(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}

export function emitTopologyDelta(topologyId: string, delta: unknown) {
  getIo().to(`topology:${topologyId}`).emit('topology:delta', delta);
}

export function emitAlarm(alarm: unknown) {
  getIo().to('alarms').emit('alarm:new', alarm);
}

export async function initWebSocket(fastify: FastifyInstance) {
  io = new SocketIOServer(fastify.server, {
    cors: {
      origin: process.env.APP_URL ?? '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── JWT auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ?? socket.handshake.headers.cookie
        ?.split(';')
        .find((c: string) => c.trim().startsWith('auth_token='))
        ?.split('=')[1];

      if (!token) return next(new Error('Authentication required'));
      const payload = fastify.jwt.verify(token) as { sub: string };
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── /topology namespace ──────────────────────────────────────────────────────
  const topologyNs = io.of('/topology');
  topologyNs.on('connection', socket => {
    socket.on('subscribe', (topologyId: string) => {
      socket.join(`topology:${topologyId}`);
    });
    socket.on('unsubscribe', (topologyId: string) => {
      socket.leave(`topology:${topologyId}`);
    });
  });

  // ── /alarms namespace ────────────────────────────────────────────────────────
  const alarmsNs = io.of('/alarms');
  alarmsNs.on('connection', socket => {
    socket.join('alarms');
    // Send current alarm counts on connect
    void (async () => {
      const db = getDb();
      const rows = await db
        .selectFrom('alarms')
        .select(['severity', db.fn.count<number>('id').as('count')])
        .where('is_cleared', '=', 0)
        .groupBy('severity')
        .execute();
      socket.emit('alarm:counts', rows);
    })();
  });

  fastify.log.info('Socket.IO initialised');
}
