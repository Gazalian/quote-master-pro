import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getUserBootstrap, invalidateUserBootstrap } from '../services/user.service.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/user/bootstrap', { preHandler: requireAuth }, async (req, reply) => {
    const u = req.user!;
    // Cache for 60s on the client — the in-process backend cache also has a
    // 60s TTL, so most refreshes don't even hit Supabase. `private` so any
    // proxy treats it as user-specific.
    reply.header('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
    return await getUserBootstrap(u.jwt, u.id);
  });

  app.post('/api/user/bootstrap/invalidate', { preHandler: requireAuth }, async (req) => {
    invalidateUserBootstrap(req.user!.id);
    return { invalidated: true };
  });
}
