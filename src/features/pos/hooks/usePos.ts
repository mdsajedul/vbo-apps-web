import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi, CheckoutPayload, CheckoutResponse } from '../api/pos.api';
import { queryKeys } from '@/shared/api/query-keys';
import { toast } from 'sonner';

export function useCurrentShift(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.pos.currentShift(branchId),
    queryFn: () => posApi.getCurrentShift(branchId),
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { branch_id: string; starting_cash: number }) =>
      posApi.openShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
      toast.success('POS register shift opened');
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shiftId,
      payload,
    }: {
      shiftId: string;
      payload: { actual_cash: number; notes?: string };
    }) => posApi.closeShift(shiftId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
      toast.success('POS register shift closed');
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckoutPayload): Promise<CheckoutResponse> =>
      posApi.checkout(payload),
    onSuccess: (data) => {
      // Invalidate all related domains to ensure data consistency across the ERP
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      toast.success(`Sale completed! Invoice #${data.invoice_number}`);
    },
  });
}
