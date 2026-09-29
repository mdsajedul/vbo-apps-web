import { create } from 'zustand';
import { toast } from 'sonner';

export interface CartItem {
  id: string; // unique cart line ID
  product_id?: string;
  variant_id?: string;
  name: string;
  sku: string;
  barcode?: string;
  unit_price: number; // in paisa
  quantity: number;
  maxStock?: number;
  discount_amount: number; // in paisa per item
  tax_rate_percentage: number;
  tax_amount?: number; // in paisa
  line_total?: number; // in paisa
  unit_cost?: number; // in paisa
  image_url?: string;
  serial_number?: string;
  batch_number?: string;
  seat_number?: number;
  course_name?: string;
  modifiers?: Array<{ name: string; price: number }>;
  notes?: string;
}

interface CartCustomer {
  id?: string;
  name: string;
  phone: string;
}

interface CartState {
  items: CartItem[];
  customer: CartCustomer | null;
  globalDiscount: number; // percentage
  isTaxInclusive: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity' | 'discount_amount'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setItemDiscount: (id: string, discount: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  setCustomer: (customer: CartCustomer | null) => void;
  setGlobalDiscount: (discount: number) => void;
  setIsTaxInclusive: (isInclusive: boolean) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getDiscountTotal: () => number;
  getTaxTotal: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  globalDiscount: 0,
  isTaxInclusive: true,

  addItem: (item, quantity = 1) => set((state) => {
    // Check if item already in cart (match by product_id + variant_id)
    const existingIndex = state.items.findIndex(
      (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
    );

    if (existingIndex >= 0) {
      const updated = [...state.items];
      const newQuantity = updated[existingIndex].quantity + quantity;
      
      if (updated[existingIndex].maxStock !== undefined && newQuantity > updated[existingIndex].maxStock!) {
        toast.error(`Only ${updated[existingIndex].maxStock} items available in stock`);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].maxStock!,
        };
      } else {
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
        };
      }
      return { items: updated };
    }

    // New item
    const initialQty = item.maxStock !== undefined ? Math.min(quantity, item.maxStock) : quantity;
    if (item.maxStock !== undefined && quantity > item.maxStock) {
      toast.error(`Only ${item.maxStock} items available in stock`);
    }

    const cartItem: CartItem = {
      ...item,
      id: `${item.product_id || ''}-${item.variant_id || ''}-${Date.now()}`,
      quantity: initialQty,
      discount_amount: 0,
    };
    return { items: [...state.items, cartItem] };
  }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((i) => i.id !== id),
  })),

  updateQuantity: (id, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter((i) => i.id !== id) };
    }
    return {
      items: state.items.map((i) => {
        if (i.id === id) {
          if (i.maxStock !== undefined && quantity > i.maxStock) {
            toast.error(`Only ${i.maxStock} items available in stock`);
            return { ...i, quantity: i.maxStock };
          }
          return { ...i, quantity };
        }
        return i;
      }),
    };
  }),

  setItemDiscount: (id, discount) => set((state) => ({
    items: state.items.map((i) => (i.id === id ? { ...i, discount_amount: discount } : i)),
  })),

  updateItemNotes: (id, notes) => set((state) => ({
    items: state.items.map((i) => (i.id === id ? { ...i, notes } : i)),
  })),

  setCustomer: (customer) => set({ customer }),

  setGlobalDiscount: (discount) => set({ globalDiscount: discount }),

  setIsTaxInclusive: (isInclusive) => set({ isTaxInclusive: isInclusive }),

  clearCart: () => set({ items: [], customer: null, globalDiscount: 0 }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  },

  getDiscountTotal: () => {
    const state = get();
    const itemDiscounts = state.items.reduce(
      (sum, item) => sum + item.discount_amount * item.quantity, 0
    );
    const subtotal = state.getSubtotal();
    const globalDiscount = Math.round(subtotal * (state.globalDiscount / 100));
    return itemDiscounts + globalDiscount;
  },

  getTaxTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => {
      const lineTotal = (item.unit_price - item.discount_amount) * item.quantity;
      const taxRate = (item.tax_rate_percentage || 0) / 100;
      
      if (state.isTaxInclusive) {
        // Tax is backed out from the line total
        return sum + Math.round(lineTotal - (lineTotal / (1 + taxRate)));
      } else {
        // Tax is added on top
        return sum + Math.round(lineTotal * taxRate);
      }
    }, 0);
  },

  getGrandTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const discount = state.getDiscountTotal();
    const tax = state.getTaxTotal();
    
    if (state.isTaxInclusive) {
       // Tax is already in the subtotal
       return subtotal - discount;
    } else {
       // Tax needs to be added
       return subtotal - discount + tax;
    }
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
