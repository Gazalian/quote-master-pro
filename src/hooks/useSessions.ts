import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { ChatMessage, ChatSession, Quote } from '@/types/quote';

const sessionsKey = ['chat-sessions'] as const;
const sessionKey = (id: string) => ['chat-sessions', id] as const;

export interface SessionDetail {
  id: string;
  title: string;
  client: string | null;
  messages: ChatMessage[];
  active_quote: Quote | null;
  quote_history: Quote[];
  pending_questions: string[];
  created_at: string;
  updated_at: string;
}

export function useSessions() {
  return useQuery({
    queryKey: sessionsKey,
    queryFn: () => api.get<ChatSession[]>('/api/chat/sessions'),
    staleTime: 15_000,
  });
}

export function useSession(id: string | null) {
  return useQuery({
    queryKey: id ? sessionKey(id) : ['chat-sessions', 'noop'],
    queryFn: () => api.get<SessionDetail>(`/api/chat/sessions/${id}`),
    enabled: !!id,
    staleTime: 0,
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
      qc.invalidateQueries({ queryKey: sessionKey(input.id) });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/chat/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionsKey }),
  });
}
