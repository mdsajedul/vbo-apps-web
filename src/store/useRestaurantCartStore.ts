import { create } from 'zustand';
import { toast } from 'sonner';

export interface RestaurantCartItem {
  id: string; // unique cart line ID
  product_id?: string;
  variant_id?: string;
  menu_item_id?: string;
  name: string;
  sku: string;
  unit_price: number; // in paisa
  quantity: number;
  discount_amount: number; // in paisa per item
  tax_rate_percentage: number;
  image_url?: string;
  modifiers?: Array<{ id: string; name: string; price: number }>;
  notes?: string;
  is_fired?: boolean; // whether item was already sent to kitchen
}

interface RestaurantCartState {
  // Context state
  activeTableId: string | null;
  activeSession: any | null; // server session object or null
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

  // Per-table draft store: tableId -> CartItem[]
  tableDrafts: Record<string, RestaurantCartItem[]>;

  // Current active items
  items: RestaurantCartItem[];

  // Fired items set for KOT round tracking
  firedItemIds: string[];

  // Actions
  selectTable: (tableId: string | null, session?: any) => void;
  addItem: (item: Omit<RestaurantCartItem, 'id' | 'quantity' | 'discount_amount'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  loadSessionItems: (session: any) => void;
  markItemsFired: (itemIds: string[]) => void;
  getNewItems: () => RestaurantCartItem[];
  setOrderType: (orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  clearActiveCart: () => void;
  clearCart: () => void;
  clearTableDraft: (tableId: string) => void;


  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useRestaurantCartStore = create<RestaurantCartState>((set, get) => ({
  activeTableId: null,
  activeSession: null,
  orderType: 'DINE_IN',
  tableDrafts: {},
  items: [],
  firedItemIds: [],

  selectTable: (tableId, session = null) => set((state) => {
    const currentDrafts = { ...state.tableDrafts };
    const currentUnsentItems = state.items.filter((i) => !i.is_fired);

    // 1. Save current active items into tableDrafts if we had an active table
    if (state.activeTableId) {
      currentDrafts[state.activeTableId] = [...state.items];
    }

    if (!tableId) {
      return {
        activeTableId: null,
        activeSession: null,
        tableDrafts: currentDrafts,
        items: [],
        firedItemIds: [],
      };
    }

    // 2. Load items for target table
    let loadedItems: RestaurantCartItem[] = [];
    let loadedFiredIds: string[] = [];

    const hasServerOrders = session && session.orders && Array.isArray(session.orders) && session.orders.length > 0;

    if (hasServerOrders) {
      session.orders.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          if (!item.is_void) {
            const lineId = item.id || `fired-${item.product_id || item.menu_item_id}-${Date.now()}`;
            loadedItems.push({
              id: lineId,
              product_id: item.product_id || item.id,
              variant_id: item.variant_id,
              menu_item_id: item.menu_item_id,
              name: item.product_name,
              sku: item.sku || 'DISH',
              unit_price: Number(item.unit_price),
              quantity: Number(item.quantity),
              discount_amount: Number(item.discount_amount || 0),
              tax_rate_percentage: 5,
              is_fired: true,
              image_url: item.image_url || item.product?.image_url,
              notes: item.special_instructions,
              modifiers: item.modifier_selections?.map((m: any) => ({
                id: m.modifier_id || m.id,
                name: m.modifier_name,
                price: m.modifier_price,
              })),
            });
            loadedFiredIds.push(lineId);
          }
        });
      });

      // Merge unsent local draft items for this table or orphan items added prior to table selection
      const previousTableUnsent = (currentDrafts[tableId] || []).filter((i) => !i.is_fired);
      const unsentToAttach = [...previousTableUnsent, ...currentUnsentItems];

      const existingIds = new Set(loadedItems.map((i) => i.id));
      unsentToAttach.forEach((uItem) => {
        if (!existingIds.has(uItem.id)) {
          loadedItems.push(uItem);
          existingIds.add(uItem.id);
        }
      });
    } else {
      // Table is AVAILABLE (no server orders)
      const existingTableDraft = currentDrafts[tableId] || [];

      if (currentUnsentItems.length > 0) {
        // Items were added while NO table was selected (or from another table) -> Preserve and transfer them to the newly selected available table!
        const existingIds = new Set(existingTableDraft.map((i) => i.id));
        const mergedUnsent = [...existingTableDraft];
        currentUnsentItems.forEach((uItem) => {
          if (!existingIds.has(uItem.id)) {
            mergedUnsent.push(uItem);
            existingIds.add(uItem.id);
          }
        });
        loadedItems = mergedUnsent;
      } else {
        // Normal table switch or no orphan items
        loadedItems = existingTableDraft;
      }

      loadedFiredIds = loadedItems.filter((i) => i.is_fired).map((i) => i.id);
    }

    // Keep draft store updated for the new tableId
    currentDrafts[tableId] = loadedItems;

    return {
      activeTableId: tableId,
      activeSession: session,
      tableDrafts: currentDrafts,
      items: loadedItems,
      firedItemIds: loadedFiredIds,
    };
  }),

  addItem: (item, quantity = 1) => set((state) => {
    // Check if item already in current active cart (and NOT yet fired)
    const existingIndex = state.items.findIndex(
      (i) => i.product_id === item.product_id && i.variant_id === item.variant_id && !i.is_fired
    );

    if (existingIndex >= 0) {
      const updated = [...state.items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
      const newDrafts = { ...state.tableDrafts };
      if (state.activeTableId) {
        newDrafts[state.activeTableId] = updated;
      }
      return { items: updated, tableDrafts: newDrafts };
    }

    // New line item
    const newItem: RestaurantCartItem = {
      ...item,
      id: `${item.product_id || item.menu_item_id || 'item'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      quantity,
      discount_amount: 0,
      is_fired: false,
    };

    const updated = [...state.items, newItem];
    const newDrafts = { ...state.tableDrafts };
    if (state.activeTableId) {
      newDrafts[state.activeTableId] = updated;
    }

    return { items: updated, tableDrafts: newDrafts };
  }),

  removeItem: (id) => set((state) => {
    const updated = state.items.filter((i) => i.id !== id);
    const newDrafts = { ...state.tableDrafts };
    if (state.activeTableId) {
      newDrafts[state.activeTableId] = updated;
    }
    return {
      items: updated,
      tableDrafts: newDrafts,
      firedItemIds: state.firedItemIds.filter((fId) => fId !== id),
    };
  }),

  updateQuantity: (id, quantity) => set((state) => {
    if (quantity <= 0) {
      const updated = state.items.filter((i) => i.id !== id);
      const newDrafts = { ...state.tableDrafts };
      if (state.activeTableId) {
        newDrafts[state.activeTableId] = updated;
      }
      return {
        items: updated,
        tableDrafts: newDrafts,
        firedItemIds: state.firedItemIds.filter((fId) => fId !== id),
      };
    }

    const updated = state.items.map((i) => (i.id === id ? { ...i, quantity } : i));
    const newDrafts = { ...state.tableDrafts };
    if (state.activeTableId) {
      newDrafts[state.activeTableId] = updated;
    }

    return { items: updated, tableDrafts: newDrafts };
  }),

  updateItemNotes: (id, notes) => set((state) => {
    const updated = state.items.map((i) => (i.id === id ? { ...i, notes } : i));
    const newDrafts = { ...state.tableDrafts };
    if (state.activeTableId) {
      newDrafts[state.activeTableId] = updated;
    }
    return { items: updated, tableDrafts: newDrafts };
  }),

  loadSessionItems: (session) => set((state) => {
    if (!session) return state;

    const loadedItems: RestaurantCartItem[] = [];
    const loadedFiredIds: string[] = [];

    if (session.orders) {
      session.orders.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          if (!item.is_void) {
            const lineId = item.id || `fired-${item.product_id || item.menu_item_id}-${Date.now()}`;
            loadedItems.push({
              id: lineId,
              product_id: item.product_id || item.id,
              variant_id: item.variant_id,
              menu_item_id: item.menu_item_id,
              name: item.product_name,
              sku: item.sku || 'DISH',
              unit_price: Number(item.unit_price),
              quantity: Number(item.quantity),
              discount_amount: Number(item.discount_amount || 0),
              tax_rate_percentage: 5,
              is_fired: true,
              image_url: item.image_url || item.product?.image_url,
              notes: item.special_instructions,
              modifiers: item.modifier_selections?.map((m: any) => ({
                id: m.modifier_id || m.id,
                name: m.modifier_name,
                price: m.modifier_price,
              })),
            });
            loadedFiredIds.push(lineId);
          }
        });
      });
    }

    const tableId = session.table_id || session.table?.id || state.activeTableId;
    const newDrafts = { ...state.tableDrafts };
    if (tableId) {
      newDrafts[tableId] = loadedItems;
    }

    return {
      activeSession: session,
      activeTableId: tableId,
      items: loadedItems,
      firedItemIds: loadedFiredIds,
      tableDrafts: newDrafts,
    };
  }),

  markItemsFired: (itemIds) => set((state) => {
    const updated = state.items.map((i) => (itemIds.includes(i.id) ? { ...i, is_fired: true } : i));
    const newFiredIds = Array.from(new Set([...state.firedItemIds, ...itemIds]));
    const newDrafts = { ...state.tableDrafts };
    if (state.activeTableId) {
      newDrafts[state.activeTableId] = updated;
    }

    return {
      items: updated,
      firedItemIds: newFiredIds,
      tableDrafts: newDrafts,
    };
  }),

  getNewItems: () => {
    const state = get();
    return state.items.filter((item) => !item.is_fired && !state.firedItemIds.includes(item.id));
  },

  setOrderType: (orderType) => set({ orderType }),

  clearActiveCart: () => set((state) => {
    const newDrafts = { ...state.tableDrafts };
    if (state.activeTableId) {
      delete newDrafts[state.activeTableId];
    }
    return {
      items: [],
      firedItemIds: [],
      activeSession: null,
      activeTableId: null,
      tableDrafts: newDrafts,
    };
  }),

  clearCart: () => {
    get().clearActiveCart();
  },


  clearTableDraft: (tableId) => set((state) => {
    const newDrafts = { ...state.tableDrafts };
    delete newDrafts[tableId];
    if (state.activeTableId === tableId) {
      return {
        items: [],
        firedItemIds: [],
        activeSession: null,
        tableDrafts: newDrafts,
      };
    }
    return { tableDrafts: newDrafts };
  }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const modifierSum = item.modifiers ? item.modifiers.reduce((s, m) => s + (m.price || 0), 0) : 0;
      return sum + (item.unit_price + modifierSum) * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
