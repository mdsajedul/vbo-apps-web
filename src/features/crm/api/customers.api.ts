import { apiClient } from '@/shared/api/client';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  loyalty_points?: number;
  total_spent?: number;
  created_at?: string;
}

export const customersApi = {
  getAll: async (params?: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Customer[]; total?: number; meta?: any }> => {
    const { data } = await apiClient.get('/customers', { params });
    return data;
  },

  getOne: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get(`/customers/${id}`);
    return data;
  },

  create: async (payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await apiClient.post('/customers', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Customer>): Promise<Customer> => {
    const { data } = await apiClient.patch(`/customers/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(`/customers/${id}`);
    return data;
  },

  getPoints: async (customerId: string): Promise<{ points: number }> => {
    const { data } = await apiClient.get(`/loyalty/customers/${customerId}/points`);
    return data;
  },

  adjustPoints: async (
    customerId: string,
    payload: { points_change: number; reason: string },
  ): Promise<{ points: number }> => {
    const { data } = await apiClient.post(`/loyalty/customers/${customerId}/points/adjust`, payload);
    return data;
  },
};
