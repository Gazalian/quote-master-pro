import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness — process is alive
  app.get('/health/live', async () => ({ status: 'ok', uptime_s: Math.round(process.uptime()) }));

  // Readiness — placeholder for downstream checks (Supabase, Gemini). Kept
  // synchronous and cheap on purpose so Kubernetes/Vercel readiness probes
  // don't hammer the AI provider. Real downstream probes belong on a separate
  // path like /health/deep.
  app.get('/health/ready', async () => ({ status: 'ready' }));
}
