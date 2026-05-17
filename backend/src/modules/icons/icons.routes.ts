import type { FastifyInstance } from 'fastify';
import { randomUUID }           from 'crypto';
import { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath }         from 'url';
import { pipeline }              from 'stream/promises';
import { getDb }                 from '../../db/connection.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, '../../../../uploads/icons');

// Ensure uploads directory exists
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set([
  'image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/webp',
]);

export default async function iconsRoutes(fastify: FastifyInstance) {
  const db = getDb();

  // ── GET /api/v1/icons ────────────────────────────────────────────────────────
  fastify.get('/api/v1/icons', { preHandler: fastify.authenticate }, async (_req, reply) => {
    const rows = await db
      .selectFrom('node_icons')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    const icons = rows.map(r => ({
      id:        r.id,
      name:      r.name,
      label:     r.name,
      category:  r.category,
      mimeType:  r.mime_type,
      createdAt: r.created_at,
    }));
    return reply.send({ data: icons });
  });

  // ── GET /api/v1/icons/file/:id ───────────────────────────────────────────────
  // Serve the actual icon file
  fastify.get('/api/v1/icons/file/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const icon = await db
      .selectFrom('node_icons')
      .select(['file_path', 'mime_type'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!icon?.file_path) return reply.status(404).send({ error: 'Icon not found' });

    const fullPath = join(UPLOAD_DIR, icon.file_path);
    if (!existsSync(fullPath)) return reply.status(404).send({ error: 'File not found' });

    return reply
      .header('Content-Type', icon.mime_type)
      .header('Cache-Control', 'public, max-age=86400')
      .send(createReadStream(fullPath));
  });

  // ── POST /api/v1/icons/upload ────────────────────────────────────────────────
  fastify.post('/api/v1/icons/upload',
    { preHandler: fastify.requireRole('admin', 'operator') },
    async (req, reply) => {
      const parts = req.parts();
      let iconName = '';
      let fileName = '';
      let mimeType = '';
      const id     = randomUUID();

      for await (const part of parts) {
        if (part.type === 'field' && part.fieldname === 'name') {
          iconName = String(part.value);
        } else if (part.type === 'file' && part.fieldname === 'file') {
          mimeType = part.mimetype;

          if (!ALLOWED_TYPES.has(mimeType)) {
            // Drain the stream to avoid hanging
            await part.toBuffer();
            return reply.status(400).send({ error: 'File type not allowed' });
          }

          const ext  = extname(part.filename || `.${mimeType.split('/')[1]}`);
          fileName   = `${id}${ext}`;
          const dest = join(UPLOAD_DIR, fileName);
          await pipeline(part.file, createWriteStream(dest));
        }
      }

      if (!fileName) return reply.status(400).send({ error: 'No file uploaded' });
      if (!iconName) iconName = fileName.replace(/\.[^.]+$/, '');

      await db.insertInto('node_icons').values({
        id,
        name:        iconName,
        category:    'custom',
        icon_key:    null,
        file_path:   fileName,
        mime_type:   mimeType,
        uploaded_by: req.user?.sub ?? null,
      }).execute();

      const icon = await db
        .selectFrom('node_icons')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirstOrThrow();

      return reply.status(201).send({
        id:        icon.id,
        name:      icon.name,
        label:     icon.name,
        category:  icon.category,
        mimeType:  icon.mime_type,
        createdAt: icon.created_at,
      });
    }
  );

  // ── DELETE /api/v1/icons/:id ─────────────────────────────────────────────────
  fastify.delete('/api/v1/icons/:id',
    { preHandler: fastify.requireRole('admin') },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const icon = await db
        .selectFrom('node_icons')
        .select(['file_path'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!icon) return reply.status(404).send({ error: 'Icon not found' });

      await db.deleteFrom('node_icons').where('id', '=', id).execute();

      // Remove physical file
      if (icon.file_path) {
        const filePath = join(UPLOAD_DIR, icon.file_path);
        try { if (existsSync(filePath)) unlinkSync(filePath); } catch { /* ignore */ }
      }

      return reply.status(204).send();
    }
  );
}
