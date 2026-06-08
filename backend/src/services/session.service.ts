/**
 * Chat session persistence — list / load / upsert.
 * Notes:
 *  - The frontend should debounce upserts; this service does not throttle.
 *  - We strip embedded image data URLs from `messages` before save to keep the
 *    row small. The frontend should also strip on its side.
 */

import { supabaseForUser } from '../config/supabase.js';
import { ApiError } from '../middleware/error.js';

export interface ChatSessionUpsertInput {
  id: string;
  title?: string;
  client?: string;
  last_message?: string;
  messages: unknown[];
  active_quote?: unknown | null;
  quote_history?: unknown[];
  pending_questions?: string[];
}

const MAX_MESSAGES_PER_SESSION = 500; // hard cap to avoid runaway JSONB writes

type ChatMessageLike = {
  type?: unknown;
  imageUrl?: unknown;
  [key: string]: unknown;
};

export async function listSessions(jwt: string, limit = 30) {
  const userClient = supabaseForUser(jwt);
  const { data, error } = await userClient
    .from('chat_sessions')
    .select('id, title, client, last_message, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new ApiError(500, `list sessions failed: ${error.message}`);
  return data ?? [];
}

export async function loadSession(jwt: string, id: string) {
  const userClient = supabaseForUser(jwt);
  const { data, error } = await userClient
    .from('chat_sessions')
    .select('id, title, client, messages, active_quote, quote_history, pending_questions, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new ApiError(500, `load session failed: ${error.message}`);
  if (!data) throw new ApiError(404, 'Session not found');
  return data;
}

/**
 * Lightweight metadata-only load. Skips the messages array so the chat
 * surface can render immediately (title + client + active_quote summary)
 * while messages stream in via loadSessionMessages.
 */
export async function loadSessionMeta(jwt: string, id: string) {
  const userClient = supabaseForUser(jwt);
  const { data, error } = await userClient
    .from('chat_sessions')
    .select('id, title, client, active_quote, quote_history, pending_questions, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new ApiError(500, `load session meta failed: ${error.message}`);
  if (!data) throw new ApiError(404, 'Session not found');
  return data;
}

/**
 * Paginated message slice. Returns the LAST `limit` messages (chat surfaces
 * read newest-first) using JSONB slice. Adding offset (from the tail) lets
 * the client fetch earlier batches on scroll-up.
 */
export async function loadSessionMessages(
  jwt: string,
  id: string,
  opts: { limit: number; before: number | null },
) {
  const userClient = supabaseForUser(jwt);
  // Single round-trip: pull `messages` + total length so the client can stop
  // paginating when it knows it has hit the start.
  const { data, error } = await userClient
    .from('chat_sessions')
    .select('messages')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new ApiError(500, `load messages failed: ${error.message}`);
  if (!data) throw new ApiError(404, 'Session not found');

  const all = (data.messages as unknown[]) ?? [];
  const total = all.length;
  // `before` is an INDEX (from the start of the array). Default = total.
  const endExclusive = opts.before == null ? total : Math.max(0, Math.min(opts.before, total));
  const startInclusive = Math.max(0, endExclusive - opts.limit);
  return {
    messages: all.slice(startInclusive, endExclusive),
    range: { start: startInclusive, end: endExclusive },
    total,
    hasMore: startInclusive > 0,
  };
}

export async function upsertSession(jwt: string, userId: string, input: ChatSessionUpsertInput) {
  const userClient = supabaseForUser(jwt);

  // Persist messages verbatim. Images are now Supabase Storage URLs (uploaded
  // via /api/uploads/chat-image) rather than base64 data URIs, so the row
  // stays small AND images survive refresh. We still cap message count to
  // avoid runaway JSONB writes, and reject leftover data: URLs so older
  // clients don't reintroduce the multi-MB blob problem.
  const messages = (input.messages ?? [])
    .slice(-MAX_MESSAGES_PER_SESSION)
    .map((m: unknown) => {
      const message = m as ChatMessageLike | null;
      if (message && message.type === 'image' && typeof message.imageUrl === 'string' && message.imageUrl.startsWith('data:')) {
        // Drop the inline data — the client should have uploaded it instead.
        return { ...message, imageUrl: '' };
      }
      return m;
    });

  const payload = {
    id: input.id,
    user_id: userId,
    title: input.title ?? 'New Session',
    client: input.client ?? null,
    last_message: input.last_message ?? null,
    messages,
    active_quote: input.active_quote ?? null,
    quote_history: input.quote_history ?? [],
    pending_questions: input.pending_questions ?? [],
  };

  const { error } = await userClient.from('chat_sessions').upsert(payload, { onConflict: 'id' });
  if (error) throw new ApiError(500, `upsert session failed: ${error.message}`);
}

export async function deleteSession(jwt: string, id: string) {
  const userClient = supabaseForUser(jwt);
  const { error } = await userClient.from('chat_sessions').delete().eq('id', id);
  if (error) throw new ApiError(500, `delete session failed: ${error.message}`);
}
