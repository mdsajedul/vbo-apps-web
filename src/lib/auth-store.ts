import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkspaceMembership {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string;
  roles: any[];
  role?: string;
  is_super_admin?: boolean;
  is_impersonating?: boolean;
  tenant_name?: string;
  tenant_slug?: string;
  vbo_user_id?: string;
  vbo_tenant_id?: string;
  permissions?: string[];
  features?: Record<string, boolean> | string[];
  limits?: Record<string, any>;
  allowed_verticals?: string[];
  app_mappings?: Record<string, string>;
  workspaces?: WorkspaceMembership[];
}

export function getUserDisplayRole(user: any): string {
  if (!user) return 'CASHIER';
  if (user.is_super_admin) return 'SUPER ADMIN';
  if (user.is_impersonating) return 'IMPERSONATING';
  const primaryRole = user.roles?.[0];
  if (typeof primaryRole === 'string' && primaryRole) return primaryRole.toUpperCase();
  if (primaryRole?.role?.name) return primaryRole.role.name.toUpperCase();
  if (primaryRole?.name) return primaryRole.name.toUpperCase();
  if (user.role) return user.role.toUpperCase();
  return 'OWNER';
}

export function isProductSubscribed(user: User | null, productId: string): boolean {
  if (!user) return false;
  if (user.is_super_admin) return true;
  if (!user.app_mappings) {
    // Fallback: ERP is always accessible from the ERP client shell
    return productId === 'erp';
  }
  return productId in user.app_mappings || Boolean(user.app_mappings[productId]);
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string | null) => void;
  setTokens: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken = null) =>
        set((state) => ({
          user,
          token,
          refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
          isAuthenticated: true,
        })),
      setTokens: (token, refreshToken = null) =>
        set((state) => ({
          token,
          refreshToken: refreshToken !== undefined && refreshToken !== null ? refreshToken : state.refreshToken,
        })),
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'bos-auth-storage',
    }
  )
);

