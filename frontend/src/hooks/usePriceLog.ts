import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { bootstrapKey } from './useBootstrap';

export interface PriceLogRow {
  id: string;
  item_name: string;
  unit: string;
  price: number;
  type?: string;
  category?: string | null;
  supplier?: string | null;
  last_used_at: string;
}

const priceLogKey = ['price-log'] as const;

export function usePriceLog() {
  return useQuery({
    queryKey: priceLogKey,
    queryFn: () => api.get<PriceLogRow[]>('/api/price-log'),
    staleTime: 60_000,
  });
}

export interface PriceLogUpsertInput {
  name: string;
  unit: string;
  unitPrice: number;
  type?: 'MATERIALS' | 'LABOUR';
  category?: string | null;
  supplier?: string | null;
}

export function useUpsertPriceLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: PriceLogUpsertInput) => api.post<PriceLogRow>('/api/price-log', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: priceLogKey });
      qc.invalidateQueries({ queryKey: bootstrapKey(user?.id) });
    },
  });
}

export function useUpdatePriceLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, ...input }: PriceLogUpsertInput & { id: string }) =>
      api.patch<PriceLogRow>(`/api/price-log/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: priceLogKey });
      qc.invalidateQueries({ queryKey: bootstrapKey(user?.id) });
    },
  });
}

export function useDeletePriceLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/price-log/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: priceLogKey });
      qc.invalidateQueries({ queryKey: bootstrapKey(user?.id) });
    },
  });
}
