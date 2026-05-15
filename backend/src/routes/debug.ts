/**
 * Diagnostic endpoints for the outage runbook.
 *
 * These are intentionally minimal and side-effect-free. They don't expose any
 * data that the caller couldn't get elsewhere via their own JWT; they only
 * exist so the operator can verify the auth chain end-to-end:
 *
 *   1. Frontend  attaches the JWT correctly  → 200 from /api/debug/whoami
 *   2. Backend   verifies the JWT            → response carries userId / email
 *   3. Supabase  evaluates auth.uid()        → counts > 0 on /api/debug/counts
 */

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { supabaseForUser } from '../config/supabase.js';

export async function debugRoutes(app: FastifyInstance): Promise<void> {
  // ── Who am I according to the verified JWT? ──────────────────────────────
  app.get('/api/debug/whoami', { preHandler: requireAuth }, async (req) => {
    const u = req.user!;
    return {
      userId: u.id,
      email: u.email,
      jwtLength: u.jwt.length,
      now: new Date().toISOString(),
    };
  });

  // ── What does Supabase see when it evaluates auth.uid() for this JWT? ────
  // Useful for confirming the JWT survives the trip to PostgREST.
  app.get('/api/debug/counts', { preHandler: requireAuth }, async (req) => {
    const u = req.user!;
    const client = supabaseForUser(u.jwt);

    const [profile, sessions, quotes, prices, prefs] = await Promise.all([
      client.from('profiles').select('id, full_name, trade_type', { count: 'exact', head: true }).eq('id', u.id),
      client.from('chat_sessions').select('id', { count: 'exact', head: true }),
      client.from('quotations').select('id', { count: 'exact', head: true }),
      client.from('price_log').select('id', { count: 'exact', head: true }),
      client.from('user_preferences').select('id', { count: 'exact', head: true }),
    ]);

    return {
      userId: u.id,
      visibleToRls: {
        profile: profile.count ?? 0,
        chat_sessions: sessions.count ?? 0,
        quotations: quotes.count ?? 0,
        price_log: prices.count ?? 0,
        user_preferences: prefs.count ?? 0,
      },
      errors: {
        profile: profile.error?.message ?? null,
        chat_sessions: sessions.error?.message ?? null,
        quotations: quotes.error?.message ?? null,
        price_log: prices.error?.message ?? null,
        user_preferences: prefs.error?.message ?? null,
      },
    };
  });
}
