import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, StockAdjustmentPayload } from '../api/inventory.api';
import { queryKeys } from '@/shared/api/query-keys';
import { toast } from 'sonner';

export function useInventory(params?: { branch_id?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.inventory.list(params),
    queryFn: () => inventoryApi.getAll(params),
  });
}

export function useStockAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) => inventoryApi.adjust(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success('Stock adjusted successfully');
    },
  });
}
