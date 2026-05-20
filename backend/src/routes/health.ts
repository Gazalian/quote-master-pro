import type { FastifyInstance } from 'fastify';
import { aiHealthCheck } from '../services/ai/index.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness — process is alive
  app.get('/health/live', async () => ({ status: 'ok', uptime_s: Math.round(process.uptime()) }));

  // Readiness — intentionally cheap and synchronous. Kept
  // synchronous and cheap on purpose so Kubernetes/Vercel readiness probes
  // don't hammer the AI provider. Real downstream probes belong on a separate
  // path like /health/deep.
  app.get('/health/ready', async () => ({ status: 'ready' }));

  app.get('/health/deep', async (req, reply) => {
    const ai = await aiHealthCheck();
    const hasHealthyProvider = ai.some((p) => p.healthy);
    const hasHealthyPrimary = ai[0]?.healthy === true;
    reply.code(hasHealthyProvider ? 200 : 503);
    return {
      status: hasHealthyPrimary ? 'ready' : hasHealthyProvider ? 'degraded' : 'unavailable',
      ai,
    };
  });
}
