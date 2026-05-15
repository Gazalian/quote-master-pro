import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import { env, corsOrigins } from './config/env.js';
import { loggerOptions } from './utils/logger.js';
import { registerErrorHandler } from './middleware/error.js';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/user.js';
import { quoteRoutes } from './routes/quotes.js';
import { sessionRoutes } from './routes/sessions.js';
import { invoiceRoutes } from './routes/invoices.js';
import { priceLogRoutes } from './routes/priceLog.js';
import { profileRoutes } from './routes/profile.js';
import { debugRoutes } from './routes/debug.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: { rateLimitQuoteGenPerMin: number };
  }
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerOptions,
    bodyLimit: 12 * 1024 * 1024, // 12 MB — accommodates up to 5 base64 images (with compression)
    trustProxy: true,
    disableRequestLogging: env.NODE_ENV === 'production' ? false : false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    genReqId: () => globalThis.crypto.randomUUID(),
  });

  // Decorate config so routes can read tunable values without re-importing env.
  app.decorate('config', { rateLimitQuoteGenPerMin: env.RATE_LIMIT_QUOTE_GEN_PER_MIN });

  await app.register(helmet, {
    contentSecurityPolicy: false, // SPA loads from a different origin; CSP belongs on the frontend host
  });

  await app.register(cors, {
    origin(origin, cb) {
      if (!origin) return cb(null, true); // same-origin / curl / mobile WebView
      if (corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(sensible);

  // Global rate limit — keyed by user id when authenticated, else by IP.
  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_DEFAULT_PER_MIN,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.user?.id ?? req.ip,
    errorResponseBuilder: (_req, ctx) => ({
      error: 'Too many requests',
      retryAfterSeconds: Math.ceil(ctx.ttl / 1000),
    }),
  });

  registerErrorHandler(app);

  await app.register(healthRoutes);
  await app.register(userRoutes);
  await app.register(quoteRoutes);
  await app.register(sessionRoutes);
  await app.register(invoiceRoutes);
  await app.register(priceLogRoutes);
  await app.register(profileRoutes);
  await app.register(debugRoutes);

  return app;
}

async function start(): Promise<void> {
  const app = await buildApp();
  try {
    await app.listen({ host: '0.0.0.0', port: env.PORT });
  } catch (err) {
    app.log.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }

  // ── Graceful shutdown ────────────────────────────────────────────────────
  // SIGTERM (cloud platforms) and SIGINT (Ctrl-C in dev) both flush in-flight
  // requests, close Fastify, then exit. Hard timeout prevents hung workers.
  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, 'Received signal — shutting down');
    const hardTimeout = setTimeout(() => {
      app.log.fatal('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();

    try {
      await app.close();
      clearTimeout(hardTimeout);
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'Error during shutdown');
      clearTimeout(hardTimeout);
      process.exit(1);
    }
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  process.on('uncaughtException', (err) => app.log.fatal({ err }, 'Uncaught exception'));
  process.on('unhandledRejection', (err) => app.log.fatal({ err }, 'Unhandled rejection'));
}

void start();
