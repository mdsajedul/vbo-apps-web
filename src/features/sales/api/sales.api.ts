import { apiClient } from '@/shared/api/client';

export interface SaleOrder {
  id: string;
  invoice_number: string;
  branch_id: string;
  customer_id?: string;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  payment_method: string;
  created_at: string;
  items: Array<{
    id: string;
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export const salesApi = {
  getAll: async (params?: {
    branch_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SaleOrder[]; total?: number; meta?: any }> => {
    const { data } = await apiClient.get('/sales', { params });
    return data;
  },

  getOne: async (id: string): Promise<SaleOrder & { data?: SaleOrder; [key: string]: any }> => {
    const { data } = await apiClient.get(`/sales/${id}`);
    return data;
  },

  getReturns: async () => {
    const { data } = await apiClient.get('/sales/returns');
    return data;
  },

  createReturn: async (payload: any) => {
    const { data } = await apiClient.post('/sales/returns', payload);
    return data;
  },
};
