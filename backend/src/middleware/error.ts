import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof ZodError) {
      reply.code(400).send({
        error: 'Validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return;
    }

    if (err instanceof ApiError) {
      reply.code(err.statusCode).send({ error: err.message, code: err.code });
      return;
    }

    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    if (status >= 500) req.log.error({ err }, 'Unhandled error');
    else req.log.warn({ err: err.message }, 'Client error');

    reply.code(status).send({
      error: status >= 500 ? 'Internal server error' : err.message,
      ...(status >= 500 ? {} : { code: err.code }),
    });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ error: `Route not found: ${req.method} ${req.url}` });
  });
}
