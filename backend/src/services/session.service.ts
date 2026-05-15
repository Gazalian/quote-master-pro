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

export async function upsertSession(jwt: string, userId: string, input: ChatSessionUpsertInput) {
  const userClient = supabaseForUser(jwt);

  // Defensive: strip image data URLs from messages before saving (large + redundant)
  const messages = (input.messages ?? []).slice(-MAX_MESSAGES_PER_SESSION).map((m: any) =>
    m && m.type === 'image' ? { ...m, imageUrl: '' } : m,
  );

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
