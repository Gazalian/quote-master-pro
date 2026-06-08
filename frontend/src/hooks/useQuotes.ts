import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { Quote, QuoteStatus } from '@/types/quote';
import { useAuth } from '@/lib/AuthContext';
import { bootstrapKey } from './useBootstrap';

export interface QuoteListRow {
  id: string;
  ref: string;
  client_name: string;
  description: string;
  status: QuoteStatus;
  template_style: string;
  grand_total: number;
  version: number;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteDetailRow extends QuoteListRow {
  user_id?: string;
  data?: {
    groups?: Quote['groups'];
  };
}

const quotesKey = (status?: string | null) => ['quotes', { status: status ?? 'all' }] as const;
const quoteKey = (id: string) => ['quotes', id] as const;

export function useQuotesList(status?: QuoteStatus | 'ALL') {
  const filter = !status || status === 'ALL' ? null : status;
  return useQuery({
    queryKey: quotesKey(filter),
    queryFn: () => api.get<QuoteListRow[]>('/api/quotes', { query: { status: filter ?? undefined } }),
    staleTime: 30_000,
  });
}

export function useQuote(id: string | null) {
  return useQuery({
    queryKey: id ? quoteKey(id) : ['quotes', 'noop'],
    queryFn: () => api.get<QuoteDetailRow>(`/api/quotes/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export interface GenerateQuoteInput {
  userMessage: string;
  sessionId?: string | null;
  conversationHistory?: { role: 'user' | 'ai'; content: string }[];
  currentQuote?: Quote | null;
  pendingQuestions?: string[];
  images?: { mimeType: string; data: string }[];
  signal?: AbortSignal;
}

export interface GeneratedQuoteDraft {
  ref: string;
  client: string;
  description: string;
  groups: Quote['groups'];
  grandTotal: number;
  templateStyle?: Quote['templateStyle'];
  reasoning?: string;
  clarifyingQuestions?: string[];
}

export function useGenerateQuote() {
  return useMutation({
    mutationFn: ({ signal, ...input }: GenerateQuoteInput) =>
      api.post<{ draft: GeneratedQuoteDraft }>('/api/quotes/generate', input, { signal }),
  });
}

export interface SaveQuoteInput {
  sessionId: string | null;
  draft: Partial<Quote>;
  templateStyle?: 'classic' | 'modern' | 'minimal';
}

export function useSaveQuote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: SaveQuoteInput) => api.post<QuoteDetailRow>('/api/quotes/save', input),
    onSuccess: () => {
      // Saved quote means: list changed and the user's point balance changed.
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: bootstrapKey(user?.id) });
    },
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch<void>(`/api/quotes/${id}`, patch),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: quoteKey(id) });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/quotes/${id}`),
    // Optimistic: remove from every cached list slice immediately.
    onMutate: async (id) => {
      const snapshots: Array<[unknown, QuoteListRow[] | undefined]> = [];
      qc.getQueriesData<QuoteListRow[]>({ queryKey: ['quotes'] }).forEach(([key, data]) => {
        snapshots.push([key, data]);
        if (data) qc.setQueryData(key, data.filter((q) => q.id !== id));
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key as readonly unknown[], data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
}
