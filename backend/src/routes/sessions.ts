import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import {
  listSessions,
  loadSession,
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
  app.get('/api/chat/sessions', { preHandler: requireAuth }, async (req) => {
    const q = z.object({ limit: z.coerce.number().int().positive().max(100).default(30) }).parse(req.query);
    return await listSessions(req.user!.jwt, q.limit);
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
