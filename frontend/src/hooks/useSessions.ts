import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { ChatMessage, ChatSession, Quote } from '@/types/quote';

const sessionsKey = ['chat-sessions'] as const;
const sessionMetaKey = (id: string) => ['chat-sessions', id, 'meta'] as const;
const sessionMessagesKey = (id: string) => ['chat-sessions', id, 'messages'] as const;

export interface SessionMeta {
  id: string;
  title: string;
  client: string | null;
  active_quote: Quote | null;
  quote_history: Quote[];
  pending_questions: string[];
  created_at: string;
  updated_at: string;
}

export interface MessagesPage {
  messages: ChatMessage[];
  range: { start: number; end: number };
  total: number;
  hasMore: boolean;
}

export function useSessions() {
  return useQuery({
    queryKey: sessionsKey,
    queryFn: () => api.get<ChatSession[]>('/api/chat/sessions'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/** Lightweight metadata-only load — paints the chat header / quote pane fast. */
export function useSessionMeta(id: string | null) {
  return useQuery({
    queryKey: id ? sessionMetaKey(id) : ['chat-sessions', 'noop'],
    queryFn: () => api.get<SessionMeta>(`/api/chat/sessions/${id}/meta`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Paginated messages. The chat surface shows the newest page first; scrolling
 * to the top fetches the previous page via fetchPreviousPage().
 */
export function useSessionMessages(id: string | null, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: id ? sessionMessagesKey(id) : ['chat-sessions', 'noop-msgs'],
    enabled: !!id,
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) =>
      api.get<MessagesPage>(`/api/chat/sessions/${id}/messages`, {
        query: { limit: pageSize, before: pageParam ?? undefined },
      }),
    // When the current page starts at `range.start`, the next earlier page's
    // upper bound is that same `range.start`. Returning null stops the loader.
    getNextPageParam: (last) => (last.hasMore ? last.range.start : undefined),
    // For our use case "next page" means earlier messages — keep it semantic.
    staleTime: 15_000,
  });
}

export interface UpsertSessionInput {
  id: string;
  title?: string;
  client?: string;
  last_message?: string;
  messages: ChatMessage[];
  active_quote?: Quote | null;
  quote_history?: Quote[];
  pending_questions?: string[];
}

export function useUpsertSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertSessionInput) =>
      api.put<void>(`/api/chat/sessions/${input.id}`, input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: sessionsKey });
      qc.invalidateQueries({ queryKey: sessionMetaKey(input.id) });
      qc.invalidateQueries({ queryKey: sessionMessagesKey(input.id) });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/chat/sessions/${id}`),
    // Optimistic removal so the list refreshes instantly.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: sessionsKey });
      const prev = qc.getQueryData<ChatSession[]>(sessionsKey);
      qc.setQueryData<ChatSession[]>(sessionsKey, (old) => (old ?? []).filter((s) => s.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(sessionsKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: sessionsKey }),
  });
}
