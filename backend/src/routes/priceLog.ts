import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import {
  listEntries,
  upsertEntry,
  updateEntry,
  deleteEntry,
} from '../services/priceLog.service.js';

const upsertBody = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(50),
  unitPrice: z.number().positive(),
  type: z.enum(['MATERIALS', 'LABOUR']).optional(),
  category: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
});

export async function priceLogRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/price-log', { preHandler: requireAuth }, async (req) =>
    listEntries(req.user!.jwt),
  );

  app.post('/api/price-log', { preHandler: requireAuth }, async (req) => {
    const body = upsertBody.parse(req.body);
    return upsertEntry(req.user!.jwt, req.user!.id, body);
  });

  app.patch('/api/price-log/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = upsertBody.parse(req.body);
    return updateEntry(req.user!.jwt, req.user!.id, id, body);
  });

  app.delete('/api/price-log/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await deleteEntry(req.user!.jwt, req.user!.id, id);
    return { ok: true };
  });
}
