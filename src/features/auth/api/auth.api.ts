import { apiClient } from '@/shared/api/client';

export interface LoginPayload {
  email: string;
  password?: string;
  grant_type?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string;
  roles: any[];
  role?: string;
  permissions?: string[];
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
  _deprecation?: {
    status: string;
    message: string;
    sso_url: string;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },

  logout: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },
};
