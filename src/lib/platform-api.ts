import { useAuthStore } from './auth-store';

export const PLATFORM_API_URL =
  process.env.NEXT_PUBLIC_PLATFORM_API_URL || 'http://localhost:3005';

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  brand_name?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformSubscription {
  id: string;
  tenant_id: string;
  product_id: string;
  plan_tier: string;
  status: string;
  billing_cycle: string;
  seat_count: number;
  starts_at: string;
  current_period_end: string;
  features: string[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon_url?: string;
  };
}

export interface PlatformMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
}

export interface SwitchTenantResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    role: string;
    features: string[];
    limits: Record<string, any>;
    app_mappings: Record<string, string>;
  };
  all_tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

async function platformFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${PLATFORM_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `Platform API Error: ${response.statusText} (${response.status})`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.join(', ');
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const platformApi = {
  // Identity & Workspaces
  switchTenant: async (tenantId: string): Promise<SwitchTenantResponse> => {
    return platformFetch<SwitchTenantResponse>('/identity/switch-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
    });
  },

  getMyWorkspaces: async (): Promise<Array<{ id: string; name: string; slug: string; role: string }>> => {
    return platformFetch('/tenants/my-workspaces');
  },

  getProfile: async () => {
    return platformFetch('/identity/me');
  },

  // Tenant Details & Settings
  getTenant: async (tenantId: string): Promise<PlatformTenant> => {
    return platformFetch(`/tenants/${tenantId}`);
  },

  updateBranding: async (
    tenantId: string,
    data: {
      brand_name?: string;
      logo_url?: string;
      favicon_url?: string;
      primary_color?: string;
      accent_color?: string;
    }
  ): Promise<PlatformTenant> => {
    return platformFetch(`/tenants/${tenantId}/branding`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateRegionalSettings: async (
    tenantId: string,
    data: {
      timezone?: string;
      currency?: string;
      locale?: string;
      country?: string;
    }
  ): Promise<PlatformTenant> => {
    return platformFetch(`/tenants/${tenantId}/regional`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Subscriptions & Entitlements
  getSubscriptions: async (tenantId: string): Promise<PlatformSubscription[]> => {
    return platformFetch(`/tenants/${tenantId}/subscriptions`);
  },

  updateSubscription: async (
    tenantId: string,
    productId: string,
    data: {
      plan_tier: string;
      billing_cycle?: 'MONTHLY' | 'ANNUAL';
      features?: string[];
      seat_count?: number;
    }
  ): Promise<PlatformSubscription> => {
    return platformFetch(`/tenants/${tenantId}/subscriptions/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Team & Invitations
  getMembers: async (tenantId: string): Promise<PlatformMember[]> => {
    return platformFetch(`/tenants/${tenantId}/members`);
  },

  inviteMember: async (
    tenantId: string,
    data: { email: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' }
  ) => {
    return platformFetch(`/tenants/${tenantId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
