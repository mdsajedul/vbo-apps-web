import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../api/sales.api';
import { queryKeys } from '@/shared/api/query-keys';

export function useSales(params?: { branch_id?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.sales.list(params),
    queryFn: () => salesApi.getAll(params),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: queryKeys.sales.detail(id),
    queryFn: () => salesApi.getOne(id),
    enabled: Boolean(id),
  });
}
