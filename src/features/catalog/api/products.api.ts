import { apiClient } from '@/shared/api/client';

export interface ProductFilters {
  category_id?: string;
  brand_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  is_active?: boolean;
}

export interface ProductVariant {
  id?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  retail_price?: number;
  selling_price?: number;
  wholesale_price?: number;
  purchase_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  uom_id?: string;
  base_uom_id?: string;
  tax_rate_id?: string;
  type?: 'SIMPLE' | 'VARIABLE' | string;
  item_type?: string;
  status?: string;
  can_be_sold?: boolean;
  can_be_purchased?: boolean;
  weight?: number | null;
  reorder_point?: number | null;
  retail_price?: number;
  selling_price?: number;
  wholesale_price?: number;
  purchase_price?: number;
  cost_price?: number;
  tax_rate_percentage?: number;
  is_active?: boolean;
  image_url?: string | null;
  images?: string[];
  variants?: ProductVariant[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ProductListResponse {
  data: Product[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
  [key: string]: any;
}

export const productsApi = {
  getAll: async (params?: ProductFilters): Promise<ProductListResponse> => {
    const { data } = await apiClient.get('/products', { params });
    return data;
  },

  getOne: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  create: async (payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.post('/products', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.patch(`/products/${id}`, payload);
    return data;
  },

  archive: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const { data } = await apiClient.delete(`/products/${id}`);
    return data;
  },
};
