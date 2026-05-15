import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { generateQuote } from '../services/gemini.service.js';
import {
  saveQuoteWithPoints,
  listQuotations,
  getQuotation,
  updateQuotation,
  deleteQuotation,
} from '../services/quote.service.js';
import { getUserBootstrap } from '../services/user.service.js';

const generateBody = z.object({
  userMessage: z.string().min(1).max(4000),
  sessionId: z.string().uuid().nullable().optional(),
  conversationHistory: z
    .array(z.object({ role: z.enum(['user', 'ai']), content: z.string() }))
    .max(50)
    .optional(),
  pendingQuestions: z.array(z.string()).max(5).optional(),
  images: z
    .array(z.object({ mimeType: z.string(), data: z.string() }))
    .max(5)
    .optional(),
});

const saveBody = z.object({
  sessionId: z.string().uuid().nullable(),
  draft: z.object({
    ref: z.string(),
    client: z.string(),
    description: z.string(),
    groups: z.array(z.any()),
    grandTotal: z.number().nonnegative(),
    templateStyle: z.enum(['classic', 'modern', 'minimal']).optional(),
  }),
  templateStyle: z.enum(['classic', 'modern', 'minimal']).optional(),
});

const updateBody = z
  .object({
    client_name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['APPROVED', 'INVOICED', 'ARCHIVED']).optional(),
    template_style: z.enum(['classic', 'modern', 'minimal']).optional(),
    grand_total: z.number().nonnegative().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export async function quoteRoutes(app: FastifyInstance): Promise<void> {
  // ── Generate ───────────────────────────────────────────────────────────────
  // Throttled separately because Gemini quota is the real bottleneck.
  app.post(
    '/api/quotes/generate',
    {
      preHandler: requireAuth,
      config: { rateLimit: { max: app.config.rateLimitQuoteGenPerMin, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = generateBody.parse(req.body);
      const user = req.user!;

      // Always re-bootstrap inside the same request — the cached bootstrap is
      // fresh enough (60s TTL) and gives us trade + state + price log in one
      // call instead of three round-trips.
      const boot = await getUserBootstrap(user.jwt, user.id);
      const profile = (boot.profile ?? {}) as Record<string, any>;

      const result = await generateQuote({
        userMessage: body.userMessage,
        conversationHistory: body.conversationHistory,
        pendingQuestions: body.pendingQuestions,
        images: body.images,
        userTrade: profile.trade_type ?? 'general',
        userLocation: profile.state_operation ?? 'Nigeria',
        priceLogEntries: boot.price_log,
        regionalPrices: boot.regional_prices,
        userPreferences: boot.preferences,
      });

      reply.code(200);
      return { draft: result.draft };
    },
  );

  // ── Save (atomic + point deduction) ────────────────────────────────────────
  app.post('/api/quotes/save', { preHandler: requireAuth }, async (req) => {
    const body = saveBody.parse(req.body);
    const u = req.user!;
    return await saveQuoteWithPoints(u.jwt, u.id, {
      draft: body.draft as any,
      sessionId: body.sessionId,
      templateStyle: body.templateStyle ?? body.draft.templateStyle,
    });
  });

  // ── List (no heavy JSONB) ──────────────────────────────────────────────────
  app.get('/api/quotes', { preHandler: requireAuth }, async (req, reply) => {
    const q = z
      .object({
        limit: z.coerce.number().int().positive().max(100).default(50),
        offset: z.coerce.number().int().nonnegative().default(0),
        status: z.enum(['APPROVED', 'INVOICED', 'ARCHIVED']).optional(),
      })
      .parse(req.query);
    reply.header('Cache-Control', 'private, max-age=20, stale-while-revalidate=120');
    return await listQuotations(req.user!.jwt, q);
  });

  // ── Detail ─────────────────────────────────────────────────────────────────
  app.get('/api/quotes/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    return await getQuotation(req.user!.jwt, id);
  });

  // ── Patch ──────────────────────────────────────────────────────────────────
  app.patch('/api/quotes/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const patch = updateBody.parse(req.body);
    await updateQuotation(req.user!.jwt, id, patch);
    return { ok: true };
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  app.delete('/api/quotes/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await deleteQuotation(req.user!.jwt, id);
    return { ok: true };
  });
}
