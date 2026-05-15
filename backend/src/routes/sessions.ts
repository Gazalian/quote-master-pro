import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import {
  listSessions,
  loadSession,
  loadSessionMeta,
  loadSessionMessages,
  upsertSession,
  deleteSession,
} from '../services/session.service.js';

const upsertBody = z.object({
  id: z.string().uuid(),
  title: z.string().max(120).optional(),
  client: z.string().max(120).optional(),
  last_message: z.string().max(500).optional(),
  messages: z.array(z.any()).max(500),
  active_quote: z.any().nullable().optional(),
  quote_history: z.array(z.any()).optional(),
  pending_questions: z.array(z.string()).max(5).optional(),
});

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/chat/sessions', { preHandler: requireAuth }, async (req, reply) => {
    const q = z.object({ limit: z.coerce.number().int().positive().max(100).default(30) }).parse(req.query);
    // List doesn't change often per visit — cache aggressively, invalidate on
    // upsert. The frontend can pull the cached list and skeleton instantly.
    reply.header('Cache-Control', 'private, max-age=30, stale-while-revalidate=300');
    return await listSessions(req.user!.jwt, q.limit);
  });

  // Lightweight metadata-only — used for the first paint when opening a session
  app.get('/api/chat/sessions/:id/meta', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    return await loadSessionMeta(req.user!.jwt, id);
  });

  // Paginated messages slice — `before` is an index from the start of the array
  // (i.e. exclusive upper bound). Default = end of array → returns newest page.
  app.get('/api/chat/sessions/:id/messages', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const q = z
      .object({
        limit: z.coerce.number().int().positive().max(200).default(50),
        before: z.coerce.number().int().nonnegative().optional(),
      })
      .parse(req.query);
    return await loadSessionMessages(req.user!.jwt, id, {
      limit: q.limit,
      before: q.before ?? null,
    });
  });

  app.get('/api/chat/sessions/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    return await loadSession(req.user!.jwt, id);
  });

  app.put('/api/chat/sessions/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = upsertBody.parse({ ...(req.body as object), id });
    await upsertSession(req.user!.jwt, req.user!.id, body);
    return { ok: true };
  });

  app.delete('/api/chat/sessions/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await deleteSession(req.user!.jwt, id);
    return { ok: true };
  });
}
