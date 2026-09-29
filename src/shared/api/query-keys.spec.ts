import { queryKeys } from './query-keys';

describe('queryKeys Factory', () => {
  describe('products', () => {
    it('should generate hierarchical query keys', () => {
      expect(queryKeys.products.all).toEqual(['products']);
      expect(queryKeys.products.lists()).toEqual(['products', 'list']);
      expect(queryKeys.products.list({ search: 'shoes', limit: 10 })).toEqual([
        'products',
        'list',
        { search: 'shoes', limit: 10 },
      ]);
      expect(queryKeys.products.detail('prod-123')).toEqual([
        'products',
        'detail',
        'prod-123',
      ]);
    });
  });

  describe('pos', () => {
    it('should generate branch-scoped shift query keys', () => {
      expect(queryKeys.pos.all).toEqual(['pos']);
      expect(queryKeys.pos.currentShift('branch-1')).toEqual([
        'pos',
        'shift',
        'current',
        'branch-1',
      ]);
      expect(queryKeys.pos.currentShift()).toEqual([
        'pos',
        'shift',
        'current',
        'global',
      ]);
      expect(queryKeys.pos.activeGlobalShift()).toEqual([
        'pos',
        'shift',
        'active-global',
      ]);
    });
  });

  describe('inventory', () => {
    it('should generate inventory list and branch query keys', () => {
      expect(queryKeys.inventory.all).toEqual(['inventory']);
      expect(queryKeys.inventory.byBranch('b-99')).toEqual([
        'inventory',
        'branch',
        'b-99',
      ]);
    });
  });

  describe('sales and customers', () => {
    it('should generate sales and customers query keys', () => {
      expect(queryKeys.sales.list({ page: 2 })).toEqual([
        'sales',
        'list',
        { page: 2 },
      ]);
      expect(queryKeys.customers.detail('cust-1')).toEqual([
        'customers',
        'detail',
        'cust-1',
      ]);
      expect(queryKeys.customers.points('cust-1')).toEqual([
        'customers',
        'points',
        'cust-1',
      ]);
    });
  });
});
