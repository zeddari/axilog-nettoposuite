import type { FastifyInstance } from 'fastify';
import { Issuer, generators, type Client } from 'openid-client';
import { randomUUID } from 'crypto';
import { getDb } from '../../db/connection.js';
import type { Role } from '../../shared/types.js';

let oidcClient: Client | null = null;

async function getOidcClient(): Promise<Client> {
  if (oidcClient) return oidcClient;

  const issuerUrl = process.env.KEYCLOAK_ISSUER_URL;
  if (!issuerUrl) throw new Error('KEYCLOAK_ISSUER_URL is not set');

  const issuer = await Issuer.discover(issuerUrl);
  oidcClient = new issuer.Client({
    client_id:      process.env.KEYCLOAK_CLIENT_ID ?? 'axilog-backend',
    client_secret:  process.env.KEYCLOAK_CLIENT_SECRET,
    redirect_uris:  [`${process.env.APP_URL}/api/v1/auth/keycloak/callback`],
    response_types: ['code'],
  });
  return oidcClient;
}

function mapKeycloakRoles(kcRoles: string[]): Role {
  if (kcRoles.includes('admin'))           return 'admin';
  if (kcRoles.includes('operator'))        return 'operator';
  if (kcRoles.includes('service_manager')) return 'service_manager';
  return 'viewer';
}

export default async function keycloakRoutes(fastify: FastifyInstance) {
  if (process.env.KEYCLOAK_ENABLED !== 'true') {
    fastify.log.info('Keycloak SSO disabled — skipping Keycloak routes');
    return;
  }

  const db = getDb();

  // ── GET /api/v1/auth/login?provider=keycloak ─────────────────────────────────
  fastify.get('/api/v1/auth/login', async (req, reply) => {
    const query = req.query as Record<string, string>;
    if (query.provider !== 'keycloak') return; // handled by local routes

    const client = await getOidcClient();

    const state        = generators.state();
    const nonce        = generators.nonce();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Store PKCE state in a short-lived signed cookie
    reply.setCookie('oidc_state',    state,        { httpOnly: true, maxAge: 600, path: '/' });
    reply.setCookie('oidc_nonce',    nonce,        { httpOnly: true, maxAge: 600, path: '/' });
    reply.setCookie('oidc_verifier', codeVerifier, { httpOnly: true, maxAge: 600, path: '/' });

    const authUrl = client.authorizationUrl({
      scope:                  'openid email profile roles',
      state,
      nonce,
      code_challenge:         codeChallenge,
      code_challenge_method:  'S256',
    });

    return reply.redirect(authUrl);
  });

  // ── GET /api/v1/auth/keycloak/callback ───────────────────────────────────────
  fastify.get('/api/v1/auth/keycloak/callback', async (req, reply) => {
    const cookies = req.cookies as Record<string, string>;
    const state        = cookies['oidc_state'];
    const nonce        = cookies['oidc_nonce'];
    const codeVerifier = cookies['oidc_verifier'];

    if (!state || !nonce || !codeVerifier) {
      return reply.status(400).send({ error: 'Missing OIDC session state' });
    }

    const client = await getOidcClient();
    const params = client.callbackParams(req.raw);

    const tokenSet = await client.callback(
      `${process.env.APP_URL}/api/v1/auth/keycloak/callback`,
      params,
      { state, nonce, code_verifier: codeVerifier }
    );

    const claims = tokenSet.claims();
    const kcRoles: string[] = (claims as Record<string, unknown> & { realm_access?: { roles?: string[] } })?.realm_access?.roles ?? [];
    const axilogRole = mapKeycloakRoles(kcRoles);

    // Upsert user — first SSO login creates account automatically
    const externalId = claims.sub;
    let user = await db
      .selectFrom('users')
      .selectAll()
      .where('external_id', '=', externalId)
      .where('provider', '=', 'keycloak')
      .executeTakeFirst();

    if (!user) {
      const id = randomUUID();
      await db.insertInto('users').values({
        id,
        email:        (claims.email ?? externalId).toLowerCase(),
        display_name: claims.name ?? claims.preferred_username ?? 'SSO User',
        password_hash: null,
        role:          axilogRole,
        provider:      'keycloak',
        external_id:   externalId,
      }).execute();
      user = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
    } else {
      // Sync role on every login
      await db.updateTable('users').set({ role: axilogRole }).where('id', '=', user.id).execute();
    }

    const token = fastify.jwt.sign({ sub: user.id, role: axilogRole, email: user.email, provider: 'keycloak' });

    return reply
      .clearCookie('oidc_state', { path: '/' })
      .clearCookie('oidc_nonce', { path: '/' })
      .clearCookie('oidc_verifier', { path: '/' })
      .setCookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', path: '/' })
      .redirect('/');
  });

  // ── GET /api/v1/auth/keycloak/logout ─────────────────────────────────────────
  fastify.get('/api/v1/auth/keycloak/logout', async (_req, reply) => {
    const client = await getOidcClient();
    const endUrl = client.endSessionUrl({ post_logout_redirect_uri: process.env.APP_URL });
    return reply.clearCookie('auth_token', { path: '/' }).redirect(endUrl);
  });
}
