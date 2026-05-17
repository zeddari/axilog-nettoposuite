import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getDb } from '../../db/connection.js';

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  email:       z.string().email(),
  password:    z.string().min(10, 'Password must be at least 10 characters'),
  displayName: z.string().min(2),
  inviteToken: z.string().optional(),
});

export default async function localAuthRoutes(fastify: FastifyInstance) {
  const db = getDb();

  // ── POST /api/v1/auth/login ──────────────────────────────────────────────────
  fastify.post('/api/v1/auth/login', async (req, reply) => {
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Validation error', details: body.error.flatten() });

    const { email, password } = body.data;

    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .where('provider', '=', 'local')
      .where('is_active', '=', 1)
      .executeTakeFirst();

    if (!user || !user.password_hash) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return reply.status(401).send({ error: 'Invalid email or password' });

    const token = fastify.jwt.sign({
      sub:      user.id,
      role:     user.role,
      email:    user.email,
      provider: 'local',
    });

    return reply
      .setCookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', path: '/' })
      .send({ id: user.id, email: user.email, displayName: user.display_name, role: user.role });
  });

  // ── POST /api/v1/auth/register ───────────────────────────────────────────────
  fastify.post('/api/v1/auth/register', async (req, reply) => {
    if (process.env.ALLOW_REGISTRATION !== 'true') {
      return reply.status(403).send({ error: 'Self-registration is disabled' });
    }

    const body = RegisterSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Validation error', details: body.error.flatten() });

    const { email, password, displayName } = body.data;

    const existing = await db.selectFrom('users').select('id').where('email', '=', email.toLowerCase()).executeTakeFirst();
    if (existing) return reply.status(409).send({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    const id = randomUUID();
    await db.insertInto('users').values({
      id,
      email:         email.toLowerCase(),
      display_name:  displayName,
      password_hash: passwordHash,
      role:          'viewer',
      provider:      'local',
    }).execute();

    const token = fastify.jwt.sign({ sub: id, role: 'viewer', email: email.toLowerCase(), provider: 'local' });

    return reply
      .status(201)
      .setCookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', path: '/' })
      .send({ id, email: email.toLowerCase(), displayName, role: 'viewer' });
  });

  // ── GET /api/v1/auth/me ──────────────────────────────────────────────────────
  fastify.get('/api/v1/auth/me', { preHandler: fastify.authenticate }, async (req, reply) => {
    const user = await db
      .selectFrom('users')
      .select(['id', 'email', 'display_name', 'role', 'provider', 'created_at'])
      .where('id', '=', req.user.sub)
      .executeTakeFirst();

    if (!user) return reply.status(404).send({ error: 'User not found' });

    return reply.send({ id: user.id, email: user.email, displayName: user.display_name, role: user.role, provider: user.provider });
  });

  // ── GET /api/v1/auth/logout ──────────────────────────────────────────────────
  fastify.get('/api/v1/auth/logout', async (_req, reply) => {
    return reply.clearCookie('auth_token', { path: '/' }).send({ ok: true });
  });
}
