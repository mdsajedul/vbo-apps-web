import { useCartStore } from './useCartStore';

describe('useCartStore (Zustand Pure Client State)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should initialize with empty items, no customer, and tax inclusive', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.customer).toBeNull();
    expect(state.isTaxInclusive).toBe(true);
    expect(state.getItemCount()).toBe(0);
    expect(state.getGrandTotal()).toBe(0);
  });

  it('should add item and calculate line totals correctly', () => {
    useCartStore.getState().addItem({
      product_id: 'prod-1',
      name: 'Smart Watch',
      sku: 'SW-001',
      unit_price: 500000, // 5,000 BDT in paisa
      tax_rate_percentage: 15,
    }, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.getItemCount()).toBe(2);
    expect(state.getSubtotal()).toBe(1000000);
    expect(state.getGrandTotal()).toBe(1000000);
  });

  it('should increment quantity when adding the same product variant', () => {
    const item = {
      product_id: 'prod-1',
      variant_id: 'var-1',
      name: 'T-Shirt',
      sku: 'TSH-01',
      unit_price: 80000,
      tax_rate_percentage: 7.5,
    };

    useCartStore.getState().addItem(item, 1);
    useCartStore.getState().addItem(item, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(state.getItemCount()).toBe(3);
  });

  it('should enforce max stock limit and clamp quantity', () => {
    const itemWithStock = {
      product_id: 'prod-rare',
      name: 'Rare Item',
      sku: 'RARE-01',
      unit_price: 100000,
      tax_rate_percentage: 0,
      maxStock: 3,
    };

    // Attempt to add 5 when only 3 in stock
    useCartStore.getState().addItem(itemWithStock, 5);

    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(3);
  });

  it('should apply item discount and global percentage discount', () => {
    useCartStore.getState().addItem({
      product_id: 'prod-1',
      name: 'Item 1',
      sku: 'ITM-01',
      unit_price: 100000, // 1,000
      tax_rate_percentage: 0,
    }, 2);

    const itemId = useCartStore.getState().items[0].id;
    // Set 100 BDT (10000 paisa) discount per item
    useCartStore.getState().setItemDiscount(itemId, 10000);

    let state = useCartStore.getState();
    // Subtotal: 200,000. Item discount: 20,000. Net: 180,000
    expect(state.getDiscountTotal()).toBe(20000);
    expect(state.getGrandTotal()).toBe(180000);

    // Apply 10% global discount
    useCartStore.getState().setGlobalDiscount(10);
    // Subtotal: 200,000. Item discount: 20,000. Global 10% discount: 20,000. Total discount: 40,000. Grand total: 160,000
    expect(state.getDiscountTotal()).toBe(40000);
    expect(state.getGrandTotal()).toBe(160000);
  });

  it('should set and clear customer details', () => {
    useCartStore.getState().setCustomer({
      id: 'cust-1',
      name: 'Karim Ahmed',
      phone: '+8801700000000',
    });

    expect(useCartStore.getState().customer?.name).toBe('Karim Ahmed');

    useCartStore.getState().setCustomer(null);
    expect(useCartStore.getState().customer).toBeNull();
  });

  it('should remove item and clear cart', () => {
    useCartStore.getState().addItem({
      product_id: 'prod-1',
      name: 'Item 1',
      sku: 'ITM-01',
      unit_price: 50000,
      tax_rate_percentage: 0,
    }, 1);

    const itemId = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(itemId);
    expect(useCartStore.getState().items).toHaveLength(0);

    useCartStore.getState().addItem({
      product_id: 'prod-2',
      name: 'Item 2',
      sku: 'ITM-02',
      unit_price: 50000,
      tax_rate_percentage: 0,
    }, 1);

    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().customer).toBeNull();
    expect(useCartStore.getState().globalDiscount).toBe(0);
  });
});
