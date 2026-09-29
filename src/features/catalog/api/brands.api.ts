import { apiClient } from '@/shared/api/client';

export interface Brand {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  description?: string;
  is_active?: boolean;
  [key: string]: any;
}

export const brandsApi = {
  getAll: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get('/brands');
    return data;
  },

  create: async (payload: Partial<Brand>): Promise<Brand> => {
    const { data } = await apiClient.post('/brands', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Brand>): Promise<Brand> => {
    const { data } = await apiClient.patch(`/brands/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const { data } = await apiClient.delete(`/brands/${id}`);
    return data;
  },
};
