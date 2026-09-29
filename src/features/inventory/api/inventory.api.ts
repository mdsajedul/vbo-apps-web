import { apiClient } from '@/shared/api/client';

export interface InventoryItem {
  id: string;
  product_id: string;
  variant_id?: string;
  branch_id: string;
  quantity: number;
  reserved_quantity?: number;
  available_quantity?: number;
  reorder_point?: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
  };
}

export interface StockAdjustmentPayload {
  branch_id: string;
  product_id: string;
  variant_id?: string;
  adjustment_quantity: number; // positive or negative
  reason: 'DAMAGE' | 'THEFT' | 'CORRECTION' | 'EXPIRY' | 'INTERNAL_USE' | 'OTHER';
  notes?: string;
}

export const inventoryApi = {
  getAll: async (params?: {
    branch_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: InventoryItem[]; total?: number; meta?: any }> => {
    const { data } = await apiClient.get('/inventory', { params });
    return data;
  },

  adjust: async (payload: StockAdjustmentPayload): Promise<InventoryItem> => {
    const { data } = await apiClient.post('/inventory/adjust', payload);
    return data;
  },
};
