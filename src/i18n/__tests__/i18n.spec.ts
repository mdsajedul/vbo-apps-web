import { en } from '../locales/en';
import { bn } from '../locales/bn';
import { SUPPORTED_LOCALES, ACTIVE_LOCALES, DEFAULT_LOCALE } from '../config';
import { getNavTranslationKey } from '../nav-helper';

describe('i18n Multi-Language System Tests', () => {
  describe('Locale Configuration & Metadata', () => {
    it('should have DEFAULT_LOCALE set to English', () => {
      expect(DEFAULT_LOCALE).toBe('en');
    });

    it('should have English and Bangla active in Phase 1', () => {
      const activeCodes = ACTIVE_LOCALES.map((l) => l.code);
      expect(activeCodes).toContain('en');
      expect(activeCodes).toContain('bn');
      expect(activeCodes).not.toContain('ar');
      expect(activeCodes).not.toContain('hi');
    });

    it('should have Arabic configured with RTL direction for future phase', () => {
      expect(SUPPORTED_LOCALES.ar).toBeDefined();
      expect(SUPPORTED_LOCALES.ar.dir).toBe('rtl');
      expect(SUPPORTED_LOCALES.ar.enabled).toBe(false);
    });

    it('should have LTR direction for English and Bangla', () => {
      expect(SUPPORTED_LOCALES.en.dir).toBe('ltr');
      expect(SUPPORTED_LOCALES.bn.dir).toBe('ltr');
    });
  });

  describe('Dictionary Integrity', () => {
    it('should have valid non-empty common translations in English and Bangla', () => {
      expect(en.common.save).toBe('Save');
      expect(bn.common.save).toBe('সংরক্ষণ করুন');

      expect(en.common.cancel).toBe('Cancel');
      expect(bn.common.cancel).toBe('বাতিল');
    });

    it('should have valid POS translations in English and Bangla', () => {
      expect(en.pos.cart).toBe('Order Cart');
      expect(bn.pos.cart).toBe('অর্ডার কার্ট');

      expect(en.pos.pay_now).toBe('Pay Now');
      expect(bn.pos.pay_now).toBe('পেমেন্ট করুন');

      expect(en.pos.total_payable).toBe('Total Payable');
      expect(bn.pos.total_payable).toBe('মোট প্রদেয় বিল');
    });

    it('should have valid Auth translations in English and Bangla', () => {
      expect(en.auth.login_title).toBe('Welcome Back');
      expect(bn.auth.login_title).toBe('স্বাগতম');

      expect(en.auth.logout).toBe('Sign Out');
      expect(bn.auth.logout).toBe('লগআউট');
    });

    it('should have valid Navigation translations in English and Bangla', () => {
      expect(en.nav.inventory).toBe('Inventory');
      expect(bn.nav.inventory).toBe('ইনভেন্টরি');

      expect(en.nav.pos).toBe('Point of Sale (POS)');
      expect(bn.nav.pos).toBe('পয়েন্ট অফ সেল (POS)');
    });

    it('should have valid Catalog translations in English and Bangla', () => {
      expect(en.catalog.categories_page.title).toBe('Categories & Subcategories');
      expect(bn.catalog.categories_page.title).toBe('ক্যাটাগরি ও সাব-ক্যাটাগরি');

      expect(en.catalog.categories_page.create_category).toBe('Create Category');
      expect(bn.catalog.categories_page.create_category).toBe('নতুন ক্যাটাগরি তৈরি');

      expect(en.catalog.brands_page.title).toBe('Brand Directory');
      expect(bn.catalog.brands_page.title).toBe('ব্র্যান্ড ডিরেক্টরি');

      expect(en.catalog.brands_page.create_brand).toBe('Create Brand');
      expect(bn.catalog.brands_page.create_brand).toBe('নতুন ব্র্যান্ড তৈরি');

      expect(en.catalog.import_page.title).toBe('Import Products');
      expect(bn.catalog.import_page.title).toBe('পণ্য আমদানি');

      expect(en.catalog.new_product_page.title).toBe('Create New Product');
      expect(bn.catalog.new_product_page.title).toBe('নতুন পণ্য তৈরি করুন');
    });

    it('should have valid Inventory translations in English and Bangla', () => {
      expect(en.inventory.overview.title).toBe('Stock & Inventory');
      expect(bn.inventory.overview.title).toBe('স্টক ও ইনভেন্টরি');

      expect(en.inventory.batches.title).toBe('Product Batches & FEFO Traceability');
      expect(bn.inventory.batches.title).toBe('পণ্য ব্যাচ ও মেয়াদ ট্র্যাকিং (FEFO)');

      expect(en.inventory.transfers.title).toBe('Inter-Branch Stock Transfers');
      expect(bn.inventory.transfers.title).toBe('আন্তঃশাখা স্টক স্থানান্তর');

      expect(en.inventory.suppliers.title).toBe('Supplier Directory');
      expect(bn.inventory.suppliers.title).toBe('সরবরাহকারী ডিরেক্টরি');

      expect(en.inventory.adjust_modal.title).toBe('Stock Adjustment Ledger');
      expect(bn.inventory.adjust_modal.title).toBe('স্টক সমন্বয় লেজার');

      expect(en.inventory.supplier_modal.create_title).toBe('Register New Supplier');
      expect(bn.inventory.supplier_modal.create_title).toBe('নতুন সরবরাহকারী নিবন্ধন');
    });

    it('should have valid Warehouse translations in English and Bangla', () => {
      expect(en.warehouse.transfer_title).toBe('Internal Bin Transfer');
      expect(bn.warehouse.transfer_title).toBe('অভ্যন্তরীণ বিন স্থানান্তর');

      expect(en.warehouse.source_bin).toBe('Source Storage Bin');
      expect(bn.warehouse.source_bin).toBe('উৎস স্টোরেজ বিন (From)');
    });

    it('should have valid Sales translations in English and Bangla', () => {
      expect(en.sales.title).toBe('Sales Reports & Analytics');
      expect(bn.sales.title).toBe('বিক্রয় ও অডিট রিপোর্ট');

      expect(en.sales.returns_title).toBe('Sales Returns & Exchanges');
      expect(bn.sales.returns_title).toBe('বিক্রয় ফেরত ও এক্সচেঞ্জ (Returns)');
    });

    it('should have valid Invoices translations in English and Bangla', () => {
      expect(en.invoices.title).toBe('Invoices & Billing');
      expect(bn.invoices.title).toBe('ইনভয়েস ও বিলিং');

      expect(en.invoices.new_invoice_title).toBe('Create Customer Invoice');
      expect(bn.invoices.new_invoice_title).toBe('নতুন গ্রাহক ইনভয়েস তৈরি');
    });

    it('should have valid Customers translations in English and Bangla', () => {
      expect(en.customers.title).toBe('Customer Directory');
      expect(bn.customers.title).toBe('গ্রাহক ডিরেক্টরি');

      expect(en.customers.loyalty_title).toBe('Loyalty & Rewards Program');
      expect(bn.customers.loyalty_title).toBe('লয়্যালটি ও রিওয়ার্ড প্রোগ্রাম');

      expect(en.customers.gift_cards_title).toBe('Prepaid Gift Cards & Store Credit');
      expect(bn.customers.gift_cards_title).toBe('প্রিপেইড গিফট কার্ড ও স্টোর ক্রেডিট');
    });

    it('should have valid Accounting translations in English and Bangla', () => {
      expect(en.accounting.title).toBe('General Ledger & Financial Accounting');
      expect(bn.accounting.title).toBe('সাধারণ খতিয়ান ও আর্থিক হিসাববিজ্ঞান');

      expect(en.accounting.btn_add_account).toBe('Create Ledger Account');
      expect(bn.accounting.btn_add_account).toBe('নতুন খতিয়ান হিসাব তৈরি');
    });

    it('should have valid Settings translations in English and Bangla', () => {
      expect(en.settings.branches.title).toBe('Store Branches');
      expect(bn.settings.branches.title).toBe('স্টোর শাখাসমূহ');

      expect(en.settings.organization.title).toBe('Organization Profile');
      expect(bn.settings.organization.title).toBe('প্রতিষ্ঠান প্রোফাইল');

      expect(en.settings.tax.title).toBe('Tax & VAT Settings');
      expect(bn.settings.tax.title).toBe('ভ্যাট ও কর সেটিংস');

      expect(en.settings.uom.title).toBe('Units of Measure (UOM)');
      expect(bn.settings.uom.title).toBe('পরিমাপের একক (UOM)');

      expect(en.settings.users.title).toBe('Users & Staff');
      expect(bn.settings.users.title).toBe('ব্যবহারকারী ও কর্মী');
    });

    it('should have 100% key parity between English and Bengali for all modules', () => {
      function getDeepKeys(obj: Record<string, any>, prefix = ''): string[] {
        return Object.keys(obj).reduce((acc: string[], key: string) => {
          const pre = prefix.length ? prefix + '.' : '';
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            acc.push(...getDeepKeys(obj[key], pre + key));
          } else {
            acc.push(pre + key);
          }
          return acc;
        }, []);
      }

      const enKeys = getDeepKeys(en).sort();
      const bnKeys = getDeepKeys(bn).sort();
      expect(bnKeys).toEqual(enKeys);
    });
  });

  describe('Navigation Helper Translation Keys', () => {
    it('should map exact group and item titles to nav keys', () => {
      expect(getNavTranslationKey('Inventory')).toBe('nav.inventory');
      expect(getNavTranslationKey('Product Catalog')).toBe('nav.catalog');
      expect(getNavTranslationKey('Shift Management')).toBe('nav.shift_management');
      expect(getNavTranslationKey('Kitchen Display (KDS)')).toBe('nav.kitchen_display');
    });

    it('should sanitize arbitrary or new menu titles to valid snake_case keys', () => {
      expect(getNavTranslationKey('Special VIP Lounge')).toBe('nav.special_vip_lounge');
    });
  });
});
