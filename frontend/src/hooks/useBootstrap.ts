import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';

export interface ProfilePayload {
  id?: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  contact_person?: string | null;
  cac_number?: string | null;
  logo_url?: string | null;
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  default_payment_terms?: string | null;
  full_name?: string | null;
  trade_type?: string | null;
  state_operation?: string | null;
}

export interface BootstrapPayload {
  profile: ProfilePayload | null;
  preferences: {
    wastageRules: Record<string, number>;
    documentFlow: string[];
    negativePreferences: string[];
    brandLoyalty: Record<string, string>;
  } | null;
  regional_prices: Array<{
    material_id: string;
    material_name: string;
    state: string;
    median_price_ngn: number;
    contributor_count: number;
    is_consensus: boolean;
    confidence: 'high' | 'medium' | 'low';
  }>;
  price_log: Array<{
    id: string;
    item_name: string;
    unit: string;
    price: number;
    type?: string;
    category?: string;
    supplier?: string;
  }>;
}

export const bootstrapKey = (userId: string | undefined) => ['bootstrap', userId] as const;

export function useBootstrap() {
  const { user } = useAuth();
  return useQuery({
    queryKey: bootstrapKey(user?.id),
    queryFn: async () => {
      const data = await api.get<BootstrapPayload>('/api/user/bootstrap');
      // Defensive: surface a clear error to React Query if the backend ever
      // returns 200 with an empty/malformed body (rather than silently
      // rendering an empty UI).
      if (!data || typeof data !== 'object') {
        throw new Error('bootstrap returned no payload');
      }
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: (failureCount, err: unknown) => {
      // Auth failures shouldn't retry — log out instead.
      if ((err as { status?: number } | undefined)?.status === 401) return false;
      return failureCount < 1;
    },
  });
}

/** Call after profile / brand edits to refresh the cached payload. */
export function useInvalidateBootstrap() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return async () => {
    await api.post('/api/user/bootstrap/invalidate').catch(() => undefined);
    qc.invalidateQueries({ queryKey: bootstrapKey(user?.id) });
  };
}
