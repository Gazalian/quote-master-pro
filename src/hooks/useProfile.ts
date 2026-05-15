import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { bootstrapKey, type BootstrapPayload } from './useBootstrap';

export interface ProfilePatch {
  company_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  contact_person?: string;
  cac_number?: string;
  logo_url?: string | null;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  default_payment_terms?: string;
  full_name?: string;
  trade_type?: string;
  state_operation?: string;
}

/**
 * Optimistic profile update. The local React Query bootstrap snapshot is
 * patched immediately so the brand preview / profile card reflects the new
 * values without waiting for the round-trip. On failure we roll back.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = bootstrapKey(user?.id);

  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.patch<any>('/api/profile', patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BootstrapPayload>(key);
      if (prev?.profile) {
        qc.setQueryData<BootstrapPayload>(key, {
          ...prev,
          profile: { ...prev.profile, ...patch },
        });
      }
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    // Background refetch so we eventually reconcile with server truth.
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
