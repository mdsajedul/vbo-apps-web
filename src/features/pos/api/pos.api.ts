import { apiClient } from '@/shared/api/client';

export interface PosShift {
  id: string;
  branch_id: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  starting_cash: number;
  expected_cash?: number;
  actual_cash?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface CheckoutItem {
  product_id?: string;
  variant_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_amount?: number;
  total_price: number;
}

export interface CheckoutPayload {
  branch_id?: string;
  shift_id?: any;
  customer_id?: string;
  items: any[];
  payment_method?: any;
  amount_paid: number;
  change_due?: number;
  total_amount?: number;
  grand_total?: number;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  tax_total?: number;
  notes?: string;
  payments?: Array<{ method: string; amount: number; transaction_id?: string }>;
  [key: string]: any;
}

export interface CheckoutResponse {
  sale_id: string;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  items_count: number;
  receipt_html?: string;
}

export const posApi = {
  openShift: async (payload: { branch_id: string; starting_cash: number }): Promise<PosShift> => {
    const { data } = await apiClient.post('/pos/shift/open', payload);
    return data;
  },

  closeShift: async (
    shiftId: string,
    payload: { actual_cash: number; notes?: string },
  ): Promise<PosShift> => {
    const { data } = await apiClient.post(`/pos/shift/${shiftId}/close`, payload);
    return data;
  },

  getCurrentShift: async (branch_id?: string): Promise<PosShift | null> => {
    const { data } = await apiClient.get('/pos/shift/current', {
      params: branch_id ? { branch_id } : undefined,
    });
    return data;
  },

  getActiveGlobalShift: async (): Promise<PosShift | null> => {
    const { data } = await apiClient.get('/pos/shift/active-global');
    return data;
  },

  checkout: async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
    const { data } = await apiClient.post('/pos/checkout', payload);
    return data;
  },
};
