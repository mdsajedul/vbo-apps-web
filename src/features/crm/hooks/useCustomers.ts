import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, Customer } from '../api/customers.api';
import { queryKeys } from '@/shared/api/query-keys';
import { toast } from 'sonner';

export function useCustomers(params?: { q?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customersApi.getAll(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customersApi.getOne(id),
    enabled: Boolean(id),
  });
}

export function useCustomerPoints(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customers.points(customerId),
    queryFn: () => customersApi.getPoints(customerId),
    enabled: Boolean(customerId),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Customer>) => customersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success('Customer registered successfully');
    },
  });
}
