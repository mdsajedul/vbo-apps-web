import { useAuthStore } from './auth-store';

export const CONNECT_API_URL =
  process.env.NEXT_PUBLIC_CONNECT_API_URL || 'http://localhost:8080';

export interface ConnectContactIdentity {
  id?: string;
  type: 'email' | 'phone' | 'whatsapp' | 'facebook' | 'instagram' | 'website';
  provider?: string;
  value: string;
  isPrimary?: boolean;
}

export interface ConnectContact {
  id?: string;
  _id?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  source?: string;
  isSubscribed?: boolean;
  attributes?: Record<string, any>;
  identities?: ConnectContactIdentity[];
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectCampaign {
  id?: string;
  _id?: string;
  title: string;
  channel: 'whatsapp' | 'email' | 'sms';
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'FAILED';
  targetAudienceTag?: string;
  templateId?: string;
  recipientCount?: number;
  sentCount?: number;
  deliveredCount?: number;
  readCount?: number;
  scheduledAt?: string;
  createdAt?: string;
}

export interface ConnectMessage {
  id?: string;
  _id?: string;
  conversationId: string;
  sender: 'contact' | 'agent' | 'system' | 'bot';
  senderName?: string;
  content: string;
  contentType?: 'text' | 'image' | 'document' | 'template';
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  channel?: 'whatsapp' | 'email' | 'webchat';
  timestamp?: string;
  createdAt?: string;
}

export interface ConnectConversation {
  id?: string;
  _id?: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
  channel: 'whatsapp' | 'email' | 'webchat' | 'messenger';
  lastMessage?: {
    content?: string;
    sender?: string;
    timestamp?: string;
  };
  unreadCount?: number;
  status: 'OPEN' | 'RESOLVED' | 'PENDING';
  assignedTo?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface ConnectTemplate {
  id?: string;
  _id?: string;
  name: string;
  type: 'whatsapp' | 'email';
  category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  language?: string;
  header?: string;
  body: string;
  footer?: string;
  buttons?: Array<{ type: string; text: string; url?: string; phone?: string }>;
  createdAt?: string;
}

export interface ConnectLead {
  id?: string;
  _id?: string;
  contactId?: string;
  title: string;
  contactName: string;
  phone?: string;
  email?: string;
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
  value: number;
  currency?: string;
  source?: string;
  assignedTo?: string;
  createdAt?: string;
}

export interface ConnectChannelSettings {
  whatsapp?: {
    wabaId?: string;
    phoneNumberId?: string;
    phoneNumber?: string;
    verifiedName?: string;
    status?: 'CONNECTED' | 'DISCONNECTED';
  };
  smtp?: {
    host?: string;
    port?: number;
    username?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

async function connectFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { token, user } = useAuthStore.getState();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject tenant id header for scoping
  const connectTenantId = user?.app_mappings?.connect || user?.vbo_tenant_id || user?.tenant_id;
  if (connectTenantId && !headers.has('x-tenant-id')) {
    headers.set('x-tenant-id', connectTenantId);
  }

  // Ensure all Connect API domain routes are cleanly prefixed with /api/v1
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalizedEndpoint = cleanEndpoint.startsWith('/api/v1')
    ? cleanEndpoint
    : `/api/v1${cleanEndpoint}`;

  const url = `${CONNECT_API_URL}${normalizedEndpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `Connect API Error: ${response.statusText} (${response.status})`;
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

export const connectApi = {
  // ─── Contacts & Audience ──────────────────────────────────────────
  getContacts: async (params?: { page?: number; limit?: number; search?: string; tag?: string }): Promise<{
    data: ConnectContact[];
    meta?: { total: number; page: number; limit: number; totalPages: number };
    total?: number;
  }> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.tag) query.set('tag', params.tag);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return connectFetch(`/contacts${queryString}`);
  },

  getContactById: async (id: string): Promise<ConnectContact> => {
    return connectFetch(`/contacts/${id}`);
  },

  createContact: async (data: Partial<ConnectContact>): Promise<ConnectContact> => {
    return connectFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateContact: async (id: string, data: Partial<ConnectContact>): Promise<ConnectContact> => {
    return connectFetch(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteContact: async (id: string): Promise<{ success: boolean }> => {
    return connectFetch(`/contacts/${id}`, { method: 'DELETE' });
  },

  addContactNote: async (id: string, content: string): Promise<any> => {
    return connectFetch(`/contacts/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // ─── Broadcast Campaigns ──────────────────────────────────────────
  getCampaigns: async (params?: { status?: string }): Promise<ConnectCampaign[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return connectFetch(`/campaigns${queryString}`);
  },

  createCampaign: async (data: Partial<ConnectCampaign>): Promise<ConnectCampaign> => {
    return connectFetch('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendBroadcast: async (id: string): Promise<any> => {
    return connectFetch(`/campaigns/${id}/launch`, { method: 'POST' });
  },

  deleteCampaign: async (id: string): Promise<any> => {
    return connectFetch(`/campaigns/${id}`, { method: 'DELETE' });
  },

  // ─── Message Templates ────────────────────────────────────────────
  getTemplates: async (params?: { type?: string }): Promise<ConnectTemplate[]> => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return connectFetch(`/email-templates${queryString}`).catch(() => []);
  },

  createTemplate: async (data: Partial<ConnectTemplate>): Promise<ConnectTemplate> => {
    return connectFetch('/email-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteTemplate: async (id: string): Promise<any> => {
    return connectFetch(`/email-templates/${id}`, { method: 'DELETE' });
  },

  // ─── Lead Funnel & Pipeline ───────────────────────────────────────
  getLeads: async (): Promise<ConnectLead[]> => {
    return connectFetch('/leads').catch(() => []);
  },

  createLead: async (data: Partial<ConnectLead>): Promise<ConnectLead> => {
    let contactId = data.contactId;
    if (!contactId && (data.contactName || data.phone)) {
      try {
        const contact = await connectApi.createContact({
          displayName: data.contactName,
          phone: data.phone,
          tags: ['lead-prospect'],
        });
        contactId = contact.id || (contact as any)._id;
      } catch (e) {
        console.warn('Could not auto-create contact for lead:', e);
      }
    }

    return connectFetch('/leads', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        contactId: contactId || 'prospect_default',
      }),
    });
  },

  updateLeadStage: async (id: string, stage: string): Promise<ConnectLead> => {
    return connectFetch(`/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
  },

  // ─── Conversations & Messages ─────────────────────────────────────
  getConversations: async (params?: { status?: string; channel?: string }): Promise<ConnectConversation[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.channel) query.set('channel', params.channel);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return connectFetch(`/conversations${queryString}`).catch(() => []);
  },

  getMessages: async (conversationId: string): Promise<ConnectMessage[]> => {
    return connectFetch(`/conversations/${conversationId}/messages`).catch(() => []);
  },

  sendMessage: async (conversationId: string, content: string): Promise<ConnectMessage> => {
    return connectFetch(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  resolveConversation: async (conversationId: string): Promise<any> => {
    return connectFetch(`/conversations/${conversationId}/resolve`, { method: 'PATCH' });
  },

  // ─── Settings & Channel Config ───────────────────────────────────
  getChannelSettings: async (): Promise<ConnectChannelSettings> => {
    return connectFetch('/channels/config').catch(() => ({}));
  },

  updateWhatsAppConfig: async (data: any): Promise<any> => {
    return connectFetch('/channels/whatsapp/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSmtpConfig: async (data: any): Promise<any> => {
    return connectFetch('/smtp-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ─── Analytics ────────────────────────────────────────────────────
  getStats: async (): Promise<any> => {
    return connectFetch('/stats').catch(() => ({}));
  },
};
