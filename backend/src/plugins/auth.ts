import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { JwtPayload, Role } from '../shared/types.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: Role[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: JwtPayload;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const privateKey = readFileSync(resolve(process.env.JWT_PRIVATE_KEY_PATH ?? './certs/jwt.key'));
  const publicKey  = readFileSync(resolve(process.env.JWT_PUBLIC_KEY_PATH  ?? './certs/jwt.key.pub'));

  await fastify.register(cookie, { secret: process.env.COOKIE_SECRET ?? 'axilog-cookie-secret' });

  await fastify.register(jwt, {
    secret: { private: privateKey, public: publicKey },
    sign:   { algorithm: 'RS256', expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' },
    cookie: { cookieName: 'auth_token', signed: false },
  });

  fastify.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or missing token' });
    }
  });

  fastify.decorate('requireRole', (...roles: Role[]) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      await fastify.authenticate(req, reply);
      if (!roles.includes(req.user.role)) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: `Role '${req.user.role}' is not authorized for this action`,
        });
      }
    };
  });
});
