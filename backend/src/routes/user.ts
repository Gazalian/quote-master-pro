import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getUserBootstrap, invalidateUserBootstrap } from '../services/user.service.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/user/bootstrap', { preHandler: requireAuth }, async (req, reply) => {
    const u = req.user!;
    // Explicitly disable HTTP caching. React Query handles freshness on the
    // client; HTTP caching here would (and did, in production) poison the
    // browser with a stale empty response if a single request landed during
    // a transient failure. The in-process backend cache (user.service.ts)
    // still rate-limits hits to Supabase.
    reply.header('Cache-Control', 'no-store');
    return await getUserBootstrap(u.jwt, u.id);
  });

  app.post('/api/user/bootstrap/invalidate', { preHandler: requireAuth }, async (req) => {
    invalidateUserBootstrap(req.user!.id);
    return { invalidated: true };
  });
}
