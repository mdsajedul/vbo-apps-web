import { api } from './api';

export const restaurantApi = {
  // Floor Plans
  getFloorPlans: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/floor-plans', { params: { branch_id: branchId } });
    return data;
  },
  createFloorPlan: async (payload: any) => {
    const { data } = await api.post('/restaurant/floor-plans', payload);
    return data;
  },
  updateFloorPlan: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/floor-plans/${id}`, payload);
    return data;
  },
  deleteFloorPlan: async (id: string) => {
    const { data } = await api.delete(`/restaurant/floor-plans/${id}`);
    return data;
  },

  // Zones
  createZone: async (payload: any) => {
    const { data } = await api.post('/restaurant/zones', payload);
    return data;
  },
  updateZone: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/zones/${id}`, payload);
    return data;
  },
  deleteZone: async (id: string) => {
    const { data } = await api.delete(`/restaurant/zones/${id}`);
    return data;
  },

  // Tables
  createTable: async (payload: any) => {
    const { data } = await api.post('/restaurant/tables', payload);
    return data;
  },
  updateTable: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/tables/${id}`, payload);
    return data;
  },
  updateTableStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/restaurant/tables/${id}/status`, { status });
    return data;
  },
  mergeTables: async (tableIds: string[]) => {
    const { data } = await api.post('/restaurant/tables/merge', { table_ids: tableIds });
    return data;
  },
  unmergeTable: async (id: string) => {
    const { data } = await api.post(`/restaurant/tables/${id}/unmerge`);
    return data;
  },

  // Sessions / Dine-in Ordering
  getActiveSessions: async () => {
    const { data } = await api.get('/restaurant/active-sessions');
    return data;
  },
  openSession: async (payload: any) => {
    const { data } = await api.post('/restaurant/sessions', payload);
    return data;
  },
  getSession: async (id: string) => {
    const { data } = await api.get(`/restaurant/sessions/${id}`);
    return data;
  },
  addOrder: async (sessionId: string, payload: any) => {
    const { data } = await api.post(`/restaurant/sessions/${sessionId}/orders`, payload);
    return data;
  },
  voidItem: async (sessionId: string, orderItemId: string, reason: string) => {
    const { data } = await api.patch(`/restaurant/sessions/${sessionId}/items/${orderItemId}/void`, { reason });
    return data;
  },
  compItem: async (sessionId: string, orderItemId: string, reason: string) => {
    const { data } = await api.patch(`/restaurant/sessions/${sessionId}/items/${orderItemId}/comp`, { reason });
    return data;
  },
  transferSession: async (sessionId: string, targetTableId: string) => {
    const { data } = await api.post(`/restaurant/sessions/${sessionId}/transfer`, { target_table_id: targetTableId });
    return data;
  },
  generateBill: async (sessionId: string) => {
    const { data } = await api.post(`/restaurant/sessions/${sessionId}/bill`);
    return data;
  },
  settleSession: async (sessionId: string, payload: any) => {
    const { data } = await api.post(`/restaurant/sessions/${sessionId}/settle`, payload);
    return data;
  },
  holdSession: async (sessionId: string, notes?: string) => {
    const { data } = await api.post(`/restaurant/sessions/${sessionId}/hold`, { notes });
    return data;
  },
  recallSession: async (sessionId: string) => {
    const { data } = await api.post(`/restaurant/sessions/${sessionId}/recall`);
    return data;
  },
  cancelSession: async (sessionId: string, reason: string) => {
    const { data } = await api.post(`/restaurant/sessions/${sessionId}/cancel`, { reason });
    return data;
  },
  getHeldSessions: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/sessions/held', { params: { branch_id: branchId } });
    return data;
  },


  // Takeaway & Delivery
  createTakeawayOrder: async (payload: any) => {
    const { data } = await api.post('/restaurant/orders/takeaway', payload);
    return data;
  },
  createDeliveryOrder: async (payload: any) => {
    const { data } = await api.post('/restaurant/orders/delivery', payload);
    return data;
  },
  getOrders: async (params?: { type?: string; status?: string }) => {
    const { data } = await api.get('/restaurant/orders', { params });
    return data;
  },
  getDeliveryPartners: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/delivery-partners', { params: { branch_id: branchId } });
    return data;
  },
  createDeliveryPartner: async (payload: any) => {
    const { data } = await api.post('/restaurant/delivery-partners', payload);
    return data;
  },
  updateDeliveryPartner: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/delivery-partners/${id}`, payload);
    return data;
  },
  deleteDeliveryPartner: async (id: string) => {
    const { data } = await api.delete(`/restaurant/delivery-partners/${id}`);
    return data;
  },

  // KDS / Kitchen
  getKitchenSummary: async () => {
    const { data } = await api.get('/restaurant/kitchen/summary');
    return data;
  },
  getKitchenStations: async () => {
    const { data } = await api.get('/restaurant/kitchen/stations');
    return data;
  },
  createKitchenStation: async (payload: any) => {
    const { data } = await api.post('/restaurant/kitchen/stations', payload);
    return data;
  },
  updateKitchenStation: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/kitchen/stations/${id}`, payload);
    return data;
  },
  deleteKitchenStation: async (id: string) => {
    const { data } = await api.delete(`/restaurant/kitchen/stations/${id}`);
    return data;
  },
  getKDSOrders: async (stationId: string) => {
    const { data } = await api.get('/restaurant/kitchen/orders', { params: { station_id: stationId } });
    return data;
  },
  bumpKDSItem: async (orderId: string, itemId: string) => {
    const { data } = await api.patch(`/restaurant/kitchen/orders/${orderId}/items/${itemId}/bump`);
    return data;
  },
  recallKDSItem: async (orderId: string, itemId: string) => {
    const { data } = await api.patch(`/restaurant/kitchen/orders/${orderId}/items/${itemId}/recall`);
    return data;
  },
  markOrderRush: async (orderId: string, isRush: boolean) => {
    const { data } = await api.patch(`/restaurant/kitchen/orders/${orderId}/rush`, { is_rush: isRush });
    return data;
  },

  // Menu Management
  getMenuCategories: async () => {
    const { data } = await api.get('/restaurant/menu/categories');
    return data;
  },
  createMenuCategory: async (payload: any) => {
    const { data } = await api.post('/restaurant/menu/categories', payload);
    return data;
  },
  updateMenuCategory: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/menu/categories/${id}`, payload);
    return data;
  },
  deleteMenuCategory: async (id: string) => {
    const { data } = await api.delete(`/restaurant/menu/categories/${id}`);
    return data;
  },
  getMenuItems: async () => {
    const { data } = await api.get('/restaurant/menu/items');
    return data;
  },
  getActiveMenuItems: async () => {
    const { data } = await api.get('/restaurant/menu/items/active');
    return data;
  },
  createMenuItem: async (payload: any) => {
    const { data } = await api.post('/restaurant/menu/items', payload);
    return data;
  },
  updateMenuItem: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/menu/items/${id}`, payload);
    return data;
  },
  toggleEightySixed: async (id: string, isEightySixed: boolean) => {
    const { data } = await api.patch(`/restaurant/menu/items/${id}/86`, { is_eighty_sixed: isEightySixed });
    return data;
  },
  toggle86Product: async (menuItemId: string, is86d?: boolean) => {
    const { data } = await api.patch(`/restaurant/menu/products/${menuItemId}/86`, { is_86d: is86d });
    return data;
  },
  getModifierGroups: async () => {
    const { data } = await api.get('/restaurant/menu/modifier-groups');
    return data;
  },
  getProductModifiers: async (productId: string) => {
    const { data } = await api.get(`/restaurant/menu/products/${productId}/modifiers`);
    return data;
  },
  createModifierGroup: async (payload: any) => {
    const { data } = await api.post('/restaurant/menu/modifier-groups', payload);
    return data;
  },
  linkProductToModifierGroup: async (groupId: string, productId: string) => {
    const { data } = await api.post(`/restaurant/menu/modifier-groups/${groupId}/link/${productId}`);
    return data;
  },

  // Recipes
  getRecipeSummary: async () => {
    const { data } = await api.get('/restaurant/recipes/summary');
    return data;
  },
  getRecipes: async () => {
    const { data } = await api.get('/restaurant/recipes');
    return data;
  },
  getRecipe: async (id: string) => {
    const { data } = await api.get(`/restaurant/recipes/${id}`);
    return data;
  },
  createRecipe: async (payload: any) => {
    const { data } = await api.post('/restaurant/recipes', payload);
    return data;
  },
  updateRecipe: async (id: string, payload: any) => {
    const { data } = await api.patch(`/restaurant/recipes/${id}`, payload);
    return data;
  },
  getRecipeCost: async (id: string) => {
    const { data } = await api.get(`/restaurant/recipes/${id}/cost`);
    return data;
  },
  produceBatch: async (id: string, payload: { batch_count?: number; notes?: string }) => {
    const { data } = await api.post(`/restaurant/recipes/${id}/produce`, payload);
    return data;
  },
  checkProductionAvailability: async (id: string, batchCount?: number) => {
    const { data } = await api.get(`/restaurant/recipes/${id}/produce-check`, {
      params: { batch_count: batchCount || 1 },
    });
    return data;
  },

  // Reservations & Waitlist
  getReservations: async (date?: string) => {
    const { data } = await api.get('/restaurant/reservations', { params: { date } });
    return data;
  },
  checkReservationAvailability: async (date: string, partySize: number) => {
    const { data } = await api.get('/restaurant/reservations/availability', { params: { date, party_size: partySize } });
    return data;
  },
  createReservation: async (payload: any) => {
    const { data } = await api.post('/restaurant/reservations', payload);
    return data;
  },
  updateReservationStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/restaurant/reservations/${id}/status`, { status });
    return data;
  },
  getWaitlist: async () => {
    const { data } = await api.get('/restaurant/waitlist');
    return data;
  },
  addToWaitlist: async (payload: any) => {
    const { data } = await api.post('/restaurant/waitlist', payload);
    return data;
  },
  notifyWaitlist: async (id: string) => {
    const { data } = await api.patch(`/restaurant/waitlist/${id}/notify`);
    return data;
  },
  seatWaitlist: async (id: string, tableId: string) => {
    const { data } = await api.patch(`/restaurant/waitlist/${id}/seat`, { table_id: tableId });
    return data;
  },

  // Waiter Assignments
  assignWaiter: async (payload: any) => {
    const { data } = await api.post('/restaurant/staff/assignments', payload);
    return data;
  },
  getWaiterAssignments: async (shiftDate?: string) => {
    const { data } = await api.get('/restaurant/staff/assignments', { params: { shift_date: shiftDate } });
    return data;
  },
  getWaiterPerformance: async (userId: string) => {
    const { data } = await api.get(`/restaurant/staff/${userId}/performance`);
    return data;
  },

  // Analytics
  getRevenueByOrderType: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/analytics/revenue-by-type', { params: { branch_id: branchId } });
    return data;
  },
  getTableTurnTime: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/analytics/table-turns', { params: { branch_id: branchId } });
    return data;
  },
  getCoversAndPerHead: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/analytics/covers', { params: { branch_id: branchId } });
    return data;
  },
  getMenuPopularity: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/analytics/menu-popularity', { params: { branch_id: branchId } });
    return data;
  },
  getPeakHours: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/analytics/peak-hours', { params: { branch_id: branchId } });
    return data;
  },

  // Restaurant Operation Config
  getConfig: async (branchId?: string) => {
    const { data } = await api.get('/restaurant/config', { params: { branch_id: branchId } });
    return data;
  },
  updateConfig: async (payload: any, branchId?: string) => {
    const {
      id,
      tenant_id,
      organization_id,
      branch_id: _bId,
      created_at,
      updated_at,
      deleted_at,
      ...cleanPayload
    } = payload || {};
    const { data } = await api.patch('/restaurant/config', cleanPayload, { params: { branch_id: branchId } });
    return data;
  },
};
