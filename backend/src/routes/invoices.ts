import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { createInvoice, listInvoices } from '../services/invoice.service.js';

const createBody = z.object({
  quotationId: z.string().uuid(),
  invoiceNumber: z.string().max(64).optional(),
  paymentDetails: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/invoices', { preHandler: requireAuth }, async (req) => {
    const body = createBody.parse(req.body);
    return await createInvoice(req.user!.jwt, req.user!.id, body);
  });

  app.get('/api/invoices', { preHandler: requireAuth }, async (req) => {
    const q = z
      .object({
        limit: z.coerce.number().int().positive().max(100).default(50),
        offset: z.coerce.number().int().nonnegative().default(0),
      })
      .parse(req.query);
    return await listInvoices(req.user!.jwt, q.limit, q.offset);
  });
}
