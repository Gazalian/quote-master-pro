import type { FastifyReply, FastifyRequest } from 'fastify';
import { supabaseService } from '../config/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  jwt: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Verifies a Supabase-issued JWT from the Authorization header and attaches
 * the user to the request. Rejects requests without a valid token.
 *
 * We use the service-role client only to call `auth.getUser(jwt)`, which is a
 * lightweight token introspection. The user-scoped client is created later if
 * the route needs to do RLS-bound queries.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
  }
  const jwt = authHeader.slice('Bearer '.length).trim();
  if (!jwt) return reply.code(401).send({ error: 'Empty bearer token' });

  const { data, error } = await supabaseService.auth.getUser(jwt);
  if (error || !data.user) {
    req.log.warn(
      { err: error?.message, route: req.url, jwtPrefix: jwt.slice(0, 12) + '…' },
      'JWT verification failed',
    );
    return reply.code(401).send({ error: 'Invalid token' });
  }

  req.user = { id: data.user.id, email: data.user.email ?? null, jwt };

  // Per-request log line: every authenticated request is tagged with userId
  // so you can grep production logs for "userId=<uuid>" and reconstruct what
  // they actually saw. This is what step 7 of the outage runbook asks for.
  req.log.info({ userId: req.user.id, route: req.url, method: req.method }, 'auth ok');
}
