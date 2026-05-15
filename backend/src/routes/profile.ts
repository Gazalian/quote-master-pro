import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { updateProfile } from '../services/profile.service.js';

const patchBody = z
  .object({
    company_name: z.string().max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(40).optional(),
    whatsapp: z.string().max(40).optional(),
    address: z.string().max(500).optional(),
    contact_person: z.string().max(200).optional(),
    cac_number: z.string().max(40).optional(),
    logo_url: z.string().nullable().optional(),
    brand_primary_color: z.string().max(60).optional(),
    brand_secondary_color: z.string().max(60).optional(),
    bank_name: z.string().max(120).optional(),
    account_name: z.string().max(200).optional(),
    account_number: z.string().max(20).optional(),
    default_payment_terms: z.string().max(1000).optional(),
    full_name: z.string().max(200).optional(),
    trade_type: z.string().max(80).optional(),
    state_operation: z.string().max(80).optional(),
  })
  .strict();

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  app.patch('/api/profile', { preHandler: requireAuth }, async (req) => {
    const patch = patchBody.parse(req.body);
    return updateProfile(req.user!.jwt, req.user!.id, patch);
  });
}
