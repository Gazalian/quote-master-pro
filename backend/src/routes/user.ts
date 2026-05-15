import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getUserBootstrap, invalidateUserBootstrap } from '../services/user.service.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/user/bootstrap', { preHandler: requireAuth }, async (req) => {
    const u = req.user!;
    return await getUserBootstrap(u.jwt, u.id);
  });

  // Manual invalidation hook (e.g. after profile edit)
  app.post('/api/user/bootstrap/invalidate', { preHandler: requireAuth }, async (req) => {
    invalidateUserBootstrap(req.user!.id);
    return { invalidated: true };
  });
}
