import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { bootstrapKey } from './useBootstrap';

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

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.patch<any>('/api/profile', patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bootstrapKey(user?.id) });
    },
  });
}
