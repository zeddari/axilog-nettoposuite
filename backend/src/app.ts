import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';

import authPlugin from './plugins/auth.js';
import localAuthRoutes from './modules/auth/local.routes.js';
import keycloakRoutes from './modules/auth/keycloak.routes.js';
import topologyRoutes from './modules/topology/topology.routes.js';
import engineRoutes from './modules/topology-engine/engine.routes.js';
import alarmsRoutes from './modules/alarms/alarms.routes.js';
import iconsRoutes from './modules/icons/icons.routes.js';
import { initWebSocket } from './modules/realtime/websocket.gateway.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      ...(process.env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    },
  });

  // ── Core plugins ────────────────────────────────────────────────────────────
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin:      process.env.APP_URL ?? 'http://localhost:5173',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
  await fastify.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await fastify.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } }); // 2 MB max

  // ── Auth plugin (JWT + cookie) ───────────────────────────────────────────────
  await fastify.register(authPlugin);

  // ── Routes ──────────────────────────────────────────────────────────────────
  await fastify.register(localAuthRoutes);
  await fastify.register(keycloakRoutes);
  await fastify.register(topologyRoutes);
  await fastify.register(engineRoutes);
  await fastify.register(alarmsRoutes);
  await fastify.register(iconsRoutes);

  // ── Health check ────────────────────────────────────────────────────────────
  fastify.get('/health', async () => ({ status: 'ok', version: '1.0.0', ts: new Date().toISOString() }));

  // ── WebSocket ────────────────────────────────────────────────────────────────
  await initWebSocket(fastify);

  return fastify;
}
