import { apiClient } from '@/shared/api/client';

export interface Category {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  children?: Category[];
  [key: string]: any;
}

export const categoriesApi = {
  getTree: async (): Promise<any> => {
    const { data } = await apiClient.get('/categories/tree');
    return data;
  },

  create: async (payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.post('/categories', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.patch(`/categories/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const { data } = await apiClient.delete(`/categories/${id}`);
    return data;
  },
};
