/**
 * Centralized Type-Safe Query Key Factory
 * Standardizes TanStack Query cache keys across all ERP feature modules.
 */

export const queryKeys = {
  // Catalog & Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: { category_id?: string; search?: string; page?: number; limit?: number }) =>
      [...queryKeys.products.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  categories: {
    all: ['categories'] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
  },

  brands: {
    all: ['brands'] as const,
  },

  // Inventory & Stock
  inventory: {
    all: ['inventory'] as const,
    lists: () => [...queryKeys.inventory.all, 'list'] as const,
    list: (params?: { branch_id?: string; page?: number; limit?: number }) =>
      [...queryKeys.inventory.lists(), params ?? {}] as const,
    byBranch: (branchId: string) => [...queryKeys.inventory.all, 'branch', branchId] as const,
  },

  // Point of Sale (POS)
  pos: {
    all: ['pos'] as const,
    currentShift: (branchId?: string) => [...queryKeys.pos.all, 'shift', 'current', branchId ?? 'global'] as const,
    activeGlobalShift: () => [...queryKeys.pos.all, 'shift', 'active-global'] as const,
  },

  // Sales Orders & Returns
  sales: {
    all: ['sales'] as const,
    lists: () => [...queryKeys.sales.all, 'list'] as const,
    list: (params?: { branch_id?: string; page?: number; limit?: number }) =>
      [...queryKeys.sales.lists(), params ?? {}] as const,
    details: () => [...queryKeys.sales.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sales.details(), id] as const,
    returns: () => [...queryKeys.sales.all, 'returns'] as const,
  },

  // Customers & Loyalty
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (params?: { q?: string; page?: number; limit?: number }) =>
      [...queryKeys.customers.lists(), params ?? {}] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    points: (customerId: string) => [...queryKeys.customers.all, 'points', customerId] as const,
  },

  // Suppliers & Procurement
  suppliers: {
    all: ['suppliers'] as const,
    list: (params?: { page?: number; limit?: number }) => [...queryKeys.suppliers.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.suppliers.all, 'detail', id] as const,
  },

  procurement: {
    all: ['procurement'] as const,
    orders: (params?: { branch_id?: string; status?: string }) =>
      [...queryKeys.procurement.all, 'orders', params ?? {}] as const,
    order: (id: string) => [...queryKeys.procurement.all, 'orders', id] as const,
    grns: (params?: { branch_id?: string }) => [...queryKeys.procurement.all, 'grns', params ?? {}] as const,
    grn: (id: string) => [...queryKeys.procurement.all, 'grns', id] as const,
  },

  // Warehouse Management
  warehouse: {
    all: ['warehouse'] as const,
    zones: (branchId?: string) => [...queryKeys.warehouse.all, 'zones', branchId ?? 'all'] as const,
    bins: (params?: { branch_id?: string; zone_id?: string }) =>
      [...queryKeys.warehouse.all, 'bins', params ?? {}] as const,
  },

  // Organizations & Branches
  organizations: {
    all: ['organizations'] as const,
    current: () => [...queryKeys.organizations.all, 'current'] as const,
  },

  branches: {
    all: ['branches'] as const,
    accessible: () => [...queryKeys.branches.all, 'accessible'] as const,
    detail: (id: string) => [...queryKeys.branches.all, 'detail', id] as const,
  },

  // Users & Roles
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    list: (params?: { page?: number; limit?: number }) => [...queryKeys.users.all, 'list', params ?? {}] as const,
  },

  roles: {
    all: ['roles'] as const,
    permissions: () => [...queryKeys.roles.all, 'permissions'] as const,
  },

  // Reports & Analytics
  reports: {
    all: ['reports'] as const,
    dashboardMetrics: (branchId?: string) =>
      [...queryKeys.reports.all, 'dashboard', branchId ?? 'all'] as const,
    restaurantMetrics: (params?: { period?: string; branchId?: string }) =>
      [...queryKeys.reports.all, 'restaurant', params ?? {}] as const,
  },
} as const;
