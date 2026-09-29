import { VBO_PRODUCTS } from '../ProductLauncher';
import { SEARCH_INDEX } from '../UniversalSearch';

describe('Unified Multi-Product App Shell', () => {
  describe('ProductLauncher Architecture', () => {
    it('should configure all 4 core VBO ecosystem products', () => {
      const productIds = VBO_PRODUCTS.map((p) => p.id);
      expect(productIds).toEqual(['erp', 'connect', 'platform', 'ecommerce']);
    });

    it('should provide complete metadata for VBO ERP', () => {
      const erp = VBO_PRODUCTS.find((p) => p.id === 'erp');
      expect(erp).toBeDefined();
      expect(erp?.name).toBe('VBO ERP');
      expect(erp?.category).toBe('Operations & POS');
      expect(erp?.route).toBe('/dashboard');
      expect(erp?.isExternal).toBeFalsy();
    });

    it('should provide complete metadata for VBO Connect', () => {
      const connect = VBO_PRODUCTS.find((p) => p.id === 'connect');
      expect(connect).toBeDefined();
      expect(connect?.name).toBe('VBO Connect');
      expect(connect?.category).toBe('Customer Messaging');
      expect(connect?.route).toBe('/connect');
      expect(connect?.isExternal).toBeFalsy();
    });

    it('should determine active product ID based on pathname', () => {
      const getActiveProductId = (pathname: string) => {
        if (pathname.startsWith('/connect')) return 'connect';
        if (pathname.startsWith('/ecommerce')) return 'ecommerce';
        return 'erp';
      };

      expect(getActiveProductId('/dashboard')).toBe('erp');
      expect(getActiveProductId('/pos')).toBe('erp');
      expect(getActiveProductId('/catalog/products')).toBe('erp');
      expect(getActiveProductId('/connect')).toBe('connect');
      expect(getActiveProductId('/connect/inbox')).toBe('connect');
      expect(getActiveProductId('/connect/campaigns')).toBe('connect');
      expect(getActiveProductId('/ecommerce/channels')).toBe('ecommerce');
    });
  });

  describe('UniversalSearch (Command Palette)', () => {
    it('should index both ERP Operations and Connect Messaging items', () => {
      const erpItems = SEARCH_INDEX.filter((i) => i.category === 'ERP Operations');
      const connectItems = SEARCH_INDEX.filter((i) => i.category === 'Connect Messaging');
      const actionItems = SEARCH_INDEX.filter((i) => i.category === 'Quick Actions');

      expect(erpItems.length).toBeGreaterThanOrEqual(8);
      expect(connectItems.length).toBeGreaterThanOrEqual(6);
      expect(actionItems.length).toBeGreaterThanOrEqual(3);
    });

    it('should accurately filter by keyword across products', () => {
      const filterSearch = (query: string) => {
        const q = query.trim().toLowerCase();
        return SEARCH_INDEX.filter((item) => {
          const titleMatch = item.title.toLowerCase().includes(q);
          const subMatch = item.subtitle.toLowerCase().includes(q);
          const kwMatch = item.keywords?.some((k) => k.toLowerCase().includes(q));
          return titleMatch || subMatch || kwMatch;
        });
      };

      // WhatsApp search should return Connect items
      const whatsappResults = filterSearch('whatsapp');
      expect(whatsappResults.some((r) => r.id === 'connect-inbox')).toBe(true);
      expect(whatsappResults.some((r) => r.id === 'connect-campaigns')).toBe(true);

      // Billing/POS search should return POS
      const posResults = filterSearch('billing');
      expect(posResults.some((r) => r.id === 'erp-pos')).toBe(true);

      // VAT/Mushak search should return Financial Reports
      const reportResults = filterSearch('mushak');
      expect(reportResults.some((r) => r.id === 'erp-reports')).toBe(true);
    });
  });
});
