import axios from 'axios';
import { apiClient as api } from '@/shared/api/client';
import { useAuthStore } from '@/lib/auth-store';

export { api };
export * from '@/features';



// Organizations API
export const organizationsApi = {
  getAll: async () => {
    const { data } = await api.get('/organizations');
    return data;
  },
  getCurrent: async () => {
    const { data } = await api.get('/organizations/current');
    return data;
  },
  updateCurrent: async (payload: any) => {
    const { data } = await api.patch('/organizations/current', payload);
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/organizations/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/organizations', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.patch(`/organizations/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/organizations/${id}`);
    return data;
  },
};

// Branches API
export const branchesApi = {
  getAccessible: async () => {
    const { data } = await api.get('/branches/accessible');
    return data;
  },
  getAll: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/branches', { params });
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/branches/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/branches', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.patch(`/branches/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/branches/${id}`);
    return data;
  },
};

// Geolocation API
export const geoApi = {
  getCountries: async () => {
    const { data } = await api.get('/geo/countries');
    return data;
  },
  getDivisions: async (countryId?: string) => {
    const { data } = await api.get('/geo/divisions', {
      params: countryId ? { country_id: countryId } : undefined,
    });
    return data;
  },
  getDistricts: async (divisionId?: string) => {
    const { data } = await api.get('/geo/districts', {
      params: divisionId ? { division_id: divisionId } : undefined,
    });
    return data;
  },
  getSubdistricts: async (districtId?: string) => {
    const { data } = await api.get('/geo/subdistricts', {
      params: districtId ? { district_id: districtId } : undefined,
    });
    return data;
  },
};

// UOM API
export const uomApi = {
  getAll: async () => {
    const { data } = await api.get('/uom');
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/uom', payload);
    return data;
  },
  seedDefaults: async () => {
    const { data } = await api.post('/uom/seed');
    return data;
  },
};

// Users API
export const usersApi = {
  getMe: async () => {
    const { data } = await api.get('/users/me');
    return data;
  },
  getAll: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/users', { params });
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/users', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },
  assignRoles: async (id: string, role_ids: string[]) => {
    const { data } = await api.put(`/users/${id}/roles`, { role_ids });
    return data;
  }
};

// Roles API
export const rolesApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/roles', { params });
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/roles', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.put(`/roles/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/roles/${id}`);
    return data;
  },
  getPermissions: async () => {
    const { data } = await api.get('/roles/permissions');
    return data;
  },
  assignPermissions: async (id: string, permission_ids: string[]) => {
    const { data } = await api.put(`/roles/${id}/permissions`, { permission_ids });
    return data;
  }
};


// Suppliers API
export const suppliersApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/suppliers', { params });
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/suppliers', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.patch(`/suppliers/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/suppliers/${id}`);
    return data;
  }
};


// Upload API
export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  validateProducts: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/upload/products/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  commitProducts: async (rows: any[], branchId: string) => {
    const { data } = await api.post('/upload/products/commit', { rows, branchId });
    return data;
  }
};



// Notifications API
export const notificationsApi = {
  getUnread: async () => {
    const { data } = await api.get('/notifications/unread');
    return data;
  },
  markAsRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },
  markAllAsRead: async () => {
    const { data } = await api.post('/notifications/read-all');
    return data;
  }
};

// Reports API
export const reportsApi = {
  getDashboardMetrics: async (params?: { branchId?: string }) => {
    const { data } = await api.get('/reports/dashboard-metrics', { params });
    return data;
  },
  getRestaurantDashboardMetrics: async (params?: { period?: string; branchId?: string }) => {
    const { data } = await api.get('/reports/restaurant-dashboard', { params });
    return data;
  },
  getZReport: async (date?: string) => {
    const { data } = await api.get('/reports/z-report', { params: { date } });
    return data;
  },
  getTaxReport: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/tax-report', { params: { startDate, endDate } });
    return data;
  }
};

// Warehouse API
export const warehouseApi = {
  getZones: async (params?: { branch_id?: string }) => {
    const { data } = await api.get('/warehouse/zones', { params });
    return data;
  },
  createZone: async (payload: any) => {
    const { data } = await api.post('/warehouse/zones', payload);
    return data;
  },
  deleteZone: async (id: string) => {
    const { data } = await api.delete(`/warehouse/zones/${id}`);
    return data;
  },
  getBins: async (params?: { branch_id?: string; zone_id?: string }) => {
    const { data } = await api.get('/warehouse/bins', { params });
    return data;
  },
  createBin: async (payload: any) => {
    const { data } = await api.post('/warehouse/bins', payload);
    return data;
  },
  deleteBin: async (id: string) => {
    const { data } = await api.delete(`/warehouse/bins/${id}`);
    return data;
  },
  transferStock: async (payload: any) => {
    const { data } = await api.post('/warehouse/transfer', payload);
    return data;
  }
};

// Procurement API
export const procurementApi = {
  createPO: async (payload: any) => {
    const { data } = await api.post('/procurement/orders', payload);
    return data;
  },
  getPOs: async (params?: { branch_id?: string; status?: string }) => {
    const { data } = await api.get('/procurement/orders', { params });
    return data;
  },
  getPO: async (id: string) => {
    const { data } = await api.get(`/procurement/orders/${id}`);
    return data;
  },
  updatePOStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/procurement/orders/${id}/status`, { status });
    return data;
  },
  createGRN: async (payload: any) => {
    const { data } = await api.post('/procurement/grn', payload);
    return data;
  },
  getGRNs: async (params?: { branch_id?: string }) => {
    const { data } = await api.get('/procurement/grn', { params });
    return data;
  },
  getGRN: async (id: string) => {
    const { data } = await api.get(`/procurement/grn/${id}`);
    return data;
  }
};


// Returns API
export const returnsApi = {
  getAll: async () => {
    const { data } = await api.get('/sales/returns');
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/sales/returns', payload);
    return data;
  },
  process: async (id: string, payload: { status: string }) => {
    const { data } = await api.patch(`/sales/returns/${id}/process`, payload);
    return data;
  }
};

// Loyalty API
export const loyaltyApi = {
  getConfig: async () => {
    const { data } = await api.get('/loyalty/config');
    return data;
  },
  updateConfig: async (payload: any) => {
    const { data } = await api.post('/loyalty/config', payload);
    return data;
  },
  getCustomerPoints: async (customerId: string) => {
    const { data } = await api.get(`/loyalty/customers/${customerId}/points`);
    return data;
  },
  adjustPoints: async (customerId: string, payload: { points_change: number; reason: string }) => {
    const { data } = await api.post(`/loyalty/customers/${customerId}/points/adjust`, payload);
    return data;
  }
};

// Gift Cards API
export const giftCardsApi = {
  getAll: async (params?: { customer_id?: string }) => {
    const { data } = await api.get('/gift-cards', { params });
    return data;
  },
  issue: async (payload: { amount: number; customer_id?: string; expiry_date?: string }) => {
    const { data } = await api.post('/gift-cards/issue', payload);
    return data;
  },
  checkBalance: async (code: string) => {
    const { data } = await api.get(`/gift-cards/${code}/balance`);
    return data;
  },
  redeem: async (payload: { code: string; amount: number; reference_id?: string }) => {
    const { data } = await api.post('/gift-cards/redeem', payload);
    return data;
  }
};

// Accounting API
export const accountingApi = {
  getAccounts: async () => {
    const { data } = await api.get('/accounting/accounts');
    return data;
  },
  createAccount: async (payload: any) => {
    const { data } = await api.post('/accounting/accounts', payload);
    return data;
  },
  updateAccount: async (id: string, payload: any) => {
    const { data } = await api.post(`/accounting/accounts/${id}`, payload);
    return data;
  },
  deleteAccount: async (id: string) => {
    const { data } = await api.delete(`/accounting/accounts/${id}`);
    return data;
  },
  getJournals: async () => {
    const { data } = await api.get('/accounting/journals');
    return data;
  },
  createJournal: async (payload: any) => {
    const { data } = await api.post('/accounting/journals', payload);
    return data;
  },
  getReports: async () => {
    const { data } = await api.get('/accounting/reports');
    return data;
  }
};

// Invoices API
export const invoicesApi = {
  getAll: async () => {
    const { data } = await api.get('/invoices');
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await api.post('/invoices', payload);
    return data;
  },
  pay: async (id: string, payload: any) => {
    const { data } = await api.post(`/invoices/${id}/pay`, payload);
    return data;
  }
};

// Analytics API
export const analyticsApi = {
  getSalesTrends: async (days?: number) => {
    const { data } = await api.get('/analytics/sales-trends', { params: { days } });
    return data;
  },
  getInventoryHealth: async () => {
    const { data } = await api.get('/analytics/inventory-health');
    return data;
  },
  getStaffPerformance: async () => {
    const { data } = await api.get('/analytics/staff-performance');
    return data;
  }
};

// Payments API
export const paymentsApi = {
  configureGateway: async (payload: any) => {
    const { data } = await api.post('/payments/gateways', payload);
    return data;
  },
  getGateways: async () => {
    const { data } = await api.get('/payments/gateways');
    return data;
  },
  generateLink: async (payload: any) => {
    const { data } = await api.post('/payments/generate-link', payload);
    return data;
  },
  resolveLink: async (token: string) => {
    const { data } = await api.get(`/payments/link/${token}`);
    return data;
  },
  mockComplete: async (token: string) => {
    const { data } = await api.post(`/payments/link/${token}/mock-pay`);
    return data;
  },
  initiate: async (token: string) => {
    const { data } = await api.post(`/payments/link/${token}/initiate`);
    return data;
  }
};

// Subscriptions API
export const subscriptionsApi = {
  getPlans: async () => {
    const { data } = await api.get('/subscriptions/plans');
    return data;
  },
  getMy: async () => {
    const { data } = await api.get('/subscriptions/my');
    return data;
  },
  subscribe: async (planId: string) => {
    const { data } = await api.post('/subscriptions/subscribe', { planId });
    return data;
  },
  createStripeCheckout: async (planId: string) => {
    const { data } = await api.post('/subscriptions/stripe-checkout', { planId });
    return data;
  },
  cancel: async () => {
    const { data } = await api.post('/subscriptions/cancel');
    return data;
  },
  getBillingHistory: async () => {
    const { data } = await api.get('/subscriptions/billing-history');
    return data;
  }
};

// CRM API
export const crmApi = {
  // Leads
  getLeads: async (params?: { q?: string; status?: string; source?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/crm/leads', { params });
    return data;
  },
  getLead: async (id: string) => {
    const { data } = await api.get(`/crm/leads/${id}`);
    return data;
  },
  createLead: async (payload: any) => {
    const { data } = await api.post('/crm/leads', payload);
    return data;
  },
  updateLead: async (id: string, payload: any) => {
    const { data } = await api.patch(`/crm/leads/${id}`, payload);
    return data;
  },
  deleteLead: async (id: string) => {
    const { data } = await api.delete(`/crm/leads/${id}`);
    return data;
  },
  convertLead: async (id: string) => {
    const { data } = await api.post(`/crm/leads/${id}/convert`);
    return data;
  },
  importLeads: async (leads: any[]) => {
    const { data } = await api.post('/crm/leads/import', { leads });
    return data;
  },

  // Pipelines & Stages
  getPipelines: async () => {
    const { data } = await api.get('/crm/pipelines');
    return data;
  },
  createPipeline: async (payload: any) => {
    const { data } = await api.post('/crm/pipelines', payload);
    return data;
  },
  updatePipeline: async (id: string, payload: any) => {
    const { data } = await api.patch(`/crm/pipelines/${id}`, payload);
    return data;
  },
  deletePipeline: async (id: string) => {
    const { data } = await api.delete(`/crm/pipelines/${id}`);
    return data;
  },

  // Opportunities
  getOpportunities: async (params?: { pipeline_id?: string; stage_id?: string; assigned_to?: string }) => {
    const { data } = await api.get('/crm/opportunities', { params });
    return data;
  },
  getKanbanBoard: async (pipelineId: string) => {
    const { data } = await api.get('/crm/opportunities/kanban', { params: { pipeline_id: pipelineId } });
    return data;
  },
  createOpportunity: async (payload: any) => {
    const { data } = await api.post('/crm/opportunities', payload);
    return data;
  },
  updateOpportunity: async (id: string, payload: any) => {
    const { data } = await api.patch(`/crm/opportunities/${id}`, payload);
    return data;
  },
  deleteOpportunity: async (id: string) => {
    const { data } = await api.delete(`/crm/opportunities/${id}`);
    return data;
  },

  // Activities
  getActivities: async (params?: { lead_id?: string; opportunity_id?: string; customer_id?: string }) => {
    const { data } = await api.get('/crm/activities', { params });
    return data;
  },
  createActivity: async (payload: any) => {
    const { data } = await api.post('/crm/activities', payload);
    return data;
  },
  updateActivity: async (id: string, payload: any) => {
    const { data } = await api.patch(`/crm/activities/${id}`, payload);
    return data;
  },
  deleteActivity: async (id: string) => {
    const { data } = await api.delete(`/crm/activities/${id}`);
    return data;
  },

  // Segments
  getSegments: async () => {
    const { data } = await api.get('/crm/segments');
    return data;
  },
  createSegment: async (payload: any) => {
    const { data } = await api.post('/crm/segments', payload);
    return data;
  },
  getSegmentCustomers: async (id: string) => {
    const { data } = await api.get(`/crm/segments/${id}/customers`);
    return data;
  },

  // Analytics
  getFunnelData: async () => {
    const { data } = await api.get('/crm/analytics/funnel');
    return data;
  },
  getPipelineValue: async () => {
    const { data } = await api.get('/crm/analytics/pipeline-value');
    return data;
  },
  getSalesVelocity: async () => {
    const { data } = await api.get('/crm/analytics/velocity');
    return data;
  },
};

// BI API
export const biApi = {
  // Saved Reports
  getReports: async () => {
    const { data } = await api.get('/bi/reports');
    return data;
  },
  createReport: async (payload: any) => {
    const { data } = await api.post('/bi/reports', payload);
    return data;
  },
  getReport: async (id: string) => {
    const { data } = await api.get(`/bi/reports/${id}`);
    return data;
  },
  updateReport: async (id: string, payload: any) => {
    const { data } = await api.patch(`/bi/reports/${id}`, payload);
    return data;
  },
  deleteReport: async (id: string) => {
    const { data } = await api.delete(`/bi/reports/${id}`);
    return data;
  },
  runReport: async (id: string) => {
    const { data } = await api.post(`/bi/reports/${id}/run`);
    return data;
  },
  previewReport: async (dataSource: string, config: any) => {
    const { data } = await api.post('/bi/reports/preview', { data_source: dataSource, config });
    return data;
  },

  // Templates
  getTemplates: async () => {
    const { data } = await api.get('/bi/templates');
    return data;
  },
  runTemplate: async (id: string, params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get(`/bi/templates/${id}/run`, { params });
    return data;
  },

  // Comparative
  getComparative: async (params: { metric: string; start1: string; end1: string; start2: string; end2: string }) => {
    const { data } = await api.get('/bi/comparative', { params });
    return data;
  },
  getBranchComparison: async () => {
    const { data } = await api.get('/bi/branch-comparison');
    return data;
  },

  // Schedules
  getSchedules: async () => {
    const { data } = await api.get('/bi/schedules');
    return data;
  },
  createSchedule: async (payload: any) => {
    const { data } = await api.post('/bi/schedules', payload);
    return data;
  },
  updateSchedule: async (id: string, payload: any) => {
    const { data } = await api.patch(`/bi/schedules/${id}`, payload);
    return data;
  },
  deleteSchedule: async (id: string) => {
    const { data } = await api.delete(`/bi/schedules/${id}`);
    return data;
  },
};

// E-commerce / Omnichannel API
export const ecommerceApi = {
  // Channels
  getChannels: async () => {
    const { data } = await api.get('/ecommerce/channels');
    return data;
  },
  createChannel: async (payload: any) => {
    const { data } = await api.post('/ecommerce/channels', payload);
    return data;
  },
  getChannel: async (id: string) => {
    const { data } = await api.get(`/ecommerce/channels/${id}`);
    return data;
  },
  updateChannel: async (id: string, payload: any) => {
    const { data } = await api.patch(`/ecommerce/channels/${id}`, payload);
    return data;
  },
  deleteChannel: async (id: string) => {
    const { data } = await api.delete(`/ecommerce/channels/${id}`);
    return data;
  },
  testConnection: async (id: string) => {
    const { data } = await api.post(`/ecommerce/channels/${id}/test`);
    return data;
  },

  // Sync triggers
  triggerProductSync: async (id: string) => {
    const { data } = await api.post(`/ecommerce/channels/${id}/sync/products`);
    return data;
  },
  triggerInventorySync: async (id: string) => {
    const { data } = await api.post(`/ecommerce/channels/${id}/sync/inventory`);
    return data;
  },
  triggerOrderPull: async (id: string) => {
    const { data } = await api.post(`/ecommerce/channels/${id}/sync/orders`);
    return data;
  },

  // Mappings
  getMappings: async (channelId: string) => {
    const { data } = await api.get(`/ecommerce/channels/${channelId}/mappings`);
    return data;
  },
  createMapping: async (channelId: string, payload: any) => {
    const { data } = await api.post(`/ecommerce/channels/${channelId}/mappings`, payload);
    return data;
  },
  deleteMapping: async (id: string) => {
    const { data } = await api.delete(`/ecommerce/mappings/${id}`);
    return data;
  },

  // Online Orders
  getOrders: async (params?: { channel_id?: string; fulfillment_status?: string; payment_status?: string }) => {
    const { data } = await api.get('/ecommerce/orders', { params });
    return data;
  },
  getOrder: async (id: string) => {
    const { data } = await api.get(`/ecommerce/orders/${id}`);
    return data;
  },
  fulfillOrder: async (id: string) => {
    const { data } = await api.post(`/ecommerce/orders/${id}/fulfill`);
    return data;
  },

  // Logs & Health
  getLogs: async (channelId: string, limit = 100) => {
    const { data } = await api.get(`/ecommerce/channels/${channelId}/logs`, { params: { limit } });
    return data;
  },
  getHealth: async (channelId: string) => {
    const { data } = await api.get(`/ecommerce/channels/${channelId}/health`);
    return data;
  },
};

// Super-Admin Platform API
export const superAdminApi = {
  getMetrics: async () => {
    const { data } = await api.get('/super-admin/metrics');
    return data;
  },
  getTenants: async (params?: { search?: string; status?: string }) => {
    const { data } = await api.get('/super-admin/tenants', { params });
    return data;
  },
  createTenant: async (payload: any) => {
    const { data } = await api.post('/super-admin/tenants', payload);
    return data;
  },
  getTenantDetails: async (id: string) => {
    const { data } = await api.get(`/super-admin/tenants/${id}`);
    return data;
  },
  resetOwnerPassword: async (tenantId: string, password?: string) => {
    const { data } = await api.post(`/super-admin/tenants/${tenantId}/reset-owner-password`, { password });
    return data;
  },
  updateTenantStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/super-admin/tenants/${id}/status`, { status });
    return data;
  },
  impersonateTenant: async (id: string) => {
    const { data } = await api.post(`/super-admin/tenants/${id}/impersonate`);
    return data;
  },
  getAllFeatureFlags: async () => {
    const { data } = await api.get('/super-admin/feature-flags');
    return data;
  },
  toggleGlobalFlag: async (key: string, is_enabled: boolean) => {
    const { data } = await api.patch(`/super-admin/feature-flags/${key}/toggle`, { is_enabled });
    return data;
  },
  setTenantFlagOverride: async (tenantId: string, key: string, is_enabled: boolean) => {
    const { data } = await api.post(`/super-admin/tenants/${tenantId}/feature-flags/${key}`, { is_enabled });
    return data;
  },
  getPlans: async () => {
    const { data } = await api.get('/super-admin/plans');
    return data;
  },
  createPlan: async (payload: any) => {
    const { data } = await api.post('/super-admin/plans', payload);
    return data;
  },
  updatePlan: async (id: string, payload: any) => {
    const { data } = await api.patch(`/super-admin/plans/${id}`, payload);
    return data;
  },
  getPlatformGateways: async () => {
    const { data } = await api.get('/super-admin/payments/gateways');
    return data;
  },
  configurePlatformGateway: async (payload: any) => {
    const { data } = await api.post('/super-admin/payments/gateways', payload);
    return data;
  },
  getPlatformPaymentRecords: async () => {
    const { data } = await api.get('/super-admin/payments/records');
    return data;
  },
  getMasterData: async (params?: { type?: string }) => {
    const { data } = await api.get<MasterDataEntry[]>('/super-admin/master-data', { params });
    return data;
  },
  createMasterData: async (payload: any) => {
    const { data } = await api.post<MasterDataEntry>('/super-admin/master-data', payload);
    return data;
  },
  updateMasterData: async (id: string, payload: any) => {
    const { data } = await api.put<MasterDataEntry>(`/super-admin/master-data/${id}`, payload);
    return data;
  },
  deleteMasterData: async (id: string) => {
    const { data } = await api.delete<MasterDataEntry>(`/super-admin/master-data/${id}`);
    return data;
  },
  seedDefaultMasterData: async () => {
    const { data } = await api.post('/super-admin/master-data/seed-defaults');
    return data;
  },
};

// Dynamic Navigation API
export const navigationApi = {
  getMenu: async () => {
    const { data } = await api.get('/navigation/menu');
    return data;
  },
  getAdminNavigation: async () => {
    const { data } = await api.get('/super-admin/navigation');
    return data;
  },
  createGroup: async (payload: any) => {
    const { data } = await api.post('/super-admin/navigation/groups', payload);
    return data;
  },
  updateGroup: async (id: string, payload: any) => {
    const { data } = await api.patch(`/super-admin/navigation/groups/${id}`, payload);
    return data;
  },
  deleteGroup: async (id: string) => {
    const { data } = await api.delete(`/super-admin/navigation/groups/${id}`);
    return data;
  },
  createItem: async (payload: any) => {
    const { data } = await api.post('/super-admin/navigation/items', payload);
    return data;
  },
  updateItem: async (id: string, payload: any) => {
    const { data } = await api.patch(`/super-admin/navigation/items/${id}`, payload);
    return data;
  },
  deleteItem: async (id: string) => {
    const { data } = await api.delete(`/super-admin/navigation/items/${id}`);
    return data;
  },
};

// Feature Flags API
export const featureFlagsApi = {
  getMyFlags: async () => {
    const { data } = await api.get('/feature-flags/my-flags');
    return data;
  },
};

// Master Data Management API
export interface MasterDataEntry {
  id: string;
  tenant_id: string | null;
  type: string;
  code: string;
  label: string;
  label_bn?: string | null;
  icon?: string | null;
  color?: string | null;
  metadata?: Record<string, any> | null;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const masterDataApi = {
  getAll: async (params?: { type?: string; active_only?: boolean }) => {
    const { data } = await api.get<MasterDataEntry[]>('/master-data', { params });
    return data;
  },
  getByType: async (type: string, active_only = true) => {
    const { data } = await api.get<MasterDataEntry[]>('/master-data', {
      params: { type, active_only },
    });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<MasterDataEntry>(`/master-data/${id}`);
    return data;
  },
  create: async (payload: Partial<MasterDataEntry>) => {
    const { data } = await api.post<MasterDataEntry>('/master-data', payload);
    return data;
  },
  update: async (id: string, payload: Partial<MasterDataEntry>) => {
    const { data } = await api.put<MasterDataEntry>(`/master-data/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete<MasterDataEntry>(`/master-data/${id}`);
    return data;
  },
};

// VBO Unified Platform Super-Admin API
const VBO_PLATFORM_URL = process.env.NEXT_PUBLIC_VBO_PLATFORM_URL || 'http://localhost:3005';

export const platformApi = axios.create({
  baseURL: VBO_PLATFORM_URL,
  withCredentials: true,
});

platformApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-vbo-service-key'] = process.env.NEXT_PUBLIC_VBO_SERVICE_KEY || 'vbo-service-secret-key-998877';
  return config;
});

export const platformAdminApi = {
  getGlobalTenants: async () => {
    const { data } = await platformApi.get('/tenants');
    return data;
  },
  getTenantSubscriptions: async (tenantId: string) => {
    const { data } = await platformApi.get(`/tenants/${tenantId}/subscriptions`);
    return data;
  },
  updateTenantSubscription: async (
    tenantId: string,
    productId: string,
    dto: { plan_tier: string; status?: string; features?: string[] },
  ) => {
    const { data } = await platformApi.put(`/tenants/${tenantId}/subscriptions/${productId}`, dto);
    return data;
  },
  provisionTenant: async (tenantId: string, productId?: string) => {
    const url = productId ? `/tenants/${tenantId}/provision/${productId}` : `/tenants/${tenantId}/provision`;
    const { data } = await platformApi.post(url);
    return data;
  },
  getProducts: async () => {
    const { data } = await platformApi.get('/products');
    return data;
  },
  createGlobalTenant: async (payload: { name: string; slug?: string; timezone?: string; currency?: string; locale?: string; country?: string }) => {
    const { data } = await platformApi.post('/tenants', payload);
    return data;
  },
  provisionWorkspace: async (payload: any) => {
    const { data } = await platformApi.post('/tenants/admin/provision-workspace', payload);
    return data;
  },
  createPlan: async (productId: string, payload: any) => {
    const { data } = await platformApi.post(`/products/${productId}/plans`, payload);
    return data;
  },
  updatePlan: async (productId: string, planId: string, payload: any) => {
    const { data } = await platformApi.patch(`/products/${productId}/plans/${planId}`, payload);
    return data;
  },
  resetOwnerPassword: async (tenantId: string, customPassword?: string) => {
    const { data } = await platformApi.post(`/tenants/${tenantId}/reset-owner-password`, {
      custom_password: customPassword,
    });
    return data;
  },
};

// ─── Ecosystem Health Check Helpers ───
const CONNECT_API_URL = process.env.NEXT_PUBLIC_CONNECT_API_URL || 'http://localhost:8080';
const ERP_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface ServiceHealthResult {
  service: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  latencyMs: number;
  details?: any;
  error?: string;
}

async function checkServiceHealth(name: string, url: string, endpoint: string): Promise<ServiceHealthResult> {
  const start = Date.now();
  try {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${url}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-vbo-service-key': process.env.NEXT_PUBLIC_VBO_SERVICE_KEY || 'vbo-service-secret-key-998877',
      },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;
    // Any HTTP response means the server is reachable
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      return { service: name, url, status: 'online', latencyMs, details: body };
    }
    // Server responded but with an error code — still online (e.g. 401, 404)
    return { service: name, url, status: 'online', latencyMs, details: { httpStatus: res.status } };
  } catch (err: any) {
    return { service: name, url, status: 'offline', latencyMs: Date.now() - start, error: err.message };
  }
}

export const ecosystemApi = {
  checkAllHealth: async (): Promise<ServiceHealthResult[]> => {
    const [platform, erp, connect] = await Promise.all([
      checkServiceHealth('VBO Platform', process.env.NEXT_PUBLIC_VBO_PLATFORM_URL || 'http://localhost:3005', '/products'),
      checkServiceHealth('VBO ERP API', ERP_API_URL, '/health'),
      checkServiceHealth('VBO Connect API', CONNECT_API_URL, '/health'),
    ]);
    return [platform, erp, connect];
  },
};


